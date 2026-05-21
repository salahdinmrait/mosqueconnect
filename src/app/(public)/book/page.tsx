import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BookingFlow } from "@/components/sessions/BookingFlow";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Book a Session" };

export default async function BookPage() {
  const session = await getSession();
  if (!session) redirect(`${ROUTES.login}?redirect=${ROUTES.book}`);

  const imam = await prisma.user.findFirst({ where: { role: "IMAM", isActive: true } });

  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1>Book a Council Session</h1>
        <p className="mt-2 text-gray-600">
          Schedule a private session with the imam for guidance and support.
        </p>
      </div>
      <BookingFlow imamId={imam?.id ?? ""} imamName={imam?.name ?? "Imam"} />
    </div>
  );
}
