import { notFound } from "next/navigation";
import { requireWorker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionThread } from "@/components/questions/QuestionThread";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function WorkerQuestionPage({ params }: Params) {
  const { id } = await params;
  await requireWorker();

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      escalationNote: {
        include: { worker: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!question) notFound();

  return (
    <div className="max-w-3xl">
      <QuestionThread question={question} role="WORKER" />
    </div>
  );
}
