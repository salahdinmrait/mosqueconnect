import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { QUESTION_STATUSES } from "@/lib/constants";
import type { BadgeColor } from "@/components/ui";

export default async function UserQuestionsPage() {
  const user = await requireRole("USER", "SUPERADMIN");

  const questions = await prisma.question.findMany({
    where: { userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1>My Questions</h1>

      {questions.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-sm">You haven&apos;t asked any questions yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/user/questions/${q.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.category} · {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge color={QUESTION_STATUSES[q.status].color as BadgeColor}>
                    {QUESTION_STATUSES[q.status].label}
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
