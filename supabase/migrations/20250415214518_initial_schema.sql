-- Migration: 20250415214518_initial_schema.sql
-- Description: Creates the initial database schema for 10x Cards
-- Tables: users, flashcards, sessions, session_flashcards
-- Author: Claude AI

-- Create extension for UUID support if not exists
create extension if not exists "uuid-ossp";

-- Create users table
create table users (
    id uuid primary key default uuid_generate_v4(),
    email text not null unique,
    hashed_password text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Enable RLS on users table
alter table users enable row level security;

-- Create RLS policies for users table
comment on table users is 'Table storing user account information';

-- RLS policy for anonymous users (cannot see users)
create policy "Anon users cannot view users" on users
    for select
    to anon
    using (false);

-- RLS policy for authenticated users (can only see own account)
create policy "Authenticated users can view own account" on users
    for select
    to authenticated
    using (id = auth.uid());

-- RLS policy for authenticated users (can only update own account)
create policy "Authenticated users can update own account" on users
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

-- Create flashcards table
create table flashcards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references users(id) on delete cascade,
    front text not null, -- content of the flashcard (front)
    back text not null,  -- content of the flashcard (back)
    source text not null check (source in ('AI', 'manual')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Enable RLS on flashcards table
alter table flashcards enable row level security;

-- Create RLS policies for flashcards table
comment on table flashcards is 'Table storing user flashcards';

-- RLS policy for anonymous users (cannot see flashcards)
create policy "Anon users cannot view flashcards" on flashcards
    for select
    to anon
    using (false);

-- RLS policy for authenticated users (can only see own flashcards)
create policy "Authenticated users can view own flashcards" on flashcards
    for select
    to authenticated
    using (user_id = auth.uid());

-- RLS policy for authenticated users (can insert own flashcards)
create policy "Authenticated users can insert own flashcards" on flashcards
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- RLS policy for authenticated users (can update own flashcards)
create policy "Authenticated users can update own flashcards" on flashcards
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- RLS policy for authenticated users (can delete own flashcards)
create policy "Authenticated users can delete own flashcards" on flashcards
    for delete
    to authenticated
    using (user_id = auth.uid());

-- Create sessions table
create table sessions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references users(id) on delete cascade,
    started_at timestamp with time zone not null default now(),
    ended_at timestamp with time zone null
);

-- Enable RLS on sessions table
alter table sessions enable row level security;

-- Create RLS policies for sessions table
comment on table sessions is 'Table storing user learning sessions';

-- RLS policy for anonymous users (cannot see sessions)
create policy "Anon users cannot view sessions" on sessions
    for select
    to anon
    using (false);

-- RLS policy for authenticated users (can only see own sessions)
create policy "Authenticated users can view own sessions" on sessions
    for select
    to authenticated
    using (user_id = auth.uid());

-- RLS policy for authenticated users (can insert own sessions)
create policy "Authenticated users can insert own sessions" on sessions
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- RLS policy for authenticated users (can update own sessions)
create policy "Authenticated users can update own sessions" on sessions
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- RLS policy for authenticated users (can delete own sessions)
create policy "Authenticated users can delete own sessions" on sessions
    for delete
    to authenticated
    using (user_id = auth.uid());

-- Create session_flashcards table (junction table for many-to-many relationship)
create table session_flashcards (
    session_id uuid not null references sessions(id) on delete cascade,
    flashcard_id uuid not null references flashcards(id) on delete cascade,
    status text null, -- e.g., result of flashcard review (correct/incorrect)
    reviewed_at timestamp with time zone null,
    primary key (session_id, flashcard_id)
);

-- Enable RLS on session_flashcards table
alter table session_flashcards enable row level security;

-- Create RLS policies for session_flashcards table
comment on table session_flashcards is 'Junction table linking sessions with flashcards for tracking learning progress';

-- RLS policy for anonymous users (cannot see session_flashcards)
create policy "Anon users cannot view session_flashcards" on session_flashcards
    for select
    to anon
    using (false);

-- RLS policy for authenticated users (can only see own session_flashcards)
create policy "Authenticated users can view own session_flashcards" on session_flashcards
    for select
    to authenticated
    using (
        session_id in (
            select id from sessions where user_id = auth.uid()
        )
    );

-- RLS policy for authenticated users (can insert own session_flashcards)
create policy "Authenticated users can insert own session_flashcards" on session_flashcards
    for insert
    to authenticated
    with check (
        session_id in (
            select id from sessions where user_id = auth.uid()
        )
    );

-- RLS policy for authenticated users (can update own session_flashcards)
create policy "Authenticated users can update own session_flashcards" on session_flashcards
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

-- RLS policy for authenticated users (can delete own session_flashcards)
create policy "Authenticated users can delete own session_flashcards" on session_flashcards
    for delete
    to authenticated
    using (
        session_id in (
            select id from sessions where user_id = auth.uid()
        )
    );

-- Create indexes to improve query performance
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_sessions_user_id on sessions(user_id);
create index idx_flashcards_source on flashcards(source);
create index idx_session_flashcards_session_id on session_flashcards(session_id);
create index idx_session_flashcards_flashcard_id on session_flashcards(flashcard_id); 