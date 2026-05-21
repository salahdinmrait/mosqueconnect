import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 2) return apiError("Query too short", 400);

  const mosque = await prisma.mosque.findFirst();
  if (!mosque) return apiSuccess([]);

  // Case-insensitive keyword search across question and answer fields
  const entries = await prisma.faqEntry.findMany({
    where: {
      mosqueId: mosque.id,
      OR: [
        { question: { contains: q, mode: "insensitive" } },
        { answer: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { orderIndex: "asc" },
    take: 5, // return top 5 matches
  });

  return apiSuccess(entries);
}
