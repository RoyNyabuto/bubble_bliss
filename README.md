# Bubble Bliss Cleaners

Premium laundry booking platform — "Clean made cute." Next.js 15 + TypeScript + Tailwind + Prisma,
with an animated 3D hero, service and pricing pages, a live order tracker, and separate
owner, driver, employee, and customer dashboards.

## What's implemented vs stubbed

**Fully wired:**
- Home, services, pricing, booking, and order-tracking pages
- 3D animated hero (react-three-fiber + drei + framer-motion)
- Complete Prisma schema covering users/roles, orders, payments, services, reviews, coupons,
  employees, drivers, inventory/machines, delivery tracking, notifications, messages, and
  subscriptions
- `/api/orders` create/list route
- Mpesa STK push helper (`src/lib/mpesa.ts`) and route
- Stripe payment intent helper (`src/lib/stripe.ts`) and route
- **Login (`/login`), role-based middleware, and a `/dashboard` router** — signing in redirects
  each role to its own dashboard, and `src/middleware.ts` blocks a role from viewing another
  role's dashboard by URL

### Demo accounts (from `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Owner/admin | `owner@bubblebliss.co.ke` | `password123` |
| Driver | `driver@bubblebliss.co.ke` | `password123` |
| Employee | `employee@bubblebliss.co.ke` | `password123` |
| Customer | `customer@bubblebliss.co.ke` | `password123` |

Log in at `/login` with any of these — you'll land on the matching dashboard automatically, and
the navbar will show "Dashboard" and "Log out" instead of "Log in". Change these passwords (or
remove the seed users) before deploying for real.

**Scaffolded (UI present, needs your business logic and data wiring):**
- Owner, driver, employee, and customer dashboards — currently show layout and sample
  stats; wire them to `/api/orders`, `/api/payments`, etc.
- Socket.io live order updates — add a small custom server (`server.ts`) or a separate
  Socket.io service, then emit `order:status` events from the order update route and
  subscribe from `OrderTracker`
- Email/SMS notifications — `nodemailer` is installed; add an SMS provider (e.g. Africa's
  Talking) for SMS
- Cloudinary photo uploads for laundry notes/photos
- PWA manifest and service worker

## Getting started

```bash
npm install
cp .env.example .env   # fill in real values
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Visit `http://localhost:3000`.

## Environment variables

See `.env.example` for the full list: Postgres `DATABASE_URL`, NextAuth secret, Cloudinary,
Stripe, Mpesa Daraja credentials, SMTP, and the Socket.io URL.

## Database

```bash
npx prisma studio        # browse data
npx prisma migrate dev   # apply schema changes
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add all variables from `.env.example` in Project Settings → Environment Variables.
4. Use a managed Postgres instance (Neon, Supabase, or Vercel Postgres) for `DATABASE_URL`.
5. Run `npx prisma migrate deploy` as a build step or via a one-off job after first deploy.
6. Mpesa and Stripe webhooks need a public HTTPS URL — set `MPESA_CALLBACK_URL` and the
   Stripe webhook endpoint to your deployed domain once live.

## Folder structure

```
src/
  app/            routes (App Router): home, services, pricing, booking, track/[id],
                  dashboard/{owner,driver,employee,customer}, api/*
  components/     Hero3D, Navbar, ServiceCard, PricingCard, OrderTracker, BubblesBackground
  lib/            prisma client, auth config, stripe, mpesa
prisma/
  schema.prisma   full data model
  seed.ts         sample service/pricing data
```
