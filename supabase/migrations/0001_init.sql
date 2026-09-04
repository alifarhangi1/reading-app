-- Screentime -> Pages: core schema

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  author text,
  page_count integer not null check (page_count > 0),
  source text not null check (source in ('google-books', 'open-library', 'manual')),
  cover_url text,
  minutes_per_page_override numeric,
  status text not null default 'queued' check (status in ('queued', 'active', 'finished')),
  added_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists screen_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  app text not null check (app in ('tiktok', 'instagram', 'youtube')),
  minutes integer not null check (minutes >= 0),
  active_book_id_at_entry uuid references books (id) on delete set null,
  entered_at timestamptz not null default now(),
  unique (user_id, date, app)
);

create table if not exists settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  start_date date not null default current_date,
  default_minutes_per_page numeric not null default 2.0,
  active_book_id uuid references books (id) on delete set null
);

alter table books enable row level security;
alter table screen_time_entries enable row level security;
alter table settings enable row level security;

create policy "books: owner full access" on books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "screen_time_entries: owner full access" on screen_time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings: owner full access" on settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
