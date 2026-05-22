"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Home,
  HelpCircle,
  Calendar,
  BookOpen,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  Clock,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ROUTES } from "@/lib/constants";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  USER: [
    { href: ROUTES.dashboard.user, label: "Overview", icon: Home },
    { href: ROUTES.dashboard.userQuestions, label: "My Questions", icon: HelpCircle },
    { href: ROUTES.dashboard.userSessions, label: "My Sessions", icon: Calendar },
  ],
  WORKER: [
    { href: ROUTES.dashboard.worker, label: "Overview", icon: Home },
    { href: ROUTES.dashboard.workerQuestions, label: "Question Queue", icon: MessageSquare },
    { href: ROUTES.dashboard.workerFaq, label: "FAQ Management", icon: BookOpen },
    { href: ROUTES.dashboard.workerSessions, label: "Sessions", icon: Calendar },
  ],
  IMAM: [
    { href: ROUTES.dashboard.imam, label: "Overview", icon: Home },
    { href: ROUTES.dashboard.imamQuestions, label: "Escalated Questions", icon: HelpCircle },
    { href: ROUTES.dashboard.imamAgenda, label: "My Agenda", icon: Clock },
    { href: ROUTES.dashboard.imamSessions, label: "Upcoming Sessions", icon: Calendar },
  ],
  SUPERADMIN: [
    { href: ROUTES.dashboard.admin, label: "Overview", icon: Home },
    { href: ROUTES.dashboard.adminAccounts, label: "Accounts", icon: Users },
    { href: ROUTES.dashboard.adminMosque, label: "Mosque Settings", icon: Settings },
    { href: ROUTES.dashboard.workerQuestions, label: "Question Queue", icon: MessageSquare },
    { href: ROUTES.dashboard.imamSessions, label: "All Sessions", icon: Calendar },
  ],
};

interface DashboardNavProps {
  role: Role;
  userName: string;
  userEmail: string;
}

export function DashboardNav({ role, userName, userEmail }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(ROUTES.login);
    router.refresh();
  }

  const items = NAV_ITEMS[role] ?? NAV_ITEMS.USER;

  return (
    <aside className="flex h-full flex-col w-64 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <span className="text-white text-sm font-bold">MC</span>
          </div>
          <span className="font-semibold text-gray-900">MosqueConnect</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(`${href}/`)
                ? "bg-brand-50 text-brand-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-brand-700 text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
