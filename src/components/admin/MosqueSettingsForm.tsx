"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import type { Mosque } from "@/types";

interface MosqueSettingsFormProps {
  mosque: Mosque | null;
}

export function MosqueSettingsForm({ mosque }: MosqueSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(mosque?.name ?? "");
  const [address, setAddress] = useState(mosque?.address ?? "");
  const [logoUrl, setLogoUrl] = useState(mosque?.logoUrl ?? "");
  const [language, setLanguage] = useState(mosque?.primaryLanguage ?? "en");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/admin/mosque", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        logoUrl: logoUrl || null,
        primaryLanguage: language,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save settings.");
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Mosque name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <Input
          label="Logo URL (optional)"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          hint="Full URL to a publicly hosted image"
        />
        <Input
          label="Primary language code"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          hint="E.g. en, ar, ur, fr"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-700">Settings saved successfully.</p>
        )}
        <Button type="submit" loading={loading}>
          Save Settings
        </Button>
      </form>
    </Card>
  );
}
