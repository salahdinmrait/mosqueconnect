"use client";

import { useState } from "react";
import { Modal, Button, Input, Select } from "@/components/ui";
import { WEEKDAY_LABELS } from "@/lib/constants";

interface BlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editBlock?: {
    id: string;
    type: "repeating" | "one_off";
    date?: string;
    startTime: string;
    endTime: string;
    weekday?: number;
  } | null;
}

export function BlockEditor({ open, onClose, onSaved, editBlock }: BlockEditorProps) {
  const isEditing = !!editBlock;
  const [blockType, setBlockType] = useState<"repeating" | "one_off">(
    editBlock?.type ?? "repeating"
  );
  const [weekday, setWeekday] = useState(String(editBlock?.weekday ?? 0));
  const [startTime, setStartTime] = useState(editBlock?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(editBlock?.endTime ?? "17:00");
  const [startDate, setStartDate] = useState(
    editBlock?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [date, setDate] = useState(editBlock?.date ?? new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    let res: Response;

    if (isEditing && editBlock) {
      res = await fetch(`/api/availability/blocks/${editBlock.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: editBlock.type,
          startTime,
          endTime,
          ...(editBlock.type === "one_off" ? { date } : {}),
          ...(editBlock.type === "repeating" ? { weekday: Number(weekday), startDate } : {}),
        }),
      });
    } else {
      const body =
        blockType === "repeating"
          ? {
              type: "repeating",
              weekday: Number(weekday),
              startTime,
              endTime,
              startDate,
              endDate: endDate || null,
            }
          : { type: "one_off", date, startTime, endTime };

      res = await fetch("/api/availability/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save block.");
      setLoading(false);
      return;
    }

    onSaved();
  }

  async function handleDelete() {
    if (!editBlock) return;
    setLoading(true);
    const res = await fetch(`/api/availability/blocks/${editBlock.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to delete block.");
      setLoading(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Availability Block" : "Add Availability"}
    >
      <div className="space-y-4">
        {!isEditing && (
          <Select
            label="Block type"
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as "repeating" | "one_off")}
            options={[
              { value: "repeating", label: "Repeating (weekly)" },
              { value: "one_off", label: "One-off (single date)" },
            ]}
          />
        )}

        {(blockType === "repeating" && !isEditing) || editBlock?.type === "repeating" ? (
          <Select
            label="Day of week"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
            options={WEEKDAY_LABELS.map((d, i) => ({ value: String(i), label: d }))}
          />
        ) : (
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}

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

        {blockType === "repeating" && !isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Active from"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Active until (optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Leave blank for no end date"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between items-center pt-2">
          {isEditing ? (
            <Button variant="danger" size="sm" onClick={handleDelete} loading={loading}>
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              {isEditing ? "Save Changes" : "Add Block"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
