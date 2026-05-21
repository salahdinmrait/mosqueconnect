import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiNotFound, apiUnauthorized } from "@/lib/auth";

const updateSchema = z.object({
  videoLink: z.string().url().optional(),
  status: z.enum(["CONFIRMED", "COMPLETED"]).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      imam: { select: { id: true, name: true, email: true } },
    },
  });

  if (!session) return apiNotFound();

  // Users can only see their own sessions
  if (user.role === "USER" && session.userId !== user.id) return apiForbidden();
  if (user.role === "IMAM" && session.imamId !== user.id) return apiForbidden();

  return apiSuccess(session);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return apiNotFound();

  // Only imam or admin can update video link / status
  if (user.role === "USER") return apiForbidden();
  if (user.role === "IMAM" && session.imamId !== user.id) return apiForbidden();

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const updated = await prisma.session.update({ where: { id }, data: parsed.data });
  return apiSuccess(updated);
}
