-- migration: create flashcards, sessions, and session_flashcards tables with rls and policies
-- metadata:
--   author: supabase cli migration
--   description: initial schema for flashcards app
--   tables: flashcards, sessions, session_flashcards, profiles
--   rls: enabled for all tables, policies for authenticated users
--   indices: added on user_id and source where applicable

-- ensure the uuid-ossp extension is available for uuid generation
create extension if not exists "uuid-ossp";

-- create flashcards table
create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  source text not null check (source in ('ai','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- index on flashcards.user_id
create index if not exists idx_flashcards_user_id on flashcards(user_id);
-- optional index on flashcards.source for query performance
create index if not exists idx_flashcards_source on flashcards(source);

-- enable row level security on flashcards
alter table flashcards enable row level security;

-- policies for flashcards table
-- allow authenticated users to select their own flashcards
create policy "authenticated can select own flashcards" on flashcards
  for select
  to authenticated
  using (user_id = auth.uid());
-- allow authenticated users to insert their own flashcards
create policy "authenticated can insert own flashcards" on flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());
-- allow authenticated users to update their own flashcards
create policy "authenticated can update own flashcards" on flashcards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- allow authenticated users to delete their own flashcards
create policy "authenticated can delete own flashcards" on flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- create sessions table
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

-- index on sessions.user_id
create index if not exists idx_sessions_user_id on sessions(user_id);

-- enable row level security on sessions
alter table sessions enable row level security;

-- policies for sessions table
-- allow authenticated users to select their own sessions
create policy "authenticated can select own sessions" on sessions
  for select
  to authenticated
  using (user_id = auth.uid());
-- allow authenticated users to insert their own sessions
create policy "authenticated can insert own sessions" on sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());
-- allow authenticated users to update their own sessions
create policy "authenticated can update own sessions" on sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- allow authenticated users to delete their own sessions
create policy "authenticated can delete own sessions" on sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- create session_flashcards junction table
create table if not exists session_flashcards (
  session_id uuid not null references sessions(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  status text check (status in ('correct','incorrect')),
  reviewed_at timestamptz,
  primary key (session_id, flashcard_id)
);

-- enable row level security on session_flashcards
alter table session_flashcards enable row level security;

-- policies for session_flashcards table
-- allow authenticated users to select their own session_flashcards records
create policy "authenticated can select own session_flashcards" on session_flashcards
  for select
  to authenticated
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );
-- allow authenticated users to insert their own session_flashcards records
create policy "authenticated can insert own session_flashcards" on session_flashcards
  for insert
  to authenticated
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );
-- allow authenticated users to update their own session_flashcards records
create policy "authenticated can update own session_flashcards" on session_flashcards
  for update
  to authenticated
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  )
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );
-- allow authenticated users to delete their own session_flashcards records
create policy "authenticated can delete own session_flashcards" on session_flashcards
  for delete
  to authenticated
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

-- create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles
alter table profiles enable row level security;

-- policies for profiles table
-- allow authenticated users to select their own profile
create policy "authenticated can select own profile" on profiles
  for select
  to authenticated
  using (id = auth.uid());
-- allow authenticated users to insert their own profile
create policy "authenticated can insert own profile" on profiles
  for insert
  to authenticated
  with check (id = auth.uid());
-- allow authenticated users to update their own profile
create policy "authenticated can update own profile" on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- allow authenticated users to delete their own profile
create policy "authenticated can delete own profile" on profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- create timestamp update function and triggers
create or replace function set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trig_flashcards_updated
  before update on flashcards
  for each row execute procedure set_timestamp();

create trigger trig_sessions_updated
  before update on sessions
  for each row execute procedure set_timestamp();

create trigger trig_profiles_updated
  before update on profiles
  for each row execute procedure set_timestamp();
  
-- optional: add index on session_flashcards.reviewed_at for reporting queries
create index if not exists idx_session_flashcards_reviewed_at on session_flashcards(reviewed_at); 