import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";

export const authOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { rows } = await query(
          `SELECT id, nombre, email, password_hash, plan FROM usuarios WHERE email = $1`,
          [credentials.email.toLowerCase().trim()]
        );
        const usuario = rows[0];
        if (!usuario) return null;

        const valido = await bcrypt.compare(credentials.password, usuario.password_hash);
        if (!valido) return null;

        return {
          id: String(usuario.id),
          name: usuario.nombre,
          email: usuario.email,
          plan: usuario.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.plan = user.plan;
      }
      if (trigger === "update") {
        // tras pasar por Stripe Checkout, releemos el plan real de la BD en
        // vez de esperar a que el usuario cierre y abra sesión de nuevo
        const { rows } = await query(`SELECT plan FROM usuarios WHERE id = $1`, [token.id]);
        if (rows[0]) token.plan = rows[0].plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.plan = token.plan;
      return session;
    },
  },
};
