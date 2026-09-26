-- TI4 only. This migration does not alter any SWPA tables or policies.
begin;
create table if not exists public.ti4_draft_rooms_v1 (
  id uuid primary key,
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ti4_state_id_matches check (state->>'id' = id::text),
  constraint ti4_state_revision_matches check ((state->>'revision')::bigint = revision),
  constraint ti4_state_size check (octet_length(state::text) < 1048576)
);
alter table public.ti4_draft_rooms_v1 enable row level security;
revoke all on table public.ti4_draft_rooms_v1 from anon, authenticated;
grant select, insert, update, delete on table public.ti4_draft_rooms_v1 to service_role;
comment on table public.ti4_draft_rooms_v1 is 'Private TI4 room state. Access only through the authenticated TI4 server routes; never expose state directly to clients.';
commit;
