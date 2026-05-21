import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MosqueSettingsForm } from "@/components/admin/MosqueSettingsForm";

export default async function MosqueSettingsPage() {
  await requireSuperadmin();
  const mosque = await prisma.mosque.findFirst();

  return (
    <div className="max-w-2xl space-y-6">
      <h1>Mosque Settings</h1>
      <MosqueSettingsForm mosque={mosque} />
    </div>
  );
}
