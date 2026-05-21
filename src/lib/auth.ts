import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { ROUTES, ROLE_HOME } from "@/lib/constants";
import type { Role, User } from "@/types";

// ─── Get current session (server-side) ───────────────────────────────────────

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ─── Get current user (server-side) ──────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return user;
}

// ─── Require authenticated user (redirects to login if not) ──────────────────

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  if (!user.isActive) redirect(`${ROUTES.login}?error=account_deactivated`);
  return user;
}

// ─── Require a specific role (redirects to appropriate dashboard if wrong role) ─

export async function requireRole(...allowedRoles: Role[]): Promise<User> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }

  return user;
}

// ─── Convenience guards ───────────────────────────────────────────────────────

export const requireSuperadmin = () => requireRole("SUPERADMIN");
export const requireWorker = () => requireRole("SUPERADMIN", "WORKER");
export const requireImam = () => requireRole("SUPERADMIN", "IMAM");
export const requireStaff = () =>
  requireRole("SUPERADMIN", "WORKER", "IMAM");

// ─── API route helpers (returns null instead of redirecting) ──────────────────

export async function getApiUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, isActive: true },
  });

  return user;
}

export function apiUnauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorised" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiForbidden() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiNotFound() {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiSuccess<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
