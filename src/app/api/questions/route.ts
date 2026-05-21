import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, apiSuccess, apiError } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const createSchema = z.object({
  category: z.string().min(1).max(100),
  content: z.string().min(10).max(5000),
  sessionToken: z.string().uuid().optional(),
  mosqueId: z.string().optional(),
});

// GET /api/questions — list questions (workers/imams) or own questions (users)
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sessionToken = searchParams.get("sessionToken");

  // Anonymous users can retrieve their own questions by session token
  if (!user && sessionToken) {
    const questions = await prisma.question.findMany({
      where: { sessionToken },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        escalationNote: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(questions);
  }

  if (!user) return apiSuccess([]);

  if (user.role === "USER") {
    const questions = await prisma.question.findMany({
      where: { userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        escalationNote: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(questions);
  }

  // Workers and above see all questions
  const where = status ? { status: status as never } : {};
  const questions = await prisma.question.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      messages: { orderBy: { createdAt: "asc" } },
      escalationNote: { include: { worker: { select: { id: true, name: true, role: true } } } },
    },
    orderBy: { createdAt: "asc" }, // oldest first for worker queue
  });

  return apiSuccess(questions);
}

// POST /api/questions — submit a new question
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session ? await getApiUser() : null;

  const mosque = await prisma.mosque.findFirst();

  const question = await prisma.question.create({
    data: {
      category: parsed.data.category,
      content: parsed.data.content,
      userId: user?.id ?? null,
      sessionToken: user ? null : (parsed.data.sessionToken ?? null),
      mosqueId: mosque?.id ?? null,
      status: "OPEN",
    },
  });

  // Create the initial message (the question content itself)
  await prisma.message.create({
    data: {
      questionId: question.id,
      senderId: user?.id ?? null,
      senderRole: user ? (user.role === "USER" ? "USER" : "WORKER") : "USER",
      content: parsed.data.content,
    },
  });

  return apiSuccess(question, 201);
}
