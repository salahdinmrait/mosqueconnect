import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountsManager } from "@/components/admin/AccountsManager";

export default async function AdminAccountsPage() {
  await requireSuperadmin();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1>Manage Accounts</h1>
      <AccountsManager users={users} />
    </div>
  );
}
