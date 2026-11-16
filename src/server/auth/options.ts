import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { clientIp, verifyCredentials } from "./credentials";

// Sesión JWT en cookie httpOnly (next-auth la marca httpOnly, SameSite=Lax y Secure con https).
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/acceso" },
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      // Si lanza TooManyAttemptsError, el cliente recibe error="DEMASIADOS_INTENTOS".
      authorize: (credentials, req) => verifyCredentials(credentials, clientIp(req.headers)),
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({ ...session, user: { ...session.user, id: token.sub ?? "" } }),
  },
};
