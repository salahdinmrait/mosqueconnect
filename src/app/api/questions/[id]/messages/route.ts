import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiForbidden,
  apiNotFound,
} from "@/lib/auth";
import { sendQuestionAnswered } from "@/lib/notifications";

const schema = z.object({
  content: z.string().min(1).max(5000),
  markAnswered: z.boolean().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiForbidden();

  // Only workers/imams/admin can send replies
  if (user.role === "USER") return apiForbidden();

  const question = await prisma.question.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!question) return apiNotFound();

  // Imams can only reply to escalated questions
  if (user.role === "IMAM" && question.status !== "ESCALATED") return apiForbidden();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const senderRole =
    user.role === "IMAM" ? "IMAM" : user.role === "SUPERADMIN" ? "WORKER" : "WORKER";

  const message = await prisma.message.create({
    data: {
      questionId: id,
      senderId: user.id,
      senderRole,
      content: parsed.data.content,
    },
  });

  // Update question status
  const newStatus = parsed.data.markAnswered
    ? "ANSWERED"
    : question.status === "OPEN"
      ? "IN_PROGRESS"
      : question.status;

  await prisma.question.update({
    where: { id },
    data: { status: newStatus as never },
  });

  // Notify user if question is answered and they have an account
  if (parsed.data.markAnswered && question.user?.email) {
    await sendQuestionAnswered(question.id, question.content, question.user);
  }

  return apiSuccess(message, 201);
}
