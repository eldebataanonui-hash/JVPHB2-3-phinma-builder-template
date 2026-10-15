-- 020 — fix old rows that break the 014 rules, then apply the rules to
-- every row. Also narrows the display-name rule.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Found in the second code review: 014 added its rules as "not valid",
-- which only checked NEW rows. But Postgres still checks those rules
-- whenever an OLD row is changed. So an old deal with link-like text
-- couldn't move to its next step (stuck mid-trade), and an old profile
-- with a reserved name couldn't save a description or picture.
--
-- The name rule was also too broad: "Support" is an MLBB role, so names
-- like "SupportMain" were blocked, and "Badminton" contains "admin".
-- Now: names containing "aqtech" or "ghub" are still blocked; words like
-- admin, support or staff are only blocked when they ARE the whole name.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Narrower name rule ------------------------------------------------
-- "Is this name reserved?" in one place, used by the check and the
-- sign-up trigger.

create or replace function public.is_reserved_display_name(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_name !~ '[[:alnum:]]'
      or p_name ~* '(aqtech|ghub)'
      or lower(regexp_replace(p_name, '[^[:alnum:]]', '', 'g')) in (
           'admin', 'administrator', 'moderator', 'mod', 'support',
           'official', 'staff', 'team', 'helpdesk'
         );
$$;

-- 2. Fix old profiles, then apply the rule to every row ---------------

alter table profiles drop constraint if exists profiles_display_name_allowed;

update profiles
   set display_name = 'Trader'
 where public.is_reserved_display_name(display_name);

-- No "not valid" this time: every existing row is checked now.
alter table profiles
  add constraint profiles_display_name_allowed
  check (not public.is_reserved_display_name(display_name));

-- The sign-up trigger uses the same rule.
create or replace function public.create_profile_for_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 40);
begin
  if new.email_confirmed_at is not null then
    if public.is_reserved_display_name(wanted) then
      wanted := 'Trader';
    end if;

    insert into public.profiles (id, display_name)
    values (new.id, wanted)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.create_profile_for_confirmed_user() from public, anon, authenticated;

-- 3. Fix old deals, then apply the no-links rule to every row --------
-- Link-like text in old titles and descriptions becomes "[link removed]".

update deals
   set title = left(regexp_replace(title,
         '(https?://\S*|www\.\S*|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M\S*)',
         '[link removed]', 'gi'), 80),
       description = left(regexp_replace(description,
         '(https?://\S*|www\.\S*|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M\S*)',
         '[link removed]', 'gi'), 1000)
 where not (
   regexp_replace(title || ' ' || description, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
   !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)'
 );

alter table deals validate constraint deals_no_links;

-- 4. Check ------------------------------------------------------------
-- You should see two rows, both with validated = true.

select conname, convalidated as validated
from pg_constraint
where conname in ('deals_no_links', 'profiles_display_name_allowed')
order by conname;
