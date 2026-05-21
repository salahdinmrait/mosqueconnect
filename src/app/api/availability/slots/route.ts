import { NextRequest } from "next/server";
import { z } from "zod";
import { addDays, addHours, parseISO } from "date-fns";
import { getAvailableSlots } from "@/lib/availability";
import { apiSuccess, apiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  URGENT_BOOKING_WINDOW_HOURS,
  REGULAR_BOOKING_MIN_DAYS_AHEAD,
} from "@/lib/constants";

const schema = z.object({
  urgency: z.enum(["URGENT", "REGULAR"]),
  durationMinutes: z.coerce.number().int().min(30).max(90),
  imamId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  // Find the default imam if none specified
  let imamId = parsed.data.imamId;
  if (!imamId) {
    const imam = await prisma.user.findFirst({ where: { role: "IMAM", isActive: true } });
    if (!imam) return apiError("No imam available", 404);
    imamId = imam.id;
  }

  const now = new Date();
  let fromDate: Date;
  let toDate: Date;

  if (parsed.data.urgency === "URGENT") {
    fromDate = now;
    toDate = addHours(now, URGENT_BOOKING_WINDOW_HOURS);
  } else {
    fromDate = addDays(now, REGULAR_BOOKING_MIN_DAYS_AHEAD);
    toDate = addDays(now, REGULAR_BOOKING_MIN_DAYS_AHEAD + 60); // show 60-day window
  }

  const slots = await getAvailableSlots(
    imamId,
    fromDate,
    toDate,
    parsed.data.durationMinutes
  );

  return apiSuccess(slots);
}
