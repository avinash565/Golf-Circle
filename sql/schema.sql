-- Enable UUID generation.
create extension if not exists pgcrypto;


-- =========================================================
-- USER ROLE ENUM
-- =========================================================

-- Create user roles for normal subscribers and administrators.
do $$
begin
  create type user_role as enum ('subscriber', 'admin');
exception
  when duplicate_object then
    null;
end
$$;


-- =========================================================
-- PROFILES TABLE
-- =========================================================

-- Stores additional information about Supabase users.
create table if not exists profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  role user_role not null default 'subscriber',

  created_at timestamptz default now()
);


-- =========================================================
-- CHARITIES TABLE
-- =========================================================

-- Stores charities available to subscribers.
create table if not exists charities (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  description text not null default '',

  website text,

  active boolean not null default true,

  created_at timestamptz default now()
);


-- =========================================================
-- SUBSCRIPTIONS TABLE
-- =========================================================

-- Stores the subscription information of each user.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid unique not null
    references profiles(id)
    on delete cascade,

  -- Available plans: monthly or yearly.
  plan text not null
    check (plan in ('monthly', 'yearly')),

  -- Subscription status.
  status text not null default 'inactive',

  -- Selected charity.
  charity_id uuid
    references charities(id),

  -- Minimum charity contribution is 10%.
  charity_percent numeric not null default 10
    check (
      charity_percent >= 10
      and charity_percent <= 100
    ),

  -- Razorpay subscription ID.
  razorpay_subscription_id text,

  created_at timestamptz default now(),

  updated_at timestamptz default now()
);


-- =========================================================
-- SCORES TABLE
-- =========================================================

-- Stores Stableford scores submitted by users.
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references profiles(id)
    on delete cascade,

  -- Date on which the score was recorded.
  date date not null,

  -- Stableford score must be between 1 and 45.
  score integer not null
    check (score between 1 and 45),

  created_at timestamptz default now(),

  -- A user cannot submit two scores for the same date.
  unique (user_id, date)
);


-- =========================================================
-- DRAWS TABLE
-- =========================================================

-- Stores generated draw information.
create table if not exists draws (
  id uuid primary key default gen_random_uuid(),

  draw_date timestamp not null,

  -- Five generated numbers.
  numbers integer[] not null,

  -- Method used to generate the draw.
  method text not null,

  -- Total prize pool.
  prize_pool numeric not null default 0,

  -- Draw status.
  status text not null default 'draft',

  created_at timestamptz default now()
);


-- =========================================================
-- WINNERS TABLE
-- =========================================================

-- Stores users who won prizes in a draw.
create table if not exists winners (
  id uuid primary key default gen_random_uuid(),

  draw_id uuid
    references draws(id)
    on delete cascade,

  user_id uuid not null
    references profiles(id)
    on delete cascade,

  -- Match type can be 3, 4 or 5.
  match_type integer not null
    check (match_type in (3, 4, 5)),

  prize_amount numeric not null default 0,

  -- Optional proof/document URL.
  proof_url text,

  -- Prize payment status.
  payment_status text not null default 'pending',

  created_at timestamptz default now()
);


-- =========================================================
-- DEFAULT CHARITIES
-- =========================================================

-- Insert the initial charities.
insert into charities (
  name,
  description
)
values
(
  'Green Fairways Foundation',
  'Supports community green spaces and accessible sport.',
  ''
),
(
  'Youth Golf Futures',
  'Helps young people access coaching, equipment and mentoring.'
)
on conflict do nothing;


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

-- Enable RLS on all user-facing tables.
alter table profiles enable row level security;

alter table charities enable row level security;

alter table subscriptions enable row level security;

alter table scores enable row level security;

alter table draws enable row level security;

alter table winners enable row level security;


-- =========================================================
-- REMOVE OLD POLICIES
-- =========================================================

-- Remove existing policies before recreating them.
drop policy if exists "public charities" on charities;

drop policy if exists "own profile" on profiles;

drop policy if exists "own scores" on scores;

drop policy if exists "insert own scores" on scores;

drop policy if exists "delete own scores" on scores;

drop policy if exists "own subscription" on subscriptions;

drop policy if exists "own subscription insert" on subscriptions;

drop policy if exists "own subscription update" on subscriptions;

drop policy if exists "published draws" on draws;

drop policy if exists "own winners" on winners;


-- =========================================================
-- CHARITY POLICY
-- =========================================================

-- Anyone can view active charities.
create policy "public charities"
on charities
for select
using (active = true);


-- =========================================================
-- PROFILE POLICY
-- =========================================================

-- Users can view their own profile.
create policy "own profile"
on profiles
for select
using (auth.uid() = id);


-- =========================================================
-- SCORE POLICIES
-- =========================================================

-- Users can view their own scores.
create policy "own scores"
on scores
for select
using (auth.uid() = user_id);


-- Users can insert scores for themselves.
create policy "insert own scores"
on scores
for insert
with check (auth.uid() = user_id);


-- Users can delete their own scores.
create policy "delete own scores"
on scores
for delete
using (auth.uid() = user_id);


-- =========================================================
-- SUBSCRIPTION POLICIES
-- =========================================================

-- Users can view their own subscription.
create policy "own subscription"
on subscriptions
for select
using (auth.uid() = user_id);


-- Users can create their own subscription record.
create policy "own subscription insert"
on subscriptions
for insert
with check (auth.uid() = user_id);


-- Users can update their own subscription.
create policy "own subscription update"
on subscriptions
for update
using (auth.uid() = user_id);


-- =========================================================
-- DRAW POLICY
-- =========================================================

-- Users can view only published draws.
create policy "published draws"
on draws
for select
using (status = 'published');


-- =========================================================
-- WINNER POLICY
-- =========================================================

-- Users can view their own winning records.
create policy "own winners"
on winners
for select
using (auth.uid() = user_id);


-- =========================================================
-- NEW USER PROFILE TRIGGER
-- =========================================================

-- Automatically creates a profile whenever
-- a new user signs up through Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Remove an old profile if one somehow exists.
  drop trigger if exists on_auth_user_created
  on auth.users;

  -- Create a new profile using the user's Auth ID
  -- and full_name from user metadata.
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      ''
    )
  );

  return new;

end;
$$;


-- =========================================================
-- USER CREATION TRIGGER
-- =========================================================

-- Recreate the trigger that runs after a new user
-- is inserted into auth.users.
drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();