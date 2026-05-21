import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/navigation/DashboardNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardNav
        role={user.role}
        userName={user.name}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container-page py-8">{children}</div>
      </main>
    </div>
  );
}
