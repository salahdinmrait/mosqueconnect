// Shared TypeScript types and interfaces for MosqueConnect

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = "SUPERADMIN" | "WORKER" | "IMAM" | "USER";

export type QuestionStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "ANSWERED"
  | "CLOSED";

export type SenderRole = "USER" | "WORKER" | "IMAM" | "SYSTEM";

export type SessionStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type SessionMode = "IN_PERSON" | "VIDEO";

export type Urgency = "URGENT" | "REGULAR";

// ─── Mosque ───────────────────────────────────────────────────────────────────

export interface Mosque {
  id: string;
  name: string;
  address: string;
  logoUrl: string | null;
  primaryLanguage: string;
  createdAt: Date;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  mosqueId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export type PublicUser = Pick<User, "id" | "name" | "role">;

// ─── Question & Messaging ────────────────────────────────────────────────────

export interface Question {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  category: string;
  content: string;
  status: QuestionStatus;
  mosqueId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionWithDetails extends Question {
  user: PublicUser | null;
  messages: Message[];
  escalationNote: EscalationNote | null;
}

export interface Message {
  id: string;
  questionId: string;
  senderId: string | null;
  senderRole: SenderRole;
  content: string;
  createdAt: Date;
  sender?: PublicUser | null;
}

export interface EscalationNote {
  id: string;
  questionId: string;
  workerId: string;
  note: string;
  createdAt: Date;
  worker?: PublicUser;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqEntry {
  id: string;
  mosqueId: string;
  category: string;
  question: string;
  answer: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Availability & Agenda ───────────────────────────────────────────────────

export interface RepeatingBlock {
  id: string;
  imamId: string;
  weekday: number; // 0=Monday, 6=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
}

export interface BlockOverride {
  id: string;
  repeatingBlockId: string;
  occurrenceDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isDeleted: boolean;
}

export interface RepeatingBlockWithOverrides extends RepeatingBlock {
  overrides: BlockOverride[];
}

export interface OneOffBlock {
  id: string;
  imamId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/** A resolved availability block after expanding repeating rules and applying overrides */
export interface AvailabilityBlock {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  sourceType: "repeating" | "one_off" | "override";
  sourceId: string;
}

/** A bookable time slot derived from an availability block */
export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// ─── Session / Booking ───────────────────────────────────────────────────────

export interface Session {
  id: string;
  userId: string;
  imamId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  topic: string;
  urgency: Urgency;
  mode: SessionMode;
  status: SessionStatus;
  cancellationReason: string | null;
  cancelledBy: string | null;
  videoLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionWithParticipants extends Session {
  user: Pick<User, "id" | "name" | "email">;
  imam: Pick<User, "id" | "name" | "email">;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  sentAt: Date;
  metadata: Record<string, unknown>;
}

// ─── API request / response shapes ──────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Booking flow ─────────────────────────────────────────────────────────────

export interface BookingIntake {
  topic: string;
  urgency: Urgency;
}

export interface BookingDurationSelection {
  durationMinutes: number;
}

export interface BookingSlotSelection {
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookingModeSelection {
  mode: SessionMode;
}

export type BookingStep = "intake" | "duration" | "slots" | "confirm";

export interface BookingFormState {
  step: BookingStep;
  intake: BookingIntake | null;
  duration: BookingDurationSelection | null;
  slot: BookingSlotSelection | null;
  mode: SessionMode | null;
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
