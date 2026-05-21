/**
 * availability.ts — Pure slot-generation algorithm for the Imam Agenda System.
 *
 * This module is intentionally kept as a pure function that accepts its data as
 * arguments rather than calling Prisma directly. This makes it trivially
 * unit-testable without mocking the database.
 *
 * The database-fetching wrapper `getAvailableSlots` lives below and is the
 * public API consumed by the `/api/availability/slots` route.
 */

import { eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import type {
  RepeatingBlockWithOverrides,
  OneOffBlock,
  TimeSlot,
} from "@/types";

// ─── Time utilities ───────────────────────────────────────────────────────────

/** Convert "HH:mm" to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes from midnight back to "HH:mm" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Convert JS getDay() (0=Sunday) to our Monday-based weekday (0=Monday, 6=Sunday).
 */
export function jsWeekdayToMonday(jsDay: number): number {
  return (jsDay + 6) % 7;
}

// ─── Overlap detection ────────────────────────────────────────────────────────

/**
 * Returns true if `slot` overlaps with an existing booking.
 * Two intervals [a, b) and [c, d) overlap when a < d && b > c.
 */
export function slotOverlapsBooking(
  slot: TimeSlot,
  booking: { date: string; startTime: string; endTime: string }
): boolean {
  if (slot.date !== booking.date) return false;
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  const bookStart = timeToMinutes(booking.startTime);
  const bookEnd = timeToMinutes(booking.endTime);
  return slotStart < bookEnd && slotEnd > bookStart;
}

// ─── Core pure algorithm ──────────────────────────────────────────────────────

export interface ComputeSlotsInput {
  repeatingBlocks: RepeatingBlockWithOverrides[];
  oneOffBlocks: OneOffBlock[];
  existingBookings: Array<{ date: string; startTime: string; endTime: string }>;
  fromDate: Date;
  toDate: Date;
  requestedDurationMinutes: number;
}

/**
 * Pure function — no I/O, fully unit-testable.
 *
 * Given raw availability data, returns all available time slots of exactly
 * `requestedDurationMinutes` length that fit within the availability blocks
 * and don't conflict with existing bookings.
 */
export function computeAvailableSlots({
  repeatingBlocks,
  oneOffBlocks,
  existingBookings,
  fromDate,
  toDate,
  requestedDurationMinutes,
}: ComputeSlotsInput): TimeSlot[] {
  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr = format(toDate, "yyyy-MM-dd");

  // ── Step 2: Expand repeating blocks into individual date occurrences ────────
  // Each repeating block fires on a specific weekday. We walk every calendar
  // day in [fromDate, toDate] and pick out the days matching the block's weekday.
  const occurrences: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }> = [];

  const allDays = eachDayOfInterval({ start: fromDate, end: toDate });

  for (const block of repeatingBlocks) {
    for (const day of allDays) {
      const weekday = jsWeekdayToMonday(getDay(day));
      if (weekday !== block.weekday) continue;

      const dateStr = format(day, "yyyy-MM-dd");

      // Respect the block's own start_date / end_date boundaries
      if (dateStr < block.startDate) continue;
      if (block.endDate && dateStr > block.endDate) continue;

      // ── Step 3: Apply overrides for this specific occurrence date ───────────
      const override = block.overrides.find(
        (o) => o.occurrenceDate === dateStr
      );

      if (override) {
        // If this occurrence was deleted, skip it entirely
        if (override.isDeleted) continue;

        // Otherwise use the override's times instead of the block's defaults
        occurrences.push({
          date: dateStr,
          startTime: override.startTime,
          endTime: override.endTime,
        });
      } else {
        // No override — use the repeating block's base times
        occurrences.push({
          date: dateStr,
          startTime: block.startTime,
          endTime: block.endTime,
        });
      }
    }
  }

  // ── Step 4 + 5: Merge one-off blocks with the expanded repeating occurrences ─
  const allBlocks = [
    ...occurrences,
    ...oneOffBlocks.map((b) => ({
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
  ].filter((b) => b.date >= fromStr && b.date <= toStr);

  // ── Step 6: Generate slots of exactly requestedDurationMinutes from each block ─
  // We slide a window of `requestedDurationMinutes` from block.startTime to
  // block.endTime in non-overlapping increments. A slot is valid only if the
  // entire duration fits before the block's end time.
  const slots: TimeSlot[] = [];

  for (const block of allBlocks) {
    let slotStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    while (slotStart + requestedDurationMinutes <= blockEnd) {
      const slotEnd = slotStart + requestedDurationMinutes;
      slots.push({
        date: block.date,
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
      });
      slotStart += requestedDurationMinutes;
    }
  }

  // ── Steps 7 + 8: Remove any slot that overlaps with an existing booking ─────
  // A slot is removed if any existing (non-cancelled) booking touches its time
  // window on the same date.
  const availableSlots = slots.filter(
    (slot) =>
      !existingBookings.some((booking) => slotOverlapsBooking(slot, booking))
  );

  // ── Step 9: Sort by date then start_time ─────────────────────────────────────
  return availableSlots.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

// ─── Database-backed wrapper ──────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

/**
 * Fetches all required data from the database, then calls `computeAvailableSlots`.
 * This is the public API used by the booking flow.
 */
export async function getAvailableSlots(
  imamId: string,
  fromDate: Date,
  toDate: Date,
  requestedDurationMinutes: number
): Promise<TimeSlot[]> {
  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr = format(toDate, "yyyy-MM-dd");

  // ── Step 1: Fetch all repeating blocks whose active range overlaps [fromDate, toDate] ─
  const repeatingBlocks = await prisma.repeatingBlock.findMany({
    where: {
      imamId,
      startDate: { lte: toStr },
      OR: [{ endDate: null }, { endDate: { gte: fromStr } }],
    },
    include: {
      overrides: {
        where: { occurrenceDate: { gte: fromStr, lte: toStr } },
      },
    },
  });

  // ── Step 4: Fetch one-off blocks within the date range ─────────────────────
  const oneOffBlocks = await prisma.oneOffBlock.findMany({
    where: { imamId, date: { gte: fromStr, lte: toStr } },
  });

  // ── Step 7: Fetch all non-cancelled bookings in the date range ──────────────
  const existingBookings = await prisma.session.findMany({
    where: {
      imamId,
      status: { not: "CANCELLED" },
      date: { gte: fromStr, lte: toStr },
    },
    select: { date: true, startTime: true, endTime: true },
  });

  return computeAvailableSlots({
    repeatingBlocks,
    oneOffBlocks,
    existingBookings,
    fromDate,
    toDate,
    requestedDurationMinutes,
  });
}
