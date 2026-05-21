/**
 * Unit tests for the slot generation algorithm in src/lib/availability.ts
 *
 * These tests use the pure `computeAvailableSlots` function directly so no
 * database mocking is required.
 */

import { computeAvailableSlots, timeToMinutes, minutesToTime, slotOverlapsBooking } from "@/lib/availability";
import type { RepeatingBlockWithOverrides, OneOffBlock } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRepeating(
  overrides: Partial<RepeatingBlockWithOverrides> = {}
): RepeatingBlockWithOverrides {
  return {
    id: "rb-1",
    imamId: "imam-1",
    weekday: 0, // Monday
    startTime: "09:00",
    endTime: "11:00",
    startDate: "2025-01-01",
    endDate: null,
    overrides: [],
    ...overrides,
  };
}

function makeOneOff(overrides: Partial<OneOffBlock> = {}): OneOffBlock {
  return {
    id: "oo-1",
    imamId: "imam-1",
    date: "2025-06-16",
    startTime: "09:00",
    endTime: "11:00",
    ...overrides,
  };
}

// Monday 2025-06-16
const MON_16 = new Date("2025-06-16T00:00:00.000Z");
const MON_16_STR = "2025-06-16";

// ─── timeToMinutes ─────────────────────────────────────────────────────────────

describe("timeToMinutes", () => {
  it("converts 00:00 to 0", () => expect(timeToMinutes("00:00")).toBe(0));
  it("converts 01:00 to 60", () => expect(timeToMinutes("01:00")).toBe(60));
  it("converts 09:30 to 570", () => expect(timeToMinutes("09:30")).toBe(570));
  it("converts 23:59 to 1439", () => expect(timeToMinutes("23:59")).toBe(1439));
});

// ─── minutesToTime ─────────────────────────────────────────────────────────────

describe("minutesToTime", () => {
  it("converts 0 to 00:00", () => expect(minutesToTime(0)).toBe("00:00"));
  it("converts 60 to 01:00", () => expect(minutesToTime(60)).toBe("01:00"));
  it("converts 90 to 01:30", () => expect(minutesToTime(90)).toBe("01:30"));
  it("converts 1439 to 23:59", () => expect(minutesToTime(1439)).toBe("23:59"));
});

// ─── slotOverlapsBooking ──────────────────────────────────────────────────────

describe("slotOverlapsBooking", () => {
  const slot = { date: MON_16_STR, startTime: "09:00", endTime: "09:30" };

  it("returns false for different date", () => {
    expect(slotOverlapsBooking(slot, { date: "2025-06-17", startTime: "09:00", endTime: "09:30" })).toBe(false);
  });

  it("detects exact overlap", () => {
    expect(slotOverlapsBooking(slot, { date: MON_16_STR, startTime: "09:00", endTime: "09:30" })).toBe(true);
  });

  it("detects partial overlap (booking starts inside slot)", () => {
    expect(slotOverlapsBooking(slot, { date: MON_16_STR, startTime: "09:15", endTime: "10:00" })).toBe(true);
  });

  it("does not overlap when booking is adjacent after", () => {
    expect(slotOverlapsBooking(slot, { date: MON_16_STR, startTime: "09:30", endTime: "10:00" })).toBe(false);
  });

  it("does not overlap when booking is adjacent before", () => {
    expect(slotOverlapsBooking(slot, { date: MON_16_STR, startTime: "08:00", endTime: "09:00" })).toBe(false);
  });
});

// ─── computeAvailableSlots ────────────────────────────────────────────────────

describe("computeAvailableSlots", () => {
  // Monday 2025-06-16 is a Monday (weekday 0 in our convention)
  const FROM = MON_16;
  const TO = new Date("2025-06-16T23:59:59.000Z");

  it("generates correct 30-minute slots from a 2-hour block", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating()],
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({ date: MON_16_STR, startTime: "09:00", endTime: "09:30" });
    expect(slots[3]).toEqual({ date: MON_16_STR, startTime: "10:30", endTime: "11:00" });
  });

  it("generates correct 60-minute slots from a 2-hour block", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating()],
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 60,
    });

    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ date: MON_16_STR, startTime: "09:00", endTime: "10:00" });
    expect(slots[1]).toEqual({ date: MON_16_STR, startTime: "10:00", endTime: "11:00" });
  });

  it("generates no slots if duration does not fit in block", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating({ startTime: "09:00", endTime: "09:20" })],
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });

  it("removes slots that conflict with existing bookings", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating()],
      oneOffBlocks: [],
      existingBookings: [{ date: MON_16_STR, startTime: "09:00", endTime: "09:30" }],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(3);
    expect(slots[0].startTime).toBe("09:30");
  });

  it("respects repeating block start_date constraint", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating({ startDate: "2025-06-23" })], // next Monday
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });

  it("respects repeating block end_date constraint", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [makeRepeating({ endDate: "2025-06-15" })], // day before
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });

  it("applies override times to the correct occurrence", () => {
    const block = makeRepeating({
      overrides: [
        {
          id: "ov-1",
          repeatingBlockId: "rb-1",
          occurrenceDate: MON_16_STR,
          startTime: "10:00",
          endTime: "11:00",
          isDeleted: false,
        },
      ],
    });

    const slots = computeAvailableSlots({
      repeatingBlocks: [block],
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    // With override 10:00–11:00, we get 2 slots instead of 4
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ date: MON_16_STR, startTime: "10:00", endTime: "10:30" });
  });

  it("skips occurrence when override has is_deleted = true", () => {
    const block = makeRepeating({
      overrides: [
        {
          id: "ov-1",
          repeatingBlockId: "rb-1",
          occurrenceDate: MON_16_STR,
          startTime: "09:00",
          endTime: "11:00",
          isDeleted: true,
        },
      ],
    });

    const slots = computeAvailableSlots({
      repeatingBlocks: [block],
      oneOffBlocks: [],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });

  it("includes one-off blocks in the available slots", () => {
    const slots = computeAvailableSlots({
      repeatingBlocks: [],
      oneOffBlocks: [makeOneOff({ date: MON_16_STR, startTime: "14:00", endTime: "16:00" })],
      existingBookings: [],
      fromDate: FROM,
      toDate: TO,
      requestedDurationMinutes: 30,
    });

    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({ date: MON_16_STR, startTime: "14:00", endTime: "14:30" });
  });

  it("returns slots sorted by date then start_time", () => {
    const nextDay = new Date("2025-06-17T00:00:00.000Z");
    const slots = computeAvailableSlots({
      repeatingBlocks: [],
      oneOffBlocks: [
        makeOneOff({ id: "oo-2", date: "2025-06-17", startTime: "09:00", endTime: "10:00" }),
        makeOneOff({ id: "oo-1", date: MON_16_STR, startTime: "14:00", endTime: "15:00" }),
      ],
      existingBookings: [],
      fromDate: FROM,
      toDate: nextDay,
      requestedDurationMinutes: 30,
    });

    expect(slots[0].date).toBe(MON_16_STR);
    expect(slots[slots.length - 1].date).toBe("2025-06-17");
  });
});
