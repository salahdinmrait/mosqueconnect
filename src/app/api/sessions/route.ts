import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/auth";
import { sendBookingConfirmation, sendImamNewSession } from "@/lib/notifications";

const createSchema = z.object({
  imamId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(30).max(90),
  topic: z.string().min(5).max(1000),
  urgency: z.enum(["URGENT", "REGULAR"]),
  mode: z.enum(["IN_PERSON", "VIDEO"]),
});

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let where: Record<string, unknown> = {};

  if (user.role === "USER") {
    where = { userId: user.id };
  } else if (user.role === "IMAM") {
    where = { imamId: user.id };
  }
  // Workers and superadmins see all sessions

  if (status) where.status = status;

  const sessions = await prisma.session.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      imam: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return apiSuccess(sessions);
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (user.role !== "USER" && user.role !== "SUPERADMIN") return apiForbidden();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  // Verify the imam exists
  const imam = await prisma.user.findFirst({
    where: { id: parsed.data.imamId, role: "IMAM", isActive: true },
  });
  if (!imam) return apiError("Imam not found", 404);

  // Check for conflicting bookings at this slot
  const conflict = await prisma.session.findFirst({
    where: {
      imamId: parsed.data.imamId,
      date: parsed.data.date,
      status: { not: "CANCELLED" },
      OR: [
        {
          startTime: { lt: parsed.data.endTime },
          endTime: { gt: parsed.data.startTime },
        },
      ],
    },
  });

  if (conflict) return apiError("This time slot is no longer available", 409);

  const session = await prisma.session.create({
    data: {
      ...parsed.data,
      userId: user.id,
      status: "CONFIRMED",
    },
  });

  // Send confirmation emails asynchronously (don't block the response)
  Promise.all([
    sendBookingConfirmation(session, user),
    sendImamNewSession(session, imam, user),
  ]).catch(console.error);

  return apiSuccess(session, 201);
}
