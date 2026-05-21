import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { ROUTES, QUESTION_STATUSES, SESSION_STATUSES } from "@/lib/constants";
import type { BadgeColor } from "@/components/ui";

export default async function UserDashboard() {
  const user = await requireRole("USER", "SUPERADMIN");

  const [recentQuestions, upcomingSessions] = await Promise.all([
    prisma.question.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.session.findMany({
      where: { userId: user.id, status: { in: ["CONFIRMED", "PENDING"] } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1>Welcome, {user.name}</h1>
        <p className="mt-1 text-gray-600">Here&apos;s an overview of your activity.</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={ROUTES.ask}>Ask a Question</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.book}>Book a Session</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent questions */}
        <Card>
          <CardHeader
            title="Recent Questions"
            action={
              <Link href={ROUTES.dashboard.userQuestions} className="text-sm text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-4 space-y-3">
            {recentQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">No questions yet.</p>
            ) : (
              recentQuestions.map((q) => (
                <Link
                  key={q.id}
                  href={`${ROUTES.dashboard.userQuestions}/${q.id}`}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <p className="text-sm text-gray-900 truncate max-w-xs">{q.content}</p>
                  <Badge color={QUESTION_STATUSES[q.status].color as BadgeColor}>
                    {QUESTION_STATUSES[q.status].label}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming sessions */}
        <Card>
          <CardHeader
            title="Upcoming Sessions"
            action={
              <Link href={ROUTES.dashboard.userSessions} className="text-sm text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming sessions.</p>
            ) : (
              upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`${ROUTES.dashboard.userSessions}/${s.id}`}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.date}</p>
                    <p className="text-xs text-gray-500">{s.startTime} – {s.endTime} · {s.durationMinutes} min</p>
                  </div>
                  <Badge color={SESSION_STATUSES[s.status].color as BadgeColor}>
                    {SESSION_STATUSES[s.status].label}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
