import type { Role, QuestionStatus, SessionStatus, Urgency, SessionMode } from "@/types";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES: Record<Role, { label: string; description: string }> = {
  SUPERADMIN: {
    label: "Superadmin",
    description: "Full access — manages staff, mosque settings, and all data",
  },
  WORKER: {
    label: "Mosque Worker",
    description: "Handles community questions and manages the FAQ",
  },
  IMAM: {
    label: "Imam",
    description: "Answers escalated questions and manages council sessions",
  },
  USER: {
    label: "Community Member",
    description: "Asks questions and books council sessions",
  },
};

// ─── Question status ──────────────────────────────────────────────────────────

export const QUESTION_STATUSES: Record<
  QuestionStatus,
  { label: string; color: string }
> = {
  OPEN: { label: "Open", color: "blue" },
  IN_PROGRESS: { label: "In Progress", color: "yellow" },
  ESCALATED: { label: "Escalated", color: "orange" },
  ANSWERED: { label: "Answered", color: "green" },
  CLOSED: { label: "Closed", color: "gray" },
};

// ─── Session status ───────────────────────────────────────────────────────────

export const SESSION_STATUSES: Record<
  SessionStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: "yellow" },
  CONFIRMED: { label: "Confirmed", color: "green" },
  CANCELLED: { label: "Cancelled", color: "red" },
  COMPLETED: { label: "Completed", color: "gray" },
};

// ─── Urgency ──────────────────────────────────────────────────────────────────

export const URGENCY_OPTIONS: Record<
  Urgency,
  { label: string; description: string; color: string }
> = {
  URGENT: {
    label: "Urgent",
    description: "Crisis, divorce, grief, or conflict — available within 48 hours",
    color: "red",
  },
  REGULAR: {
    label: "Regular",
    description: "General guidance — available from 7 days onwards",
    color: "blue",
  },
};

// ─── Session modes ────────────────────────────────────────────────────────────

export const SESSION_MODES: Record<SessionMode, { label: string; icon: string }> = {
  IN_PERSON: { label: "In Person", icon: "user" },
  VIDEO: { label: "Video Call", icon: "video" },
};

// ─── Duration options ─────────────────────────────────────────────────────────

export const DURATION_OPTIONS: Array<{
  minutes: number;
  label: string;
  description: string;
}> = [
  { minutes: 30, label: "30 minutes", description: "Standard session" },
  { minutes: 45, label: "45 minutes", description: "Extended session" },
  { minutes: 60, label: "60 minutes", description: "1-hour session" },
  { minutes: 90, label: "90 minutes", description: "In-depth session" },
];

// ─── Slot booking windows ─────────────────────────────────────────────────────

export const URGENT_BOOKING_WINDOW_HOURS = 48;
export const REGULAR_BOOKING_MIN_DAYS_AHEAD = 7;

// ─── Default FAQ categories ───────────────────────────────────────────────────

export const DEFAULT_FAQ_CATEGORIES = [
  "Prayer & Worship",
  "Fasting & Ramadan",
  "Zakat & Charity",
  "Marriage & Family",
  "Halal & Haram",
  "Quran & Hadith",
  "Practical Life",
  "Other",
];

// ─── Weekday labels ───────────────────────────────────────────────────────────

// 0=Monday … 6=Sunday (matching the DB convention)
export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ─── Notification types ───────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: "booking_confirmation",
  IMAM_NEW_SESSION: "imam_new_session",
  SESSION_CANCELLATION: "session_cancellation",
  SESSION_REMINDER: "session_reminder",
  QUESTION_ANSWERED: "question_answered",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ─── Route paths ──────────────────────────────────────────────────────────────

export const ROUTES = {
  home: "/",
  faq: "/faq",
  ask: "/ask",
  book: "/book",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: {
    user: "/dashboard/user",
    userQuestions: "/dashboard/user/questions",
    userSessions: "/dashboard/user/sessions",
    worker: "/dashboard/worker",
    workerQuestions: "/dashboard/worker/questions",
    workerFaq: "/dashboard/worker/faq",
    workerSessions: "/dashboard/worker/sessions",
    imam: "/dashboard/imam",
    imamQuestions: "/dashboard/imam/questions",
    imamAgenda: "/dashboard/imam/agenda",
    imamSessions: "/dashboard/imam/sessions",
    admin: "/dashboard/admin",
    adminAccounts: "/dashboard/admin/accounts",
    adminMosque: "/dashboard/admin/mosque",
  },
} as const;

// ─── Role → dashboard home ────────────────────────────────────────────────────

export const ROLE_HOME: Record<Role, string> = {
  SUPERADMIN: ROUTES.dashboard.admin,
  WORKER: ROUTES.dashboard.worker,
  IMAM: ROUTES.dashboard.imam,
  USER: ROUTES.dashboard.user,
};
