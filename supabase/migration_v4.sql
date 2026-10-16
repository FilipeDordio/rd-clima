-- Migração v4: telefone/email/avatar no perfil, edição de perfil, password e fotos de perfil
-- Executar no SQL editor do projeto Supabase (base de dados já criada)

alter table public.profiles
  add column telefone text,
  add column email text,
  add column avatar_url text;

-- Preenche o email dos perfis já existentes a partir de auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Atualiza o trigger de criação de perfil para também gravar telefone/email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role, telefone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'tecnico'),
    new.raw_user_meta_data ->> 'telefone',
    new.email
  );
  return new;
end;
$$;

-- Impede que um utilizador normal altere o seu proprio role
create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Sem permissão para alterar o role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- Permite que cada utilizador atualize o seu proprio perfil, e que admins atualizem todos
create policy "Utilizadores atualizam o seu proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins atualizam todos os perfis"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Bucket de fotos de perfil
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "Leitura publica de avatares"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "Utilizadores fazem upload do seu avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Utilizadores atualizam o seu avatar"
  on storage.objects for update
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
