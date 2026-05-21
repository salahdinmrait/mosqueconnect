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

const schema = z.object({
  note: z.string().min(10).max(2000),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();

  if (!user || !["WORKER", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return apiNotFound();
  if (question.status === "ESCALATED" || question.status === "ANSWERED") {
    return apiError("Question is already escalated or answered", 400);
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  await prisma.$transaction([
    prisma.escalationNote.upsert({
      where: { questionId: id },
      update: { note: parsed.data.note, workerId: user.id },
      create: { questionId: id, workerId: user.id, note: parsed.data.note },
    }),
    prisma.question.update({
      where: { id },
      data: { status: "ESCALATED" },
    }),
  ]);

  return apiSuccess({ escalated: true });
}
