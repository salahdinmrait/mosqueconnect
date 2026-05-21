import Link from "next/link";
import { requireImam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, Badge } from "@/components/ui";
import { ROUTES, QUESTION_STATUSES, SESSION_STATUSES } from "@/lib/constants";
import { format, addDays } from "date-fns";
import type { BadgeColor } from "@/components/ui";

export default async function ImamDashboard() {
  const user = await requireImam();

  const today = format(new Date(), "yyyy-MM-dd");
  const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [escalatedQuestions, upcomingSessions] = await Promise.all([
    prisma.question.findMany({
      where: { status: "ESCALATED" },
      include: {
        escalationNote: { include: { worker: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.session.findMany({
      where: {
        imamId: user.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        date: { gte: today, lte: nextWeek },
      },
      include: { user: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1>Imam Dashboard</h1>
        <p className="mt-1 text-gray-600">Assalamu alaikum, {user.name}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escalated questions */}
        <Card>
          <CardHeader
            title="Escalated Questions"
            action={
              <Link href={ROUTES.dashboard.imamQuestions} className="text-sm text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {escalatedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">No escalated questions.</p>
            ) : (
              escalatedQuestions.map((q) => (
                <Link
                  key={q.id}
                  href={`${ROUTES.dashboard.imamQuestions}/${q.id}`}
                  className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.content}</p>
                    {q.escalationNote && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        Note: {q.escalationNote.note.slice(0, 80)}…
                      </p>
                    )}
                  </div>
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
            title="Upcoming Sessions (7 days)"
            action={
              <Link href={ROUTES.dashboard.imamSessions} className="text-sm text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming sessions this week.</p>
            ) : (
              upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`${ROUTES.dashboard.imamSessions}/${s.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.date} · {s.startTime}</p>
                    <p className="text-xs text-gray-500">{s.user.name} · {s.durationMinutes} min</p>
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
