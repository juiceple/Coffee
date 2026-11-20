-- 아직 적용하지 않음. DB 저장을 켤 때 적용하세요.
create table if not exists public.brews (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.brews enable row level security;
create policy "own brews select" on public.brews for select using (user_id = auth.uid());
create policy "own brews insert" on public.brews for insert with check (user_id = auth.uid());
create policy "own brews update" on public.brews for update using (user_id = auth.uid());
create policy "own brews delete" on public.brews for delete using (user_id = auth.uid());
