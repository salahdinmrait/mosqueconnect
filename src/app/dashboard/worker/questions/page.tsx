import Link from "next/link";
import { requireWorker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { QUESTION_STATUSES } from "@/lib/constants";
import type { BadgeColor } from "@/components/ui";
import type { QuestionStatus } from "@/types";

export default async function WorkerQueuePage() {
  await requireWorker();

  const questions = await prisma.question.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: {
      user: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1>Question Queue</h1>

      {questions.length === 0 ? (
        <Card><p className="text-gray-500 text-sm">All questions handled! 🎉</p></Card>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <Link key={q.id} href={`/dashboard/worker/questions/${q.id}`} className="block">
              <Card padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.category} ·{" "}
                      {q.user ? q.user.name : "Anonymous"} ·{" "}
                      {new Date(q.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge color={QUESTION_STATUSES[q.status as QuestionStatus].color as BadgeColor}>
                    {QUESTION_STATUSES[q.status as QuestionStatus].label}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
