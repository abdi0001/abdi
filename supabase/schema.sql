-- AFAR SPORTS LIVE initial Supabase schema
-- Apply in Supabase SQL Editor. Public read access; admin writes only.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('viewer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text not null default '2026/27',
  sport text not null default 'Football',
  region text not null default 'Afar',
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  name text not null,
  short_name text,
  zone text,
  logo_url text,
  primary_color text,
  created_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  kickoff_at timestamptz,
  venue text,
  status text not null default 'upcoming' check (status in ('upcoming','live','halftime','finished','postponed','cancelled')),
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  minute integer check (minute between 0 and 150),
  round_label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  event_type text not null check (event_type in ('goal','yellow_card','red_card','substitution','note')),
  minute integer,
  player_name text,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at before update on public.matches
for each row execute function public.touch_updated_at();

-- Standings calculated from finished matches only.
create or replace view public.competition_standings as
with played as (
  select competition_id, home_team_id as team_id, 1 as played,
    case when home_score > away_score then 1 else 0 end as won,
    case when home_score = away_score then 1 else 0 end as drawn,
    case when home_score < away_score then 1 else 0 end as lost,
    home_score as gf, away_score as ga
  from public.matches where status = 'finished'
  union all
  select competition_id, away_team_id as team_id, 1 as played,
    case when away_score > home_score then 1 else 0 end as won,
    case when home_score = away_score then 1 else 0 end as drawn,
    case when away_score < home_score then 1 else 0 end as lost,
    away_score as gf, home_score as ga
  from public.matches where status = 'finished'
), totals as (
  select competition_id, team_id, sum(played)::int as played, sum(won)::int as won,
    sum(drawn)::int as drawn, sum(lost)::int as lost, sum(gf)::int as goals_for,
    sum(ga)::int as goals_against, (sum(gf)-sum(ga))::int as goal_difference,
    (sum(won)*3+sum(drawn))::int as points
  from played group by competition_id, team_id
)
select t.competition_id, t.id as team_id, t.name as team_name, coalesce(x.played,0) as played,
  coalesce(x.won,0) as won, coalesce(x.drawn,0) as drawn, coalesce(x.lost,0) as lost,
  coalesce(x.goals_for,0) as goals_for, coalesce(x.goals_against,0) as goals_against,
  coalesce(x.goal_difference,0) as goal_difference, coalesce(x.points,0) as points
from public.teams t left join totals x on x.team_id=t.id and x.competition_id=t.competition_id;

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;
alter table public.news enable row level security;

-- Read policies for public pages.
drop policy if exists public_read_profiles on public.profiles;
create policy public_read_profiles on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists public_read_competitions on public.competitions;
create policy public_read_competitions on public.competitions for select to anon, authenticated using (true);
drop policy if exists public_read_teams on public.teams;
create policy public_read_teams on public.teams for select to anon, authenticated using (true);
drop policy if exists public_read_matches on public.matches;
create policy public_read_matches on public.matches for select to anon, authenticated using (true);
drop policy if exists public_read_events on public.match_events;
create policy public_read_events on public.match_events for select to anon, authenticated using (true);
drop policy if exists public_read_published_news on public.news;
create policy public_read_published_news on public.news for select to anon, authenticated using (published = true or public.is_admin());

-- Admin-only writes.
do $$ declare tbl text; begin
  foreach tbl in array array['competitions','teams','matches','match_events','news'] loop
    execute format('drop policy if exists admin_manage_%I on public.%I', tbl, tbl);
    execute format('create policy admin_manage_%I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', tbl, tbl);
  end loop;
end $$;

-- Profiles: admins may update roles; a user can read their own row only.
drop policy if exists admin_manage_profiles on public.profiles;
create policy admin_manage_profiles on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enable Realtime publication for live match updates.
do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null; end $$;
