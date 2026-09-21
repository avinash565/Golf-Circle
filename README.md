# Digital Heroes

A full-stack trainee-assignment MVP based on the supplied Digital Heroes PRD.

## Stack
- Next.js App Router + JavaScript
- Supabase PostgreSQL + Supabase Auth
- Stripe subscriptions
- Vercel deployment

## Setup
1. Create a new Supabase project.
2. Open SQL Editor and run `sql/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill values.
4. Install dependencies: `npm install`.
5. Start: `npm run dev`.
6. For Stripe webhooks locally, use Stripe CLI and point it to `/api/stripe/webhook`.

## Admin
After creating a user, change that user's `profiles.role` to `admin` in Supabase SQL editor.

## Notes
The PRD leaves some implementation choices open. This starter chooses Next.js + TypeScript, Supabase, Stripe and Vercel. The draw route includes a basic random engine and prize split; production deployment should add stronger audit controls, idempotency, transaction locking, winner matching, file storage, subscription lifecycle synchronization, and comprehensive tests before being used with real money.
