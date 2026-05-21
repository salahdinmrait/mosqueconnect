"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Textarea, Select } from "@/components/ui";
import { DurationSelector } from "./DurationSelector";
import { SlotPicker } from "./SlotPicker";
import { URGENCY_OPTIONS, SESSION_MODES, DURATION_OPTIONS, ROUTES } from "@/lib/constants";
import type { BookingFormState, Urgency, SessionMode, TimeSlot } from "@/types";

interface BookingFlowProps {
  imamId: string;
  imamName: string;
}

const STEPS = ["Intake", "Duration", "Pick a Slot", "Confirm"] as const;

export function BookingFlow({ imamId, imamName }: BookingFlowProps) {
  const router = useRouter();

  const [state, setState] = useState<BookingFormState>({
    step: "intake",
    intake: null,
    duration: null,
    slot: null,
    mode: null,
  });

  const [topic, setTopic] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("REGULAR");
  const [mode, setMode] = useState<SessionMode>("IN_PERSON");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepIndex = ["intake", "duration", "slots", "confirm"].indexOf(state.step);

  function goIntakeToDuration() {
    if (topic.trim().length < 5) {
      setError("Please describe your topic in at least 5 characters.");
      return;
    }
    setError("");
    setState((s) => ({
      ...s,
      step: "duration",
      intake: { topic, urgency },
      duration: { durationMinutes: 30 },
    }));
  }

  function goDurationToSlots(durationMinutes: number) {
    setState((s) => ({
      ...s,
      step: "slots",
      duration: { durationMinutes },
    }));
  }

  function goSlotToConfirm(slot: TimeSlot) {
    setState((s) => ({ ...s, step: "confirm", slot }));
  }

  async function confirmBooking() {
    if (!state.intake || !state.duration || !state.slot) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imamId,
        date: state.slot.date,
        startTime: state.slot.startTime,
        endTime: state.slot.endTime,
        durationMinutes: state.duration.durationMinutes,
        topic: state.intake.topic,
        urgency: state.intake.urgency,
        mode,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Booking failed. Please try another slot.");
      setLoading(false);
      return;
    }

    router.push(ROUTES.dashboard.userSessions);
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= stepIndex
                  ? "bg-brand-700 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= stepIndex ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Intake */}
      {state.step === "intake" && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Tell us about your session</h2>
          <div className="space-y-4">
            <Textarea
              label="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Briefly describe what you'd like to discuss..."
              rows={3}
            />
            <div>
              <p className="form-label">Urgency</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {(Object.entries(URGENCY_OPTIONS) as [Urgency, typeof URGENCY_OPTIONS[Urgency]][]).map(([key, opt]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      urgency === key
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={key}
                      checked={urgency === key}
                      onChange={() => setUrgency(key)}
                      className="mt-0.5 accent-brand-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={goIntakeToDuration} fullWidth>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Duration */}
      {state.step === "duration" && (
        <DurationSelector
          selected={state.duration?.durationMinutes ?? 30}
          onSelect={goDurationToSlots}
          onBack={() => setState((s) => ({ ...s, step: "intake" }))}
        />
      )}

      {/* Step 3: Slot picker */}
      {state.step === "slots" && state.intake && state.duration && (
        <SlotPicker
          urgency={state.intake.urgency}
          durationMinutes={state.duration.durationMinutes}
          imamId={imamId}
          onSelect={goSlotToConfirm}
          onBack={() => setState((s) => ({ ...s, step: "duration" }))}
        />
      )}

      {/* Step 4: Confirm */}
      {state.step === "confirm" && state.intake && state.duration && state.slot && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Confirm your booking</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">With</p>
              <p className="font-medium">{imamName}</p>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{state.slot.date}</p>
              <p className="text-gray-500">Time</p>
              <p className="font-medium">{state.slot.startTime} – {state.slot.endTime}</p>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">{state.duration.durationMinutes} minutes</p>
              <p className="text-gray-500">Urgency</p>
              <p className="font-medium">{URGENCY_OPTIONS[state.intake.urgency].label}</p>
              <p className="text-gray-500">Topic</p>
              <p className="font-medium">{state.intake.topic}</p>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="form-label">Session mode</p>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {(Object.entries(SESSION_MODES) as [SessionMode, { label: string; icon: string }][]).map(([key, opt]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                      mode === key ? "border-brand-500 bg-brand-50" : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={key}
                      checked={mode === key}
                      onChange={() => setMode(key)}
                      className="accent-brand-700"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: "slots" }))} disabled={loading}>
              Back
            </Button>
            <Button onClick={confirmBooking} loading={loading} fullWidth>
              Confirm Booking
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
