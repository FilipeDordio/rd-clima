-- Migração v8: subscrições de Web Push (notificações em tempo real)
-- Executar no SQL editor do projeto Supabase

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Utilizadores gerem as suas subscricoes push"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
