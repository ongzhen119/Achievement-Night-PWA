import { Language } from "../i18n/translations";
import { getSupabaseClient } from "./supabase";

export type HostEventStatus = "draft" | "scheduled" | "cancelled" | "completed";

export const HOST_PIN_STORAGE_KEY = "aexern-host-pin";

export type HostEventRecord = {
  id: string;
  title: string;
  game_system: string;
  event_type: string;
  format: string;
  venue_name: string;
  venue_note: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  host_name: string;
  status: HostEventStatus;
  beginner_friendly: boolean;
  demo_available: boolean;
  board_count: number;
  player_capacity: number | null;
  description: string | null;
  what_to_bring: string | null;
  prize_note: string | null;
  whatsapp_note: string | null;
  cancelled_reason: string | null;
  completed_summary: string | null;
  created_at: string;
  updated_at: string;
  interested_count: number;
};

export const HOST_EVENT_DEFAULTS = {
  title: "Aexern Warhammer Underworlds Casual Session",
  game_system: "Warhammer Underworlds",
  event_type: "Casual Session",
  format: "Teaching Game / Rivals / Nemesis",
  venue_name: "Aexern Board Game Shop",
  host_name: "Raven",
  timezone: "Asia/Kuala_Lumpur",
  beginner_friendly: true,
  demo_available: true,
  board_count: 2
} as const;

type EventRow = Omit<HostEventRecord, "interested_count"> & {
  event_interests?: { count: number }[];
};

function toRecord(row: EventRow): HostEventRecord {
  const { event_interests, ...event } = row;
  return { ...event, interested_count: event_interests?.[0]?.count ?? 0 };
}

export async function fetchHostEvents(hostPin?: string) {
  const client = getSupabaseClient();
  const withInterests = "*, event_interests(count)";
  const query = hostPin
    ? client.rpc("host_list_events", { p_pin: hostPin }).select(withInterests)
    : client.from("host_events").select(withInterests);
  const { data, error } = await query.order("start_at", { ascending: true });

  if (error) {
    throw new Error(
      error.message.includes("HOST_PIN_INVALID")
        ? "status.hostPinInvalid"
        : "companion.error.load"
    );
  }

  return ((data ?? []) as EventRow[]).map(toRecord);
}

export async function verifyHostPin(pin: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("host_verify_pin", { p_pin: pin });

  if (error) {
    throw new Error("status.hostActionError");
  }

  return data === true;
}

// Create when event.id is absent, otherwise full update. Callers must pass the
// complete editable field set on update (the RPC overwrites every column).
export async function saveHostEvent(
  hostPin: string,
  event: Partial<Omit<HostEventRecord, "interested_count">>
) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("host_save_event", {
    p_pin: hostPin,
    p_event: event
  });

  if (error) {
    throw new Error(
      error.message.includes("HOST_PIN_INVALID")
        ? "status.hostPinInvalid"
        : "status.hostActionError"
    );
  }

  return toRecord(data as EventRow);
}

export async function addEventInterest(eventId: string, displayName: string) {
  const client = getSupabaseClient();
  const { error } = await client.from("event_interests").insert({
    event_id: eventId,
    display_name: displayName.trim()
  });

  if (error) {
    throw new Error("companion.error.save");
  }
}

// --- Date helpers -----------------------------------------------------------

function localeFor(language: Language) {
  return language === "zh" ? "zh-CN" : "en-US";
}

export function formatEventDay(event: HostEventRecord, language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: event.timezone
  }).format(new Date(event.start_at));
}

export function formatEventTimeRange(event: HostEventRecord, language: Language) {
  const format = new Intl.DateTimeFormat(localeFor(language), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone
  });
  return `${format.format(new Date(event.start_at))} - ${format.format(
    new Date(event.end_at)
  )}`;
}

// "YYYY-MM-DD" / "HH:mm" of an instant, as wall-clock time in the event timezone
// (sv-SE locale formats as "YYYY-MM-DD HH:mm:ss").
export function toZonedInputValues(isoInstant: string, timeZone: string) {
  const wall = new Date(isoInstant).toLocaleString("sv-SE", { timeZone });
  return { date: wall.slice(0, 10), time: wall.slice(11, 16) };
}

// Interpret a wall-clock date+time in the given timezone and return the UTC ISO
// instant, regardless of the device timezone.
export function zonedInputToIso(date: string, time: string, timeZone: string) {
  const utcGuess = new Date(`${date}T${time}:00Z`);
  const wallAtGuess = new Date(
    utcGuess.toLocaleString("sv-SE", { timeZone }).replace(" ", "T")
  );
  const wallWanted = new Date(`${date}T${time}:00`);
  return new Date(
    utcGuess.getTime() + (wallWanted.getTime() - wallAtGuess.getTime())
  ).toISOString();
}

// --- WhatsApp messages ------------------------------------------------------
// Messages are intentionally English-only: they go to one shared WhatsApp group
// and must not change with the host's UI language.

export function publicEventUrl() {
  return `${window.location.origin}/host`;
}

export function whatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function eventHeaderLines(event: HostEventRecord) {
  return [
    `📅 Date: ${formatEventDay(event, "en")}`,
    `⏰ Time: ${formatEventTimeRange(event, "en")}`,
    `📍 Venue: ${event.venue_name}${event.venue_note ? ` (${event.venue_note})` : ""}`
  ];
}

export function buildInviteMessage(event: HostEventRecord) {
  const lines = [
    `🎲 ${event.title}`,
    "",
    ...eventHeaderLines(event),
    `👤 Host: ${event.host_name}`,
    ""
  ];

  if (event.beginner_friendly) lines.push("Beginner friendly ✅");
  if (event.demo_available) lines.push("Demo available ✅");
  lines.push(`Boards available: ${event.board_count}`);
  lines.push("");
  lines.push(
    event.description?.trim() ||
      "Come play, learn, or watch. New players are welcome."
  );
  if (event.what_to_bring) {
    lines.push("", `🎒 What to bring: ${event.what_to_bring}`);
  }
  if (event.prize_note) {
    lines.push("", "🎁 Prize / lucky draw note:", event.prize_note);
  }
  if (event.player_capacity) {
    lines.push(
      "",
      "Seats/boards are limited. Please reply in the WhatsApp group if you are coming."
    );
  }
  if (event.whatsapp_note) {
    lines.push("", event.whatsapp_note);
  }
  lines.push("", "Event page:", publicEventUrl());

  return lines.join("\n");
}

export function buildUpdateMessage(event: HostEventRecord) {
  return [
    "📢 Aexern Event Update",
    "",
    "The Warhammer Underworlds session detail has been updated.",
    "",
    ...eventHeaderLines(event),
    "",
    "Please check the latest event page:",
    publicEventUrl()
  ].join("\n");
}

export function buildCancellationMessage(event: HostEventRecord) {
  return [
    "⚠️ Aexern Event Cancelled",
    "",
    `The Warhammer Underworlds session on ${formatEventDay(event, "en")} has been cancelled.`,
    "",
    "Reason:",
    event.cancelled_reason ?? "",
    "",
    "We will update again when the next session is available."
  ].join("\n");
}

export function buildReminderMessage(event: HostEventRecord) {
  const lines = [
    "⏰ Reminder: Aexern Warhammer Underworlds Session",
    "",
    `The session is happening on ${formatEventDay(event, "en")}.`,
    "",
    `Time: ${formatEventTimeRange(event, "en")}`,
    `Venue: ${event.venue_name}`,
    ""
  ];
  if (event.beginner_friendly) lines.push("Beginner friendly ✅");
  if (event.demo_available) lines.push("Demo available ✅");
  lines.push("", "See you there!");
  return lines.join("\n");
}
