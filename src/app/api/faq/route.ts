import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden } from "@/lib/auth";

const createSchema = z.object({
  category: z.string().min(1).max(100),
  question: z.string().min(5).max(500),
  answer: z.string().min(10).max(5000),
  orderIndex: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const mosque = await prisma.mosque.findFirst();
  if (!mosque) return apiSuccess([]);

  const entries = await prisma.faqEntry.findMany({
    where: {
      mosqueId: mosque.id,
      ...(category ? { category } : {}),
    },
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
  });

  return apiSuccess(entries);
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !["WORKER", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const mosque = await prisma.mosque.findFirst();
  if (!mosque) return apiError("No mosque configured", 500);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  const maxOrder = await prisma.faqEntry.aggregate({
    where: { mosqueId: mosque.id },
    _max: { orderIndex: true },
  });

  const entry = await prisma.faqEntry.create({
    data: {
      ...parsed.data,
      mosqueId: mosque.id,
      orderIndex: parsed.data.orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
    },
  });

  return apiSuccess(entry, 201);
}
