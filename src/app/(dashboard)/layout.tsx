import { Navbar } from "@/components/layout/navbar";
import AuthGuard from "@/modules/auth/components/auth-guard"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="h-screen bg-[#0F1116] text-slate-200 font-sans flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 pt-16 w-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}