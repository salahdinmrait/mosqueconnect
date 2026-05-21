"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, startOfWeek, getDay } from "date-fns";
import { clsx } from "clsx";
import { Button } from "@/components/ui";
import { BlockEditor } from "./BlockEditor";
import { OverrideModal } from "./OverrideModal";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { jsWeekdayToMonday } from "@/lib/availability";
import type { RepeatingBlockWithOverrides, OneOffBlock } from "@/types";

interface WeeklyCalendarProps {
  repeatingBlocks: RepeatingBlockWithOverrides[];
  oneOffBlocks: OneOffBlock[];
  imamId: string;
}

// Hours to show on the calendar grid
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface CalendarBlock {
  id: string;
  type: "repeating" | "one_off";
  date: string;
  startTime: string;
  endTime: string;
  weekday: number;
  isOverride: boolean;
  sourceBlockId?: string;
  occurrenceDate?: string;
}

export function WeeklyCalendar({ repeatingBlocks, oneOffBlocks }: WeeklyCalendarProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [overrideModalBlock, setOverrideModalBlock] = useState<CalendarBlock | null>(null);

  // Compute the Monday of the current displayed week
  const mondayOfWeek = addDays(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    weekOffset * 7
  );

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(mondayOfWeek, i), "yyyy-MM-dd")
  );

  // Build calendar blocks for the displayed week
  const calendarBlocks: CalendarBlock[] = [];

  // Expand repeating blocks into this week's occurrences
  for (const block of repeatingBlocks) {
    const dateForWeekday = weekDates[block.weekday];
    if (!dateForWeekday) continue;

    // Check if this occurrence is within the block's active range
    if (dateForWeekday < block.startDate) continue;
    if (block.endDate && dateForWeekday > block.endDate) continue;

    // Check for an override on this occurrence date
    const override = block.overrides.find((o) => o.occurrenceDate === dateForWeekday);

    if (override?.isDeleted) continue;

    calendarBlocks.push({
      id: block.id,
      type: "repeating",
      date: dateForWeekday,
      weekday: block.weekday,
      startTime: override ? override.startTime : block.startTime,
      endTime: override ? override.endTime : block.endTime,
      isOverride: !!override,
      sourceBlockId: block.id,
      occurrenceDate: dateForWeekday,
    });
  }

  // Add one-off blocks for this week
  for (const block of oneOffBlocks) {
    if (!weekDates.includes(block.date)) continue;
    const weekday = jsWeekdayToMonday(getDay(new Date(block.date)));
    calendarBlocks.push({
      id: block.id,
      type: "one_off",
      date: block.date,
      weekday,
      startTime: block.startTime,
      endTime: block.endTime,
      isOverride: false,
    });
  }

  function timeToTopPercent(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  }

  function blockHeight(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    return (durationMinutes / (24 * 60)) * 100;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            ← Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Next →
          </Button>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {format(mondayOfWeek, "d MMM")} – {format(addDays(mondayOfWeek, 6), "d MMM yyyy")}
        </div>
        <Button size="sm" onClick={() => setAddBlockOpen(true)}>
          + Add Availability
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-auto border border-gray-200 rounded-xl bg-white">
        <div className="grid" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)", minWidth: "700px" }}>
          {/* Header */}
          <div className="border-b border-gray-200 h-12" />
          {WEEKDAY_LABELS.map((day, i) => (
            <div
              key={day}
              className="border-b border-l border-gray-200 h-12 flex flex-col items-center justify-center"
            >
              <span className="text-xs font-semibold text-gray-500 uppercase">{day.slice(0, 3)}</span>
              <span className="text-sm text-gray-900">{weekDates[i] ? format(new Date(weekDates[i] + "T00:00:00"), "d") : ""}</span>
            </div>
          ))}

          {/* Time column + grid rows */}
          <div className="relative" style={{ height: `${24 * 48}px` }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute w-full border-b border-gray-100 flex items-center justify-end pr-2"
                style={{ top: `${(h / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
              >
                <span className="text-xs text-gray-400">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns with blocks */}
          {WEEKDAY_LABELS.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="relative border-l border-gray-200"
              style={{ height: `${24 * 48}px` }}
            >
              {/* Hour grid lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-b border-gray-100"
                  style={{ top: `${(h / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
                />
              ))}

              {/* Availability blocks */}
              {calendarBlocks
                .filter((b) => b.weekday === dayIndex)
                .map((block) => (
                  <button
                    key={`${block.id}-${block.date}`}
                    onClick={() => {
                      if (block.type === "repeating") {
                        setOverrideModalBlock(block);
                      } else {
                        setSelectedBlock(block);
                      }
                    }}
                    className={clsx(
                      "absolute left-1 right-1 rounded text-xs px-1 py-0.5 text-left overflow-hidden transition-opacity hover:opacity-90",
                      block.isOverride
                        ? "bg-gold-100 border border-gold-400 text-gold-800"
                        : block.type === "repeating"
                          ? "bg-brand-100 border border-brand-400 text-brand-800"
                          : "bg-purple-100 border border-purple-400 text-purple-800"
                    )}
                    style={{
                      top: `${timeToTopPercent(block.startTime)}%`,
                      height: `${blockHeight(block.startTime, block.endTime)}%`,
                      minHeight: "20px",
                    }}
                  >
                    <span className="font-medium">{block.startTime}–{block.endTime}</span>
                    {block.isOverride && <span className="ml-1 opacity-70">(edited)</span>}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-brand-200 border border-brand-400" />
          Repeating
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-purple-200 border border-purple-400" />
          One-off
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-gold-100 border border-gold-400" />
          Overridden
        </div>
      </div>

      {/* Add block modal */}
      {addBlockOpen && (
        <BlockEditor
          open={addBlockOpen}
          onClose={() => setAddBlockOpen(false)}
          onSaved={() => { setAddBlockOpen(false); router.refresh(); }}
        />
      )}

      {/* Override modal for repeating block occurrences */}
      {overrideModalBlock && (
        <OverrideModal
          open={!!overrideModalBlock}
          onClose={() => setOverrideModalBlock(null)}
          block={overrideModalBlock}
          onSaved={() => { setOverrideModalBlock(null); router.refresh(); }}
        />
      )}

      {/* Edit modal for one-off blocks */}
      {selectedBlock && (
        <BlockEditor
          open={!!selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onSaved={() => { setSelectedBlock(null); router.refresh(); }}
          editBlock={selectedBlock}
        />
      )}
    </div>
  );
}
