-- CardHelp MVP
-- Run after docs/supabase-host-event-board.sql. Reuses host_secrets and host_verify_pin.

create table if not exists public.card_help_entries (
  id uuid primary key default gen_random_uuid(),
  card_name text not null check (length(trim(card_name)) between 1 and 120),
  chinese_summary text not null check (length(trim(chinese_summary)) between 1 and 500),
  timing text not null check (length(trim(timing)) > 0),
  beginner_tip text check (beginner_tip is null or length(beginner_tip) <= 300),
  tags text[] not null default '{}',
  warband_name text,
  deck_name text,
  format text not null default 'Unknown'
    check (format in ('Unknown', 'Rivals', 'Nemesis', 'Both')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(array_length(tags, 1), 0) > 0)
);

create index if not exists card_help_entries_public_name_idx
  on public.card_help_entries (is_public, card_name);

create index if not exists card_help_entries_tags_idx
  on public.card_help_entries using gin (tags);

create or replace function public.card_help_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists card_help_entries_updated_at on public.card_help_entries;
create trigger card_help_entries_updated_at
before update on public.card_help_entries
for each row execute function public.card_help_touch_updated_at();

alter table public.card_help_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'card_help_entries'
      and policyname = 'public read public card help'
  ) then
    create policy "public read public card help"
      on public.card_help_entries for select using (is_public);
  end if;
end $$;

grant select on public.card_help_entries to anon, authenticated;

create or replace function public.card_help_list(p_pin text)
returns setof public.card_help_entries
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.host_verify_pin(p_pin) then
    raise exception 'HOST_PIN_INVALID';
  end if;
  return query select * from public.card_help_entries;
end;
$$;

create or replace function public.card_help_save(p_pin text, p_entry jsonb)
returns public.card_help_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.card_help_entries;
  saved public.card_help_entries;
begin
  if not public.host_verify_pin(p_pin) then
    raise exception 'HOST_PIN_INVALID';
  end if;

  r := jsonb_populate_record(null::public.card_help_entries, p_entry);

  if r.id is null then
    insert into public.card_help_entries (
      card_name, chinese_summary, timing, beginner_tip, tags,
      warband_name, deck_name, format, is_public
    ) values (
      trim(r.card_name),
      trim(r.chinese_summary),
      trim(r.timing),
      nullif(trim(coalesce(r.beginner_tip, '')), ''),
      r.tags,
      nullif(trim(coalesce(r.warband_name, '')), ''),
      nullif(trim(coalesce(r.deck_name, '')), ''),
      coalesce(r.format, 'Unknown'),
      coalesce(r.is_public, false)
    )
    returning * into saved;
  else
    update public.card_help_entries set
      card_name = trim(r.card_name),
      chinese_summary = trim(r.chinese_summary),
      timing = trim(r.timing),
      beginner_tip = nullif(trim(coalesce(r.beginner_tip, '')), ''),
      tags = r.tags,
      warband_name = nullif(trim(coalesce(r.warband_name, '')), ''),
      deck_name = nullif(trim(coalesce(r.deck_name, '')), ''),
      format = coalesce(r.format, 'Unknown'),
      is_public = coalesce(r.is_public, false)
    where id = r.id
    returning * into saved;
  end if;

  if saved.id is null then
    raise exception 'CARD_HELP_NOT_FOUND';
  end if;

  return saved;
end;
$$;

create or replace function public.card_help_delete(p_pin text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.host_verify_pin(p_pin) then
    raise exception 'HOST_PIN_INVALID';
  end if;
  delete from public.card_help_entries where id = p_id;
end;
$$;

grant execute on function public.card_help_list(text) to anon, authenticated;
grant execute on function public.card_help_save(text, jsonb) to anon, authenticated;
grant execute on function public.card_help_delete(text, uuid) to anon, authenticated;
