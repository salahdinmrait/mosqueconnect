import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(100),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid input: " + parsed.error.issues[0].message, 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return apiError("Not authenticated", 401);

  // Find the demo mosque to assign the user to by default
  const mosque = await prisma.mosque.findFirst();

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      name: parsed.data.name,
      role: "USER",
      mosqueId: mosque?.id ?? null,
    },
  });

  return apiSuccess({ success: true }, 201);
}
