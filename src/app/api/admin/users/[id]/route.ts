import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiNotFound, apiUnauthorized } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const currentUser = await getApiUser();
  if (!currentUser) return apiUnauthorized();
  if (currentUser.role !== "SUPERADMIN") return apiForbidden();
  if (currentUser.id === id) return apiError("Cannot modify your own account this way", 400);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return apiNotFound();

  const updated = await prisma.user.update({ where: { id }, data: parsed.data });

  // Sync deactivation with Supabase Auth
  if (typeof parsed.data.isActive === "boolean" && !parsed.data.isActive) {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876600h" });
  } else if (parsed.data.isActive === true) {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "none" });
  }

  return apiSuccess(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const currentUser = await getApiUser();
  if (!currentUser) return apiUnauthorized();
  if (currentUser.role !== "SUPERADMIN") return apiForbidden();
  if (currentUser.id === id) return apiError("Cannot delete your own account", 400);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return apiNotFound();

  // Soft-delete: deactivate rather than hard delete (preserves relational integrity)
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876600h" });

  return apiSuccess({ deactivated: true });
}
