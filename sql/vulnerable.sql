-- Deliberately vulnerable: a UI filter is not a database access policy.
-- Do not run this migration in a real project.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null
);

-- RLS is intentionally absent.
