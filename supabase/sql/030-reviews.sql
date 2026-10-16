-- 030 — reviews: both traders rate each other after a completed deal.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- * Only after the deal is COMPLETED, only the deal's seller and buyer,
--   one review each, about the other trader, within 7 days. 1–5 stars,
--   optional quick tags, optional short comment (no links). Reviews
--   can't be edited or deleted, like the trade record.
-- * "Blind" reviews: a review stays hidden from everyone but its writer
--   until the other trader has reviewed too, or the 7-day window closes.
--   Nobody can read a review and then write a revenge one.
-- * The reviewed trader is notified.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists deal_reviews (
  id            bigint      generated always as identity primary key,
  deal_id       uuid        not null references deals(id) on delete cascade,
  reviewer_id   uuid        not null references profiles(id) on delete cascade,
  reviewee_id   uuid        not null references profiles(id) on delete cascade,
  -- Was the reviewed trader the seller or the buyer in this deal?
  reviewee_role text        not null check (reviewee_role in ('seller', 'buyer')),
  stars         integer     not null check (stars between 1 and 5),
  tags          text[]      not null default '{}' check (
                  tags <@ array['as_described', 'smooth_handover', 'fast_replies', 'friendly', 'paid_on_time']::text[]
                ),
  comment       text        not null default '' check (
                  char_length(comment) <= 300 and not public.contains_link(comment)
                ),
  created_at    timestamptz not null default now(),
  unique (deal_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create index if not exists deal_reviews_reviewee_idx on deal_reviews (reviewee_id, created_at desc);

-- Nobody writes directly: only submit_review() below.
revoke all on deal_reviews from anon, authenticated;
grant select on deal_reviews to authenticated;
alter table deal_reviews enable row level security;

-- 2. When is a review visible? ---------------------------------------
-- A helper with the database's own permissions, so the rule below
-- doesn't look up its own table: the other trader has reviewed too, or
-- the deal completed more than 7 days ago (the window is closed).

create or replace function public.review_is_revealed(p_deal_id uuid, p_reviewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.deals d
           where d.id = p_deal_id and d.completed_at < now() - interval '7 days'
         )
      or exists (
           select 1 from public.deal_reviews r
           where r.deal_id = p_deal_id and r.reviewer_id <> p_reviewer_id
         );
$$;

revoke execute on function public.review_is_revealed(uuid, uuid) from public, anon;
grant execute on function public.review_is_revealed(uuid, uuid) to authenticated;

drop policy if exists "reviews are readable once revealed" on deal_reviews;
create policy "reviews are readable once revealed"
  on deal_reviews for select
  to authenticated
  using (
    (select auth.uid()) = reviewer_id
    or public.review_is_revealed(deal_id, reviewer_id)
  );

-- 3. Leaving a review ------------------------------------------------

create or replace function public.submit_review(
  p_deal_id uuid, p_stars integer, p_tags text[], p_comment text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d     public.deals%rowtype;
  me    uuid := (select auth.uid());
  other uuid;
  role  text;
begin
  select * into d from public.deals where id = p_deal_id;

  if not found or me is null or me not in (d.seller_id, d.buyer_id) then
    raise exception 'Only the traders in this deal can review it.';
  end if;

  if d.step <> 'completed' then
    raise exception 'You can review once the deal is completed.';
  end if;

  if d.completed_at < now() - interval '7 days' then
    raise exception 'The review window has closed.';
  end if;

  if me = d.seller_id then
    other := d.buyer_id;  role := 'buyer';
  else
    other := d.seller_id; role := 'seller';
  end if;

  if exists (select 1 from public.deal_reviews where deal_id = p_deal_id and reviewer_id = me) then
    raise exception 'You already reviewed this deal.';
  end if;

  insert into public.deal_reviews (deal_id, reviewer_id, reviewee_id, reviewee_role, stars, tags, comment)
  values (p_deal_id, me, other, role, p_stars,
          coalesce((select array_agg(distinct t) from unnest(p_tags) t), '{}'),
          coalesce(trim(p_comment), ''));

  insert into public.notifications (user_id, actor_id, kind, deal_id)
  values (other, me, 'review_received', p_deal_id);
end;
$$;

revoke execute on function public.submit_review(uuid, integer, text[], text) from public, anon;
grant execute on function public.submit_review(uuid, integer, text[], text) to authenticated;

-- 4. Traders' ratings (revealed reviews only) -------------------------
-- Takes a list of trader ids, so Find traders needs one call, not 20.

create or replace function public.trader_ratings(p_trader_ids uuid[])
returns table (trader_id uuid, average numeric, reviews integer, top_tags text[])
language sql
stable
security definer
set search_path = ''
as $$
  with revealed as (
    select r.reviewee_id, r.stars, r.tags
    from public.deal_reviews r
    where r.reviewee_id = any (p_trader_ids)
      and public.review_is_revealed(r.deal_id, r.reviewer_id)
      and (select auth.uid()) is not null
  )
  select
    v.reviewee_id,
    round(avg(v.stars)::numeric, 1),
    count(*)::integer,
    coalesce((
      select array_agg(tag order by n desc, tag)
      from (
        select t as tag, count(*) as n
        from revealed v2, unnest(v2.tags) as t
        where v2.reviewee_id = v.reviewee_id
        group by t
        order by n desc, t
        limit 3
      ) top
    ), '{}')
  from revealed v
  group by v.reviewee_id;
$$;

revoke execute on function public.trader_ratings(uuid[]) from public, anon;
grant execute on function public.trader_ratings(uuid[]) to authenticated;

-- 5. Check ------------------------------------------------------------
-- You should see one row: reviews are readable once revealed | SELECT | {authenticated}

select policyname, cmd, roles from pg_policies where tablename = 'deal_reviews';
