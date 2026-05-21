import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiNotFound, apiUnauthorized } from "@/lib/auth";

const updateSchema = z.object({
  blockType: z.enum(["repeating", "one_off"]),
  weekday: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // For "edit all future" — truncate the block's end date and create a new one
  splitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  newBlock: z.object({
    weekday: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().nullable().optional(),
  }).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!["IMAM", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  if (parsed.data.blockType === "repeating") {
    const block = await prisma.repeatingBlock.findFirst({
      where: { id, imamId: user.id },
    });
    if (!block) return apiNotFound();

    if (parsed.data.splitDate && parsed.data.newBlock) {
      // "Edit all future" — end the current block one day before splitDate and create a new one
      const splitDate = parsed.data.splitDate;
      const prevDate = new Date(splitDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const endDate = prevDate.toISOString().slice(0, 10);

      const [updated, newBlock] = await prisma.$transaction([
        prisma.repeatingBlock.update({ where: { id }, data: { endDate } }),
        prisma.repeatingBlock.create({
          data: {
            imamId: user.id,
            weekday: parsed.data.newBlock.weekday ?? block.weekday,
            startTime: parsed.data.newBlock.startTime,
            endTime: parsed.data.newBlock.endTime,
            startDate: parsed.data.newBlock.startDate,
            endDate: parsed.data.newBlock.endDate ?? null,
          },
        }),
      ]);
      return apiSuccess({ updated, newBlock });
    }

    const { blockType: _bt, splitDate: _sd, newBlock: _nb, ...data } = parsed.data;
    const updated = await prisma.repeatingBlock.update({ where: { id }, data });
    return apiSuccess(updated);
  } else {
    const block = await prisma.oneOffBlock.findFirst({ where: { id, imamId: user.id } });
    if (!block) return apiNotFound();
    const { blockType: _bt, splitDate: _sd, newBlock: _nb, ...data } = parsed.data;
    const updated = await prisma.oneOffBlock.update({ where: { id }, data });
    return apiSuccess(updated);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!["IMAM", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  // Try both tables
  const repeating = await prisma.repeatingBlock.findFirst({ where: { id, imamId: user.id } });
  if (repeating) {
    await prisma.repeatingBlock.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  }

  const oneOff = await prisma.oneOffBlock.findFirst({ where: { id, imamId: user.id } });
  if (oneOff) {
    await prisma.oneOffBlock.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  }

  return apiNotFound();
}
