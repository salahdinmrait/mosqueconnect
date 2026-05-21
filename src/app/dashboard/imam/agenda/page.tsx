import { requireImam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WeeklyCalendar } from "@/components/agenda/WeeklyCalendar";

export default async function ImamAgendaPage() {
  const user = await requireImam();

  const [repeatingBlocks, oneOffBlocks] = await Promise.all([
    prisma.repeatingBlock.findMany({
      where: { imamId: user.id },
      include: { overrides: true },
    }),
    prisma.oneOffBlock.findMany({ where: { imamId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>My Agenda</h1>
        <p className="mt-1 text-gray-600">
          Manage your availability blocks. Community members can only book slots that fit within these windows.
        </p>
      </div>
      <WeeklyCalendar
        repeatingBlocks={repeatingBlocks}
        oneOffBlocks={oneOffBlocks}
        imamId={user.id}
      />
    </div>
  );
}
