-- AI Card Coach: links card_help_entries to a specific catalog card (deckId:cardId)
-- so auto-generated rows survive duplicate card names across decks, and lets the
-- batch generator upsert without a tag (auto rows aren't hand-tagged like host entries).
-- Run after docs/supabase-card-help.sql.

alter table public.card_help_entries
  add column if not exists card_uid text;

create unique index if not exists card_help_entries_card_uid_idx
  on public.card_help_entries (card_uid)
  where card_uid is not null;

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.card_help_entries'::regclass
      and pg_get_constraintdef(oid) like '%array_length(tags%'
  loop
    execute format('alter table public.card_help_entries drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.card_help_entries
  add constraint card_help_entries_tags_check
  check (coalesce(array_length(tags, 1), 0) >= 0);

-- card_help_save needs to persist card_uid too (jsonb_populate_record already
-- reads it into r.card_uid; the insert/update column lists just didn't have it).
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
      card_uid, card_name, chinese_summary, timing, beginner_tip, tags,
      warband_name, deck_name, format, is_public
    ) values (
      nullif(trim(coalesce(r.card_uid, '')), ''),
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
    on conflict (card_uid) where card_uid is not null do update set
      card_name = excluded.card_name,
      chinese_summary = excluded.chinese_summary,
      timing = excluded.timing,
      beginner_tip = excluded.beginner_tip,
      tags = excluded.tags,
      warband_name = excluded.warband_name,
      deck_name = excluded.deck_name,
      format = excluded.format,
      is_public = excluded.is_public
    returning * into saved;
  else
    update public.card_help_entries set
      card_uid = nullif(trim(coalesce(r.card_uid, '')), ''),
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
