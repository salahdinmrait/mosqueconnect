"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button, Select, Textarea, Card } from "@/components/ui";
import { FaqSearchResult } from "@/components/faq/FaqSearchResult";
import { DEFAULT_FAQ_CATEGORIES } from "@/lib/constants";
import type { FaqEntry } from "@/types";

type Step = "form" | "faq_check" | "submitted";

export default function AskQuestionPage() {
  const [step, setStep] = useState<Step>("form");
  const [category, setCategory] = useState(DEFAULT_FAQ_CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [faqMatches, setFaqMatches] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionId, setQuestionId] = useState("");

  async function handlePreSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");

    // Check FAQ for keyword matches first
    const res = await fetch(`/api/faq/search?q=${encodeURIComponent(content)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data.length > 0) {
        setFaqMatches(json.data);
        setStep("faq_check");
        setLoading(false);
        return;
      }
    }

    // No FAQ matches — submit directly
    await submitQuestion();
  }

  async function submitQuestion() {
    setLoading(true);
    setError("");

    // Get or create session token for anonymous tracking
    let sessionToken = localStorage.getItem("mc_session_token");
    if (!sessionToken) {
      sessionToken = uuidv4();
      localStorage.setItem("mc_session_token", sessionToken);
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, content, sessionToken }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to submit question.");
      setLoading(false);
      return;
    }

    const json = await res.json();
    setQuestionId(json.data.id);
    setStep("submitted");
    setLoading(false);
  }

  if (step === "submitted") {
    return (
      <div className="container-page py-12 max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-6">
            <div className="inline-flex h-12 w-12 rounded-full bg-green-100 items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Question Submitted</h2>
            <p className="mt-2 text-gray-600 text-sm">
              Our team will respond as soon as possible.{" "}
              <strong>Save this link to check your reply:</strong>
            </p>
            <a
              href={`/questions/${questionId}`}
              className="mt-3 block text-brand-700 underline text-sm"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/questions/{questionId}
            </a>
            <p className="mt-3 text-xs text-gray-400">
              Your question is tracked via this device. Create an account to receive email
              notifications.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "faq_check") {
    return (
      <div className="container-page py-12 max-w-2xl mx-auto space-y-6">
        <h1>Before You Submit</h1>
        <FaqSearchResult
          entries={faqMatches}
          onAnswered={() => { setStep("form"); setContent(""); }}
          onNotAnswered={() => submitQuestion()}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1>Ask a Question</h1>
        <p className="mt-2 text-gray-600">
          Submit your question anonymously or{" "}
          <a href="/login" className="text-brand-700 hover:underline">sign in</a>{" "}
          to receive email notifications.
        </p>
      </div>

      <Card>
        <form onSubmit={handlePreSubmit} className="space-y-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={DEFAULT_FAQ_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Textarea
            label="Your question"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your question here. Be as detailed as possible..."
            rows={5}
            hint="Minimum 10 characters"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            Check & Submit
          </Button>
        </form>
      </Card>
    </div>
  );
}
