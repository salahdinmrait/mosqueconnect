import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      escalationNote: {
        include: { worker: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!question) return apiNotFound();

  // Access control: users can only see their own questions
  if (user?.role === "USER" && question.userId !== user.id) return apiForbidden();
  if (!user && !question.sessionToken) return apiForbidden();

  return apiSuccess(question);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  // Only workers/imams/admin can update status
  if (user.role === "USER") return apiForbidden();

  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status) return apiError("status is required", 400);

  const question = await prisma.question.update({
    where: { id },
    data: { status: status as never },
  });

  return apiSuccess(question);
}
