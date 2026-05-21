import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().min(5).max(500).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryLanguage: z.string().min(2).max(10).optional(),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (user.role !== "SUPERADMIN") return apiForbidden();

  const mosque = await prisma.mosque.findFirst();
  if (!mosque) return apiError("No mosque configured", 404);

  return apiSuccess(mosque);
}

export async function PATCH(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (user.role !== "SUPERADMIN") return apiForbidden();

  const mosque = await prisma.mosque.findFirst();
  if (!mosque) return apiError("No mosque configured", 404);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const updated = await prisma.mosque.update({ where: { id: mosque.id }, data: parsed.data });
  return apiSuccess(updated);
}
