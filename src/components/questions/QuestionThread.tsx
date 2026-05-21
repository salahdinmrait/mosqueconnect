"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Badge, Button, Textarea } from "@/components/ui";
import { EscalationModal } from "./EscalationModal";
import { QUESTION_STATUSES } from "@/lib/constants";
import type { QuestionWithDetails, Role, SenderRole } from "@/types";
import type { BadgeColor } from "@/components/ui";

interface QuestionThreadProps {
  question: QuestionWithDetails;
  role: Role;
}

const bubbleClass: Record<SenderRole, string> = {
  USER: "bubble-user self-start",
  WORKER: "bubble-worker self-end",
  IMAM: "bubble-imam self-end",
  SYSTEM: "text-center text-xs text-gray-400 italic",
};

export function QuestionThread({ question, role }: QuestionThreadProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [error, setError] = useState("");

  const canReply = role === "WORKER" || role === "IMAM" || role === "SUPERADMIN";
  const canEscalate =
    (role === "WORKER" || role === "SUPERADMIN") &&
    question.status !== "ESCALATED" &&
    question.status !== "ANSWERED" &&
    question.status !== "CLOSED";

  async function sendReply(markAnswered = false) {
    if (!reply.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/questions/${question.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim(), markAnswered }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to send reply.");
    } else {
      setReply("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 line-clamp-2">{question.content}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm text-gray-500">{question.category}</span>
            <Badge color={QUESTION_STATUSES[question.status].color as BadgeColor}>
              {QUESTION_STATUSES[question.status].label}
            </Badge>
            {question.user && (
              <span className="text-sm text-gray-500">by {question.user.name}</span>
            )}
            {!question.user && question.sessionToken && (
              <span className="text-sm text-gray-400 italic">Anonymous</span>
            )}
          </div>
        </div>
        {canEscalate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEscalationOpen(true)}
            className="shrink-0"
          >
            Escalate to Imam
          </Button>
        )}
      </div>

      {/* Escalation note */}
      {question.escalationNote && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm font-medium text-orange-800">
            Escalated by {question.escalationNote.worker?.name}
          </p>
          <p className="text-sm text-orange-700 mt-1">{question.escalationNote.note}</p>
        </div>
      )}

      {/* Thread */}
      <div className="space-y-3 bg-gray-50 rounded-xl p-4 min-h-[200px] flex flex-col">
        {question.messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx("flex flex-col max-w-[80%]", {
              "self-start": msg.senderRole === "USER",
              "self-end": msg.senderRole !== "USER",
            })}
          >
            <div className={bubbleClass[msg.senderRole]}>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.content}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 px-1">
              {msg.sender?.name ?? "Anonymous"} · {new Date(msg.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Reply area */}
      {canReply && question.status !== "ANSWERED" && question.status !== "CLOSED" && (
        <div className="space-y-3">
          <Textarea
            label="Reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => sendReply(false)} loading={loading} disabled={!reply.trim()}>
              Send Reply
            </Button>
            {(role === "WORKER" || role === "SUPERADMIN") && (
              <Button
                variant="outline"
                onClick={() => sendReply(true)}
                loading={loading}
                disabled={!reply.trim()}
              >
                Send & Mark Answered
              </Button>
            )}
            {role === "IMAM" && (
              <Button
                variant="outline"
                onClick={() => sendReply(true)}
                loading={loading}
                disabled={!reply.trim()}
              >
                Send & Mark Answered
              </Button>
            )}
          </div>
        </div>
      )}

      <EscalationModal
        open={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        questionId={question.id}
      />
    </div>
  );
}
