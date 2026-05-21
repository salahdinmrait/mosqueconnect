"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { FaqEntry } from "@/types";

interface FaqSearchResultProps {
  entries: FaqEntry[];
  onAnswered: () => void;
  onNotAnswered: () => void;
}

export function FaqSearchResult({ entries, onAnswered, onNotAnswered }: FaqSearchResultProps) {
  const [openId, setOpenId] = useState<string | null>(entries[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3">
        <p className="text-sm font-medium text-brand-800">
          We found {entries.length} FAQ {entries.length === 1 ? "entry" : "entries"} that may answer your question:
        </p>
      </div>

      <div className="space-y-1">
        {entries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
            >
              <span className="text-sm font-medium text-gray-900">{entry.question}</span>
              <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 ml-3 transition-transform ${openId === entry.id ? "rotate-180" : ""}`} />
            </button>
            {openId === entry.id && (
              <div className="px-4 pb-4 pt-2 text-sm text-gray-700 border-t border-gray-100 whitespace-pre-wrap leading-relaxed">
                {entry.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-gray-800">Did this answer your question?</p>
      <div className="flex gap-3">
        <Button onClick={onAnswered} variant="secondary">
          Yes, thanks!
        </Button>
        <Button onClick={onNotAnswered} variant="outline">
          No, I still need help
        </Button>
      </div>
    </div>
  );
}
