import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F1116] text-slate-200 font-sans">
      <Navbar />
      <main className="pt-24 w-full px-4 md:px-8 pb-10">
        {children}
      </main>
    </div>
  );
}