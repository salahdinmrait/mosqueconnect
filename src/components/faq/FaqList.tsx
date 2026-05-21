"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui";
import type { FaqEntry } from "@/types";

interface FaqListProps {
  entries: FaqEntry[];
  searchable?: boolean;
}

export function FaqList({ entries, searchable }: FaqListProps) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = query.trim()
    ? entries.filter(
        (e) =>
          e.question.toLowerCase().includes(query.toLowerCase()) ||
          e.answer.toLowerCase().includes(query.toLowerCase()) ||
          e.category.toLowerCase().includes(query.toLowerCase())
      )
    : entries;

  const grouped = filtered.reduce<Record<string, FaqEntry[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the FAQ..."
            className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      )}

      {Object.entries(grouped).length === 0 && (
        <p className="text-gray-500 text-sm">No FAQ entries found.</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-base font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200">
            {category}
          </h2>
          <div className="space-y-1">
            {items.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
                >
                  <span className="text-sm font-medium text-gray-900">{entry.question}</span>
                  <ChevronDown
                    className={clsx(
                      "h-4 w-4 text-gray-500 shrink-0 ml-3 transition-transform",
                      openId === entry.id && "rotate-180"
                    )}
                  />
                </button>
                {openId === entry.id && (
                  <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed border-t border-gray-100">
                    <p className="pt-3 whitespace-pre-wrap">{entry.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
