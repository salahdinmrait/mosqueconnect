"use client";

import { Button, Card } from "@/components/ui";
import { DURATION_OPTIONS } from "@/lib/constants";
import { clsx } from "clsx";

interface DurationSelectorProps {
  selected: number;
  onSelect: (minutes: number) => void;
  onBack: () => void;
}

export function DurationSelector({ selected, onSelect, onBack }: DurationSelectorProps) {
  return (
    <Card>
      <h2 className="font-semibold text-gray-900 mb-4">How long do you need?</h2>
      <p className="text-sm text-gray-600 mb-4">
        Longer sessions are only available if the imam has enough consecutive availability.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.minutes}
            onClick={() => onSelect(opt.minutes)}
            className={clsx(
              "p-4 rounded-xl border text-left transition-colors",
              selected === opt.minutes
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
            )}
          >
            <p className="font-semibold text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </Card>
  );
}
