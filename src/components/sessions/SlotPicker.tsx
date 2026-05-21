"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Button, Card } from "@/components/ui";
import type { TimeSlot, Urgency } from "@/types";

interface SlotPickerProps {
  urgency: Urgency;
  durationMinutes: number;
  imamId: string;
  onSelect: (slot: TimeSlot) => void;
  onBack: () => void;
}

// Group slots by date for display
function groupByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {});
}

export function SlotPicker({ urgency, durationMinutes, imamId, onSelect, onBack }: SlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TimeSlot | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        urgency,
        durationMinutes: String(durationMinutes),
        imamId,
      });

      const res = await fetch(`/api/availability/slots?${params}`);
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to load available slots.");
        setLoading(false);
        return;
      }

      const json = await res.json();
      setSlots(json.data);
      setLoading(false);
    }

    fetchSlots();
  }, [urgency, durationMinutes, imamId]);

  const grouped = groupByDate(slots);

  return (
    <Card>
      <h2 className="font-semibold text-gray-900 mb-1">Choose a time slot</h2>
      <p className="text-sm text-gray-500 mb-4">
        {urgency === "URGENT"
          ? "Showing available slots within the next 48 hours."
          : "Showing available slots starting 7+ days from now."}
        {" "}{durationMinutes}-minute sessions only.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span className="ml-2 text-sm text-gray-500">Loading available slots...</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">
          <p className="font-medium">No slots available for the selected criteria.</p>
          <p className="mt-1">Try a different duration or urgency level.</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([date, dateSlots]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {dateSlots.map((slot) => (
                  <button
                    key={`${slot.date}-${slot.startTime}`}
                    onClick={() => setSelected(slot)}
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      selected?.date === slot.date && selected?.startTime === slot.startTime
                        ? "border-brand-500 bg-brand-600 text-white"
                        : "border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-gray-900"
                    )}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          fullWidth
        >
          Continue
        </Button>
      </div>
    </Card>
  );
}
