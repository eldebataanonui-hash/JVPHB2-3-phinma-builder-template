-- 023 — optional social media usernames on profiles.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Traders can add their Facebook, Instagram, TikTok, X, YouTube and
-- Discord USERNAMES (not web addresses). The website builds each link
-- itself, always to the real site, so a profile link can never point to
-- a phishing page. The database only accepts plain usernames.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

alter table profiles
  add column if not exists social_facebook  text,
  add column if not exists social_instagram text,
  add column if not exists social_tiktok    text,
  add column if not exists social_x         text,
  add column if not exists social_youtube   text,
  add column if not exists social_discord   text;

-- Plain usernames only: letters, numbers, dots, dashes and underscores.
-- No slashes or colons, so nothing that could become a web address.
alter table profiles drop constraint if exists profiles_social_usernames;
alter table profiles
  add constraint profiles_social_usernames check (
        (social_facebook  is null or social_facebook  ~ '^[A-Za-z0-9._-]{1,50}$')
    and (social_instagram is null or social_instagram ~ '^[A-Za-z0-9._-]{1,50}$')
    and (social_tiktok    is null or social_tiktok    ~ '^[A-Za-z0-9._-]{1,50}$')
    and (social_x         is null or social_x         ~ '^[A-Za-z0-9._-]{1,50}$')
    and (social_youtube   is null or social_youtube   ~ '^[A-Za-z0-9._-]{1,50}$')
    and (social_discord   is null or social_discord   ~ '^[A-Za-z0-9._-]{1,50}$')
  );

-- Traders may change their description, picture and social usernames.
-- Nothing else (011, 013 and 016 still apply).
grant update (
  bio, avatar_path,
  social_facebook, social_instagram, social_tiktok,
  social_x, social_youtube, social_discord
) on profiles to authenticated;

-- Check: you should see six rows, one per social column.
select column_name
from information_schema.columns
where table_name = 'profiles' and column_name like 'social_%'
order by column_name;
