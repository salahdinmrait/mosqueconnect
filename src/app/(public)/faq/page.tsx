import { prisma } from "@/lib/prisma";
import { FaqList } from "@/components/faq/FaqList";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const mosque = await prisma.mosque.findFirst();
  const entries = mosque
    ? await prisma.faqEntry.findMany({
        where: { mosqueId: mosque.id },
        orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
      })
    : [];

  return (
    <div className="container-page py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1>Frequently Asked Questions</h1>
        <p className="mt-2 text-gray-600">
          Browse our knowledge base. Can&apos;t find what you&apos;re looking for?{" "}
          <a href="/ask" className="text-brand-700 hover:underline">Ask a question.</a>
        </p>
      </div>
      <FaqList entries={entries} searchable />
    </div>
  );
}
