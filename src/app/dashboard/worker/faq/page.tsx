import { requireWorker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FaqEditor } from "@/components/faq/FaqEditor";

export default async function WorkerFaqPage() {
  await requireWorker();

  const mosque = await prisma.mosque.findFirst();
  const entries = mosque
    ? await prisma.faqEntry.findMany({
        where: { mosqueId: mosque.id },
        orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <h1>FAQ Management</h1>
      <FaqEditor entries={entries} />
    </div>
  );
}
