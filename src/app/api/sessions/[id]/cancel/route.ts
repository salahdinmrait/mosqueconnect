import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiNotFound, apiUnauthorized } from "@/lib/auth";
import { sendSessionCancellation } from "@/lib/notifications";

const schema = z.object({
  reason: z.string().min(5).max(500),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      imam: { select: { id: true, name: true, email: true } },
    },
  });

  if (!session) return apiNotFound();

  // Only the session's user or imam (or admin) can cancel
  if (
    user.role === "USER" && session.userId !== user.id ||
    user.role === "IMAM" && session.imamId !== user.id
  ) {
    return apiForbidden();
  }

  if (session.status === "CANCELLED") return apiError("Session is already cancelled", 400);
  if (session.status === "COMPLETED") return apiError("Cannot cancel a completed session", 400);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  await prisma.session.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancellationReason: parsed.data.reason,
      cancelledBy: user.id,
    },
  });

  // Notify the other party
  const cancelledByImam = user.role === "IMAM" || user.role === "SUPERADMIN";
  const cancellerName = user.name;

  if (cancelledByImam) {
    // Imam cancelled → notify user, include rebook link
    await sendSessionCancellation(session, session.user, cancellerName, parsed.data.reason, true).catch(console.error);
  } else {
    // User cancelled → notify imam
    await sendSessionCancellation(session, session.imam, cancellerName, parsed.data.reason, false).catch(console.error);
  }

  return apiSuccess({ cancelled: true });
}
