import { NextRequest } from "next/server";
import { format, addDays, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendSessionReminder } from "@/lib/notifications";
import { apiSuccess, apiError } from "@/lib/auth";

/**
 * GET /api/notifications/reminders
 *
 * Called by Vercel cron every hour. Finds sessions happening in the next 24–25 hours
 * (one-hour window to account for cron jitter) and sends reminder emails to both
 * the user and the imam, but only if we haven't sent one already.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron or an authorised source
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorised", 401);
  }

  const now = new Date();
  const tomorrow = addDays(now, 1);
  const tomorrowDate = format(tomorrow, "yyyy-MM-dd");

  // Find sessions happening tomorrow that haven't been reminded yet
  const sessions = await prisma.session.findMany({
    where: {
      date: tomorrowDate,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      imam: { select: { id: true, name: true, email: true } },
    },
  });

  let sent = 0;

  for (const session of sessions) {
    // Check we haven't already sent a reminder for this session
    const alreadySent = await prisma.notification.findFirst({
      where: {
        type: "session_reminder",
        metadata: { path: ["sessionId"], equals: session.id },
      },
    });

    if (alreadySent) continue;

    await Promise.all([
      sendSessionReminder(session, session.user, "user"),
      sendSessionReminder(session, session.imam, "imam"),
    ]);

    sent++;
  }

  return apiSuccess({ sessionsFound: sessions.length, remindersSent: sent });
}
