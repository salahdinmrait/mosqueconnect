"use client";

import { useState } from "react";
import { Modal, Button, Input } from "@/components/ui";

interface OverrideModalBlock {
  id: string;
  type: "repeating";
  date: string;
  startTime: string;
  endTime: string;
  sourceBlockId?: string;
  occurrenceDate?: string;
}

interface OverrideModalProps {
  open: boolean;
  onClose: () => void;
  block: OverrideModalBlock;
  onSaved: () => void;
}

type Action =
  | "edit_this"
  | "edit_all_future"
  | "delete_this"
  | "delete_all_future";

export function OverrideModal({ open, onClose, block, onSaved }: OverrideModalProps) {
  const [action, setAction] = useState<Action>("edit_this");
  const [startTime, setStartTime] = useState(block.startTime);
  const [endTime, setEndTime] = useState(block.endTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");

    let res: Response;
    const occurrenceDate = block.occurrenceDate ?? block.date;

    if (action === "edit_this") {
      // Create an override for this specific occurrence
      res = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repeatingBlockId: block.sourceBlockId ?? block.id,
          occurrenceDate,
          startTime,
          endTime,
          isDeleted: false,
        }),
      });
    } else if (action === "delete_this") {
      // Create a deletion override for this occurrence
      res = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repeatingBlockId: block.sourceBlockId ?? block.id,
          occurrenceDate,
          startTime: block.startTime,
          endTime: block.endTime,
          isDeleted: true,
        }),
      });
    } else if (action === "edit_all_future") {
      // Truncate the existing block and create a new one from this date forward
      res = await fetch(`/api/availability/blocks/${block.sourceBlockId ?? block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: "repeating",
          splitDate: occurrenceDate,
          newBlock: {
            startTime,
            endTime,
            startDate: occurrenceDate,
            endDate: null,
          },
        }),
      });
    } else {
      // delete_all_future — truncate the block one day before this occurrence
      const prevDate = new Date(occurrenceDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const endDate = prevDate.toISOString().slice(0, 10);

      res = await fetch(`/api/availability/blocks/${block.sourceBlockId ?? block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockType: "repeating", endDate }),
      });
    }

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Operation failed.");
      setLoading(false);
      return;
    }

    onSaved();
  }

  const isDelete = action === "delete_this" || action === "delete_all_future";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Repeating Block — ${block.date}`}
      description="Choose how to apply changes to this repeating availability block."
    >
      <div className="space-y-4">
        {/* Action selector */}
        <div className="space-y-2">
          {(
            [
              { value: "edit_this", label: "Edit this occurrence only" },
              { value: "edit_all_future", label: "Edit this and all future occurrences" },
              { value: "delete_this", label: "Delete this occurrence only" },
              { value: "delete_all_future", label: "Delete this and all future occurrences" },
            ] as { value: Action; label: string }[]
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="action"
                value={opt.value}
                checked={action === opt.value}
                onChange={() => setAction(opt.value)}
                className="accent-brand-700"
              />
              <span className="text-sm text-gray-900">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Time fields — only when editing */}
        {!isDelete && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isDelete ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={loading}
          >
            {isDelete ? "Delete" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
