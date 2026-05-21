# MosqueConnect

A full-stack web platform connecting Muslim communities with their mosque digitally — ask questions, get answers from the mosque team, and book personal council sessions with the imam.

---

## What is MosqueConnect?

MosqueConnect replaces the informal, chaotic way community members currently contact mosques. It provides a structured, role-based platform where:

- **Community members** can ask Islamic and practical questions (anonymously or logged-in) and book private council sessions with the imam.
- **Mosque workers** manage the question queue, reply to questions, escalate complex cases to the imam, and maintain the FAQ.
- **The imam** sees only questions escalated to him, manages his own availability calendar, and handles booked sessions.
- **The superadmin** configures the mosque, creates staff accounts, and oversees all activity.

---

## The 4 Roles

| Role | How created | Key permissions |
|------|-------------|-----------------|
| **Superadmin** | Seed script / first-run | Full access. Creates staff. Configures mosque. |
| **Worker** | Created by Superadmin | Answers questions, manages FAQ, escalates to imam. |
| **Imam** | Created by Superadmin | Answers escalated questions, manages availability and sessions. |
| **User** | Self-registration | Asks questions (anonymously or logged-in), books sessions. |

---

## Local Setup

### Prerequisites

- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Resend](https://resend.com) account for transactional email

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/mosqueconnect.git
cd mosqueconnect
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Fill in all values — see table below
```

### 3. Set up the database

```bash
pnpm db:migrate      # run Prisma migrations against your Supabase Postgres
pnpm db:seed         # creates demo mosque + superadmin account
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) | `eyJ...` |
| `DATABASE_URL` | ✅ | Supabase Postgres connection string (pooler, port 6543) | `postgresql://...` |
| `DIRECT_URL` | ✅ | Direct connection string (used by Prisma migrate) | `postgresql://...` |
| `RESEND_API_KEY` | ✅ | Resend API key | `re_xxx` |
| `RESEND_FROM_EMAIL` | ✅ | Verified sender email address | `notify@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full app URL (no trailing slash) | `http://localhost:3000` |
| `CRON_SECRET` | ✅ | Secret token for Vercel cron endpoint | `any-random-secret` |
| `SEED_SUPERADMIN_EMAIL` | optional | Superadmin email for seed script | `admin@mosque.com` |
| `SEED_SUPERADMIN_PASSWORD` | optional | Superadmin password for seed script | `ChangeMe123!` |
| `SEED_SUPERADMIN_NAME` | optional | Superadmin display name | `System Admin` |

---

## Database Setup

MosqueConnect uses **Prisma** as an ORM over a **Supabase PostgreSQL** database.

```bash
# Run migrations (creates all tables)
pnpm db:migrate

# Generate the Prisma client
pnpm db:generate

# Seed demo data
pnpm db:seed

# Open Prisma Studio (visual DB browser)
pnpm db:studio
```

---

## Folder Structure

```
mosqueconnect/
├── prisma/                  # Schema + seed script
├── emails/                  # React Email templates
└── src/
    ├── app/
    │   ├── (public)/        # Home, FAQ, Ask, Book (unauthenticated)
    │   ├── (auth)/          # Login, Register, Forgot Password
    │   ├── dashboard/       # Role-protected dashboards
    │   └── api/             # REST API routes
    ├── components/
    │   ├── ui/              # Generic components (Button, Input, Modal…)
    │   ├── questions/       # QuestionThread, EscalationModal
    │   ├── sessions/        # BookingFlow, SlotPicker, DurationSelector
    │   ├── agenda/          # WeeklyCalendar, BlockEditor, OverrideModal
    │   ├── faq/             # FaqList, FaqEditor, FaqSearchResult
    │   ├── admin/           # AccountsManager, MosqueSettingsForm
    │   └── navigation/      # PublicNav, DashboardNav
    ├── lib/
    │   ├── availability.ts  # Slot generation algorithm (pure + DB wrapper)
    │   ├── auth.ts          # Session helpers, role guards
    │   ├── constants.ts     # Enums, route paths, labels
    │   ├── notifications.ts # Resend email sending
    │   ├── prisma.ts        # Prisma client singleton
    │   └── supabase.ts      # Supabase browser/server/admin clients
    ├── types/               # Shared TypeScript interfaces
    ├── __tests__/           # Jest unit tests
    └── middleware.ts        # Route protection
```

---

## How to Onboard a New Mosque

1. **Run the seed script** to create the first superadmin and a demo mosque.
2. **Log in** as superadmin at `/login`.
3. **Update mosque profile** at `/dashboard/admin/mosque` — set the real name, address, and logo.
4. **Create the Imam account** at `/dashboard/admin/accounts` → "Create Staff Account", role: Imam.
5. **Create Worker accounts** (one or more volunteers) at the same screen, role: Worker.
6. **Imam sets availability** by logging in and visiting `/dashboard/imam/agenda`.
7. **Seed the FAQ** — Workers can add entries at `/dashboard/worker/faq`.
8. Share the public URL with your community. Members register at `/register`.

---

## Running Tests

```bash
pnpm test           # run all Jest tests
pnpm test:watch     # watch mode
```

The availability algorithm in `src/lib/availability.ts` has full unit test coverage in `src/__tests__/availability.test.ts`.

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set all environment variables in the Vercel project settings.
4. Deploy. The cron job (`vercel.json`) will automatically run every hour to send 24h session reminders.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow the existing code style (TypeScript strict, Zod validation on all API routes, no `any`).
3. Write tests for any new algorithm logic.
4. Open a pull request with a clear description of what changed and why.
