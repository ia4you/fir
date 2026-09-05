import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/adminAuth";
import AdminTabs from "../components/AdminTabs";

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();
  if (!session) redirect("/inicio");

  return (
    <div className="min-h-screen bg-surface pb-10">
      <header className="flex items-center justify-between gap-3 border-b border-track bg-card px-5 pt-safe pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Panel de administración</h1>
          <p className="text-sm text-ink-muted">FIR Turel</p>
        </div>
        <Link href="/inicio" className="flex-shrink-0 text-sm font-bold text-brand">
          ← Volver a la app
        </Link>
      </header>

      <div className="bg-card">
        <AdminTabs />
      </div>

      <main className="px-5 py-6">{children}</main>
    </div>
  );
}
