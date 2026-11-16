import * as z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "./password";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; errors: Partial<Record<"name" | "email" | "password", string[]>> };

const EMAIL_TAKEN: RegisterResult = { ok: false, errors: { email: ["Ya existe una cuenta con ese email."] } };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };

  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return EMAIL_TAKEN;

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), profile: { create: {} } },
      select: { id: true },
    });
    return { ok: true, userId: user.id };
  } catch (e) {
    // Dos registros simultáneos con el mismo email: gana el primero.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return EMAIL_TAKEN;
    throw e;
  }
}
