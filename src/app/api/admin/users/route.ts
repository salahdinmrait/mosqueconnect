import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["WORKER", "IMAM"]),
  password: z.string().min(8),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (user.role !== "SUPERADMIN") return apiForbidden();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return apiSuccess(users);
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (user.role !== "SUPERADMIN") return apiForbidden();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name, role: parsed.data.role },
  });

  if (authError) return apiError(authError.message, 400);

  const newUser = await prisma.user.create({
    data: {
      id: authData.user.id,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      mosqueId: user.mosqueId,
    },
  });

  return apiSuccess(newUser, 201);
}
