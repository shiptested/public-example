-- Minimal policy shape for the ShipTested teaching example.
-- Adapt grants and policies to the operations your application actually needs.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null
);

alter table public.documents enable row level security;

create policy "users can read their own documents"
on public.documents
for select
to authenticated
using ((select auth.uid()) = user_id);
