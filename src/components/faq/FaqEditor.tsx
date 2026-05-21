"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Card, Modal } from "@/components/ui";
import { DEFAULT_FAQ_CATEGORIES } from "@/lib/constants";
import type { FaqEntry } from "@/types";

interface FaqEditorProps {
  entries: FaqEntry[];
}

interface FaqForm {
  category: string;
  question: string;
  answer: string;
}

const EMPTY_FORM: FaqForm = { category: DEFAULT_FAQ_CATEGORIES[0], question: "", answer: "" };

export function FaqEditor({ entries }: FaqEditorProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FaqEntry | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  function openEdit(entry: FaqEntry) {
    setForm({ category: entry.category, question: entry.question, answer: entry.answer });
    setEditEntry(entry);
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    let res: Response;

    if (editEntry) {
      res = await fetch(`/api/faq/${editEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save.");
    } else {
      setCreateOpen(false);
      setEditEntry(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ entry?")) return;
    await fetch(`/api/faq/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const grouped = entries.reduce<Record<string, FaqEntry[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>+ Add FAQ Entry</Button>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
          <div className="space-y-3">
            {items.map((entry) => (
              <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{entry.question}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-700">Del</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {entries.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500">No FAQ entries yet. Add your first one!</p>
        </Card>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={createOpen || !!editEntry}
        onClose={() => { setCreateOpen(false); setEditEntry(null); }}
        title={editEntry ? "Edit FAQ Entry" : "Add FAQ Entry"}
      >
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={DEFAULT_FAQ_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="What is..."
          />
          <Textarea
            label="Answer"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            rows={5}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditEntry(null); }}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
