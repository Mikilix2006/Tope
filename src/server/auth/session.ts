import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./options";

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user.id || null;
}

// Para páginas y acciones privadas: sin sesión, a /acceso. Toda consulta de datos usa este id, nunca uno que venga del cliente.
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/acceso");
  return id;
}
