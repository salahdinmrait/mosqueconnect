"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Textarea } from "@/components/ui";

interface EscalationModalProps {
  open: boolean;
  onClose: () => void;
  questionId: string;
}

export function EscalationModal({ open, onClose, questionId }: EscalationModalProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEscalate() {
    if (!note.trim()) {
      setError("A context note is required before escalating.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/questions/${questionId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Escalation failed.");
      setLoading(false);
      return;
    }

    setNote("");
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Escalate to Imam"
      description="Provide context to help the imam understand the situation before replying."
    >
      <div className="space-y-4">
        <Textarea
          label="Context note (required)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Summarise the community member's situation and why you're escalating. The imam will see this before reading the thread."
          rows={4}
          hint="Minimum 10 characters. Be concise and respectful."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEscalate} loading={loading} disabled={!note.trim()}>
            Escalate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
