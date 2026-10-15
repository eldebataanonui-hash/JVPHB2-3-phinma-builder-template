-- 003 — create a trader's profile automatically once their email is
-- confirmed.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Why a trigger: at sign-up the trader isn't logged in yet (they still
-- have to click the email link), so the website can't create the
-- profile row itself. Instead the database does it the moment the email
-- is confirmed. That also means: has a profile = email confirmed, which
-- is what the "Email confirmed" badge relies on.

create or replace function public.create_profile_for_confirmed_user()
returns trigger
language plpgsql
-- Runs with the function owner's rights so it can write to profiles.
-- An empty search_path stops anyone tricking it into using a fake table.
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.profiles (id, display_name)
    values (
      new.id,
      left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Trader'), 40)
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- Only the database itself should run this, never a website visitor.
revoke execute on function public.create_profile_for_confirmed_user() from public, anon, authenticated;

-- When a new login is created (covers projects with email confirmation off).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_confirmed_user();

-- When a trader clicks their confirmation link.
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.create_profile_for_confirmed_user();
