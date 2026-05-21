import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, Badge } from "@/components/ui";
import { ROUTES, ROLES } from "@/lib/constants";
import type { Role } from "@/types";
import type { BadgeColor } from "@/components/ui";

const ROLE_COLORS: Record<Role, BadgeColor> = {
  SUPERADMIN: "red",
  WORKER: "blue",
  IMAM: "gold",
  USER: "gray",
};

export default async function AdminDashboard() {
  await requireSuperadmin();

  const [users, mosque, questionCount, sessionCount] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }),
    prisma.mosque.findFirst(),
    prisma.question.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.session.count({ where: { status: { in: ["CONFIRMED", "PENDING"] } } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">{mosque?.name ?? "No mosque configured"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length },
          { label: "Active Staff", value: users.filter((u) => u.role !== "USER" && u.isActive).length },
          { label: "Open Questions", value: questionCount },
          { label: "Upcoming Sessions", value: sessionCount },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center">
            <p className="text-3xl font-bold text-brand-700">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff list */}
        <Card>
          <CardHeader
            title="Staff Accounts"
            action={
              <Link href={ROUTES.dashboard.adminAccounts} className="text-sm text-brand-700 hover:underline">
                Manage
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {users
              .filter((u) => u.role !== "USER")
              .map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={ROLE_COLORS[u.role]}>
                      {ROLES[u.role].label}
                    </Badge>
                    {!u.isActive && <Badge color="red">Deactivated</Badge>}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Mosque settings */}
        <Card>
          <CardHeader
            title="Mosque Profile"
            action={
              <Link href={ROUTES.dashboard.adminMosque} className="text-sm text-brand-700 hover:underline">
                Edit
              </Link>
            }
          />
          {mosque ? (
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Name:</span> {mosque.name}</p>
              <p><span className="font-medium">Address:</span> {mosque.address}</p>
              <p><span className="font-medium">Language:</span> {mosque.primaryLanguage}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No mosque profile configured yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
