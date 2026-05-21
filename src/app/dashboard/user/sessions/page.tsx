import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, Button } from "@/components/ui";
import { SESSION_STATUSES, ROUTES } from "@/lib/constants";
import type { BadgeColor } from "@/components/ui";

export default async function UserSessionsPage() {
  const user = await requireRole("USER", "SUPERADMIN");

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    include: {
      imam: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const upcoming = sessions.filter((s) => s.status === "CONFIRMED" || s.status === "PENDING");
  const past = sessions.filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>My Sessions</h1>
        <Button asChild>
          <Link href={ROUTES.book}>Book a Session</Link>
        </Button>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card><p className="text-gray-500 text-sm">No upcoming sessions.</p></Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <Link key={s.id} href={`/dashboard/user/sessions/${s.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{s.date} · {s.startTime}–{s.endTime}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{s.topic}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        With {s.imam.name} · {s.mode === "VIDEO" ? "Video Call" : "In Person"} · {s.durationMinutes} min
                      </p>
                    </div>
                    <Badge color={SESSION_STATUSES[s.status].color as BadgeColor}>
                      {SESSION_STATUSES[s.status].label}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Past</h2>
          <div className="space-y-3">
            {past.map((s) => (
              <Link key={s.id} href={`/dashboard/user/sessions/${s.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{s.date} · {s.startTime}–{s.endTime}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{s.topic}</p>
                    </div>
                    <Badge color={SESSION_STATUSES[s.status].color as BadgeColor}>
                      {SESSION_STATUSES[s.status].label}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
