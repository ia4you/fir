import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export const EMAIL_ADMIN = "jose@turel.es";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== EMAIL_ADMIN) return null;
  return session;
}
