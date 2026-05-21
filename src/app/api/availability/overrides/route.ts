import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/auth";

const schema = z.object({
  repeatingBlockId: z.string(),
  occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isDeleted: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!["IMAM", "SUPERADMIN"].includes(user.role)) return apiForbidden();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

  // Verify the block belongs to this imam
  const block = await prisma.repeatingBlock.findFirst({
    where: { id: parsed.data.repeatingBlockId, imamId: user.id },
  });
  if (!block) return apiForbidden();

  if (!parsed.data.isDeleted && (!parsed.data.startTime || !parsed.data.endTime)) {
    return apiError("startTime and endTime are required unless isDeleted is true", 400);
  }

  const override = await prisma.blockOverride.upsert({
    where: {
      repeatingBlockId_occurrenceDate: {
        repeatingBlockId: parsed.data.repeatingBlockId,
        occurrenceDate: parsed.data.occurrenceDate,
      },
    },
    update: {
      startTime: parsed.data.startTime ?? block.startTime,
      endTime: parsed.data.endTime ?? block.endTime,
      isDeleted: parsed.data.isDeleted ?? false,
    },
    create: {
      repeatingBlockId: parsed.data.repeatingBlockId,
      occurrenceDate: parsed.data.occurrenceDate,
      startTime: parsed.data.startTime ?? block.startTime,
      endTime: parsed.data.endTime ?? block.endTime,
      isDeleted: parsed.data.isDeleted ?? false,
    },
  });

  return apiSuccess(override);
}
