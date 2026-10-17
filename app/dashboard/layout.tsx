import { requireAuth } from "@/lib/session";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />
      <main id="main" className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
