-- Flexible per-user tracked-apps list, replacing the fixed tiktok/instagram/youtube enum.

create table tracked_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table tracked_apps enable row level security;

create policy "tracked_apps: owner full access" on tracked_apps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- screen_time_entries: swap the checked `app` text column for a real FK.
alter table screen_time_entries add column app_id uuid references tracked_apps (id);

-- Backfill: create a tracked_apps row per distinct (user_id, app) already logged.
insert into tracked_apps (user_id, name)
select distinct user_id, app from screen_time_entries
on conflict (user_id, name) do nothing;

update screen_time_entries e
set app_id = t.id
from tracked_apps t
where t.user_id = e.user_id and t.name = e.app;

alter table screen_time_entries alter column app_id set not null;
alter table screen_time_entries drop constraint screen_time_entries_user_id_date_app_key;
alter table screen_time_entries drop column app;
alter table screen_time_entries add constraint screen_time_entries_user_id_date_app_id_key
  unique (user_id, date, app_id);

-- New: actual pages-read log, one entry per day (not per app).
create table reading_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  pages_read integer not null check (pages_read >= 0),
  active_book_id_at_entry uuid references books (id) on delete set null,
  logged_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table reading_log enable row level security;

create policy "reading_log: owner full access" on reading_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Track when a book actually became active, for projected-finish-date math.
alter table books add column activated_at timestamptz;
update books set activated_at = added_at where status in ('active', 'finished', 'abandoned');
