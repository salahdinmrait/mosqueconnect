import Link from "next/link";
import { requireWorker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, Badge } from "@/components/ui";
import { ROUTES, QUESTION_STATUSES } from "@/lib/constants";
import type { BadgeColor } from "@/components/ui";

export default async function WorkerDashboard() {
  const user = await requireWorker();

  const [openCount, inProgressCount, escalatedCount, recentQuestions] = await Promise.all([
    prisma.question.count({ where: { status: "OPEN" } }),
    prisma.question.count({ where: { status: "IN_PROGRESS" } }),
    prisma.question.count({ where: { status: "ESCALATED" } }),
    prisma.question.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1>Worker Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage the community question queue and FAQ.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: openCount, color: "text-blue-700 bg-blue-50" },
          { label: "In Progress", count: inProgressCount, color: "text-yellow-700 bg-yellow-50" },
          { label: "Escalated", count: escalatedCount, color: "text-orange-700 bg-orange-50" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="text-center">
            <p className={`text-3xl font-bold ${color.split(" ")[0]}`}>{count}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Question queue preview */}
      <Card>
        <CardHeader
          title="Question Queue (oldest first)"
          action={
            <Link href={ROUTES.dashboard.workerQuestions} className="text-sm text-brand-700 hover:underline">
              View all
            </Link>
          }
        />
        <div className="mt-4 space-y-2">
          {recentQuestions.length === 0 ? (
            <p className="text-sm text-gray-500">All questions are handled. 🎉</p>
          ) : (
            recentQuestions.map((q) => (
              <Link
                key={q.id}
                href={`${ROUTES.dashboard.workerQuestions}/${q.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">{q.content}</p>
                  <p className="text-xs text-gray-500">{q.category} · {new Date(q.createdAt).toLocaleString()}</p>
                </div>
                <Badge color={QUESTION_STATUSES[q.status].color as BadgeColor} className="ml-3 shrink-0">
                  {QUESTION_STATUSES[q.status].label}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
