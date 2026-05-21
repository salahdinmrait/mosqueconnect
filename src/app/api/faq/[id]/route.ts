import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/auth";

const updateSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(10).max(5000).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user || !["WORKER", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const entry = await prisma.faqEntry.update({ where: { id }, data: parsed.data });
  return apiSuccess(entry);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user || !["WORKER", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const entry = await prisma.faqEntry.findUnique({ where: { id } });
  if (!entry) return apiNotFound();

  await prisma.faqEntry.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
