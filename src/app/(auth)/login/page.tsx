"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button, Input, Card } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? ROUTES.dashboard.user;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fetch the user's role to redirect to the correct dashboard
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const { data } = await res.json();
        router.push(redirect === ROUTES.dashboard.user ? `/dashboard/${data.role.toLowerCase().replace("superadmin", "admin").replace("worker", "worker")}` : redirect);
      } else {
        router.push(redirect);
      }
    }
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back to MosqueConnect
        </p>
      </div>

      {params.get("error") === "account_deactivated" && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Your account has been deactivated. Please contact the mosque.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end">
          <Link
            href={ROUTES.forgotPassword}
            className="text-sm text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.register} className="text-brand-700 font-medium hover:underline">
          Register
        </Link>
      </p>
    </Card>
  );
}
