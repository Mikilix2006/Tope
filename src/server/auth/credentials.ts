import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { checkPassword, DUMMY_HASH } from "./password";

// Límite de intentos fallidos dentro de la ventana; un acierto borra los fallos de ese email.
export const LOGIN_LIMIT = { perEmail: 5, perIp: 20, windowMinutes: 15 };

export class TooManyAttemptsError extends Error {
  constructor() {
    super("DEMASIADOS_INTENTOS");
  }
}

export type AuthUser = { id: string; email: string; name: string };

/**
 * Comprueba email y contraseña. Devuelve el usuario o null.
 * Lanza TooManyAttemptsError si el email o la IP superan el límite (aunque la contraseña sea correcta).
 */
export async function verifyCredentials(input: unknown, ip: string): Promise<AuthUser | null> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const since = new Date(Date.now() - LOGIN_LIMIT.windowMinutes * 60_000);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { ip, createdAt: { gte: since } } }),
  ]);
  if (byEmail >= LOGIN_LIMIT.perEmail || byIp >= LOGIN_LIMIT.perIp) throw new TooManyAttemptsError();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  const ok = await checkPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    await prisma.$transaction([
      prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: since } } }),
      prisma.loginAttempt.create({ data: { email, ip } }),
    ]);
    return null;
  }

  await prisma.loginAttempt.deleteMany({ where: { email } });
  return { id: user.id, email: user.email, name: user.name };
}

// shortcut: confía en X-Forwarded-For, válido solo detrás de un proxy (Caddy) que lo sobrescribe; sin proxy, leer la IP del socket.
export function clientIp(headers: Record<string, unknown> | undefined): string {
  const forwarded = headers?.["x-forwarded-for"];
  const first = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;
  return first || "desconocida";
}
