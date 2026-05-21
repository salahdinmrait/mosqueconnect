/**
 * Seed script — creates one demo mosque and one superadmin account.
 *
 * Usage:
 *   pnpm db:seed
 *
 * The superadmin is created in BOTH Supabase Auth AND the User table.
 * Subsequent staff accounts are created via the Admin dashboard (no self-registration).
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@mosqueconnect.local";
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!";
const SUPERADMIN_NAME = process.env.SEED_SUPERADMIN_NAME ?? "System Admin";

async function main() {
  console.log("🌱  Starting seed...");

  // ── 1. Create demo mosque ─────────────────────────────────────────────────
  const mosque = await prisma.mosque.upsert({
    where: { id: "demo-mosque" },
    update: {},
    create: {
      id: "demo-mosque",
      name: "Al-Noor Mosque",
      address: "123 Community Road, London, E1 1AA",
      primaryLanguage: "en",
    },
  });

  console.log(`✅  Mosque: ${mosque.name} (${mosque.id})`);

  // ── 2. Create superadmin in Supabase Auth ─────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: SUPERADMIN_NAME, role: "SUPERADMIN" },
    });

  if (authError && authError.message !== "User already registered") {
    throw new Error(`Supabase Auth error: ${authError.message}`);
  }

  const authUserId =
    authData?.user?.id ??
    (await supabase.auth.admin
      .listUsers()
      .then(({ data }) =>
        data.users.find((u) => u.email === SUPERADMIN_EMAIL)?.id
      ));

  if (!authUserId) throw new Error("Could not resolve superadmin auth user id");

  // ── 3. Upsert superadmin in User table ────────────────────────────────────
  const superadmin = await prisma.user.upsert({
    where: { id: authUserId },
    update: {},
    create: {
      id: authUserId,
      email: SUPERADMIN_EMAIL,
      name: SUPERADMIN_NAME,
      role: "SUPERADMIN",
      mosqueId: mosque.id,
      isActive: true,
    },
  });

  console.log(`✅  Superadmin: ${superadmin.email} (${superadmin.id})`);

  // ── 4. Seed demo FAQ entries ──────────────────────────────────────────────
  const faqEntries = [
    {
      category: "Prayer & Worship",
      question: "What are the five daily prayers and their times?",
      answer:
        "The five daily prayers are: Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (night). Exact times vary by location and season — use an Islamic prayer time app for your area.",
      orderIndex: 1,
    },
    {
      category: "Fasting & Ramadan",
      question: "Can I break my fast if I am ill?",
      answer:
        "Yes. Islam permits breaking the fast during Ramadan if you are ill and fasting would cause harm. The missed days should be made up (qada) after recovery, or fidya (expiation) paid if unable to make them up.",
      orderIndex: 2,
    },
    {
      category: "Halal & Haram",
      question: "Is it permissible to eat meat slaughtered by People of the Book?",
      answer:
        "The majority scholarly opinion permits eating meat slaughtered by Jews or Christians (People of the Book) as long as it is not pork and Allah's name can be invoked. However, scholars advise caution in countries where stunning renders the animal unconscious before slaughter.",
      orderIndex: 3,
    },
  ];

  for (const entry of faqEntries) {
    await prisma.faqEntry.create({
      data: { ...entry, mosqueId: mosque.id },
    });
  }

  console.log(`✅  Seeded ${faqEntries.length} FAQ entries`);
  console.log("\n🎉  Seed complete!");
  console.log(`\n   Superadmin login: ${SUPERADMIN_EMAIL}`);
  console.log(`   Password:         ${SUPERADMIN_PASSWORD}`);
  console.log("\n   ⚠️  Change the password immediately after first login.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
