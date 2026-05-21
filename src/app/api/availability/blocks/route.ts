import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/auth";

const repeatingSchema = z.object({
  type: z.literal("repeating"),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const oneOffSchema = z.object({
  type: z.literal("one_off"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const createSchema = z.discriminatedUnion("type", [repeatingSchema, oneOffSchema]);

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!["IMAM", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const imamId = user.role === "IMAM" ? user.id : user.id;

  const [repeating, oneOff] = await Promise.all([
    prisma.repeatingBlock.findMany({
      where: { imamId },
      include: { overrides: true },
    }),
    prisma.oneOffBlock.findMany({ where: { imamId } }),
  ]);

  return apiSuccess({ repeating, oneOff });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!["IMAM", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  if (parsed.data.type === "repeating") {
    const { type: _type, ...data } = parsed.data;
    const block = await prisma.repeatingBlock.create({
      data: { ...data, imamId: user.id, endDate: data.endDate ?? null },
    });
    return apiSuccess(block, 201);
  } else {
    const { type: _type, ...data } = parsed.data;
    const block = await prisma.oneOffBlock.create({
      data: { ...data, imamId: user.id },
    });
    return apiSuccess(block, 201);
  }
}
