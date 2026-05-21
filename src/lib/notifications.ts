/**
 * notifications.ts — All transactional email sending functions via Resend.
 *
 * Each function:
 *  1. Renders the React Email template to HTML
 *  2. Sends via Resend
 *  3. Logs a Notification record in the DB
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import type { Session, User } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "notifications@mosqueconnect.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function sendEmail({
  to,
  subject,
  html,
  userId,
  type,
  metadata,
}: {
  to: string;
  subject: string;
  html: string;
  userId: string;
  type: string;
  metadata: Record<string, unknown>;
}) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    console.error(`[notifications] Failed to send ${type} to ${to}:`, error);
    return;
  }

  await prisma.notification.create({
    data: { userId, type, metadata },
  });
}

// ─── Booking Confirmation (to user) ──────────────────────────────────────────

export async function sendBookingConfirmation(
  session: Session,
  user: Pick<User, "id" | "email" | "name">
) {
  const html = `
    <h1>Session Confirmed</h1>
    <p>Dear ${user.name},</p>
    <p>Your council session has been booked successfully.</p>
    <ul>
      <li><strong>Date:</strong> ${session.date}</li>
      <li><strong>Time:</strong> ${session.startTime} – ${session.endTime}</li>
      <li><strong>Duration:</strong> ${session.durationMinutes} minutes</li>
      <li><strong>Mode:</strong> ${session.mode === "VIDEO" ? "Video Call" : "In Person"}</li>
      <li><strong>Topic:</strong> ${session.topic}</li>
    </ul>
    <p><a href="${APP_URL}/dashboard/user/sessions/${session.id}">View your session</a></p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Your council session is confirmed — MosqueConnect",
    html,
    userId: user.id,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMATION,
    metadata: { sessionId: session.id },
  });
}

// ─── New Session Notification (to imam) ──────────────────────────────────────

export async function sendImamNewSession(
  session: Session,
  imam: Pick<User, "id" | "email" | "name">,
  user: Pick<User, "name">
) {
  const html = `
    <h1>New Council Session Request</h1>
    <p>Dear ${imam.name},</p>
    <p>A community member has booked a council session with you.</p>
    <ul>
      <li><strong>Community Member:</strong> ${user.name}</li>
      <li><strong>Date:</strong> ${session.date}</li>
      <li><strong>Time:</strong> ${session.startTime} – ${session.endTime}</li>
      <li><strong>Duration:</strong> ${session.durationMinutes} minutes</li>
      <li><strong>Mode:</strong> ${session.mode === "VIDEO" ? "Video Call" : "In Person"}</li>
      <li><strong>Urgency:</strong> ${session.urgency}</li>
      <li><strong>Topic:</strong> ${session.topic}</li>
    </ul>
    <p><a href="${APP_URL}/dashboard/imam/sessions/${session.id}">View session details</a></p>
  `;

  await sendEmail({
    to: imam.email,
    subject: `New session booking for ${session.date} — MosqueConnect`,
    html,
    userId: imam.id,
    type: NOTIFICATION_TYPES.IMAM_NEW_SESSION,
    metadata: { sessionId: session.id },
  });
}

// ─── Session Cancellation (to the other party) ───────────────────────────────

export async function sendSessionCancellation(
  session: Session,
  recipient: Pick<User, "id" | "email" | "name">,
  cancelledByName: string,
  reason: string,
  includeRebookLink: boolean
) {
  const rebookLink = includeRebookLink
    ? `<p><a href="${APP_URL}/book?sessionId=${session.id}&rebook=true">Rebook a session</a></p>`
    : "";

  const html = `
    <h1>Session Cancelled</h1>
    <p>Dear ${recipient.name},</p>
    <p>Your council session on <strong>${session.date}</strong> at <strong>${session.startTime}</strong> has been cancelled by ${cancelledByName}.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    ${rebookLink}
  `;

  await sendEmail({
    to: recipient.email,
    subject: `Session cancelled — ${session.date} — MosqueConnect`,
    html,
    userId: recipient.id,
    type: NOTIFICATION_TYPES.SESSION_CANCELLATION,
    metadata: { sessionId: session.id, cancelledBy: cancelledByName, reason },
  });
}

// ─── Session Reminder (24 hours before) ──────────────────────────────────────

export async function sendSessionReminder(
  session: Session,
  recipient: Pick<User, "id" | "email" | "name">,
  role: "user" | "imam"
) {
  const dashboardLink =
    role === "user"
      ? `${APP_URL}/dashboard/user/sessions/${session.id}`
      : `${APP_URL}/dashboard/imam/sessions/${session.id}`;

  const videoSection =
    session.mode === "VIDEO" && session.videoLink
      ? `<p><strong>Video link:</strong> <a href="${session.videoLink}">${session.videoLink}</a></p>`
      : session.mode === "VIDEO"
        ? "<p><strong>Video link:</strong> The imam will add this shortly.</p>"
        : "";

  const html = `
    <h1>Session Reminder</h1>
    <p>Dear ${recipient.name},</p>
    <p>This is a reminder that you have a council session <strong>tomorrow</strong>.</p>
    <ul>
      <li><strong>Date:</strong> ${session.date}</li>
      <li><strong>Time:</strong> ${session.startTime} – ${session.endTime}</li>
      <li><strong>Mode:</strong> ${session.mode === "VIDEO" ? "Video Call" : "In Person"}</li>
    </ul>
    ${videoSection}
    <p><a href="${dashboardLink}">View session details</a></p>
  `;

  await sendEmail({
    to: recipient.email,
    subject: `Reminder: Council session tomorrow at ${session.startTime} — MosqueConnect`,
    html,
    userId: recipient.id,
    type: NOTIFICATION_TYPES.SESSION_REMINDER,
    metadata: { sessionId: session.id },
  });
}

// ─── Question Answered notification (to user) ─────────────────────────────────

export async function sendQuestionAnswered(
  questionId: string,
  questionContent: string,
  recipient: Pick<User, "id" | "email" | "name">
) {
  const html = `
    <h1>Your Question Has Been Answered</h1>
    <p>Dear ${recipient.name},</p>
    <p>The mosque team has replied to your question:</p>
    <blockquote>${questionContent}</blockquote>
    <p><a href="${APP_URL}/dashboard/user/questions/${questionId}">Read the reply</a></p>
  `;

  await sendEmail({
    to: recipient.email,
    subject: "Your question has been answered — MosqueConnect",
    html,
    userId: recipient.id,
    type: NOTIFICATION_TYPES.QUESTION_ANSWERED,
    metadata: { questionId },
  });
}
