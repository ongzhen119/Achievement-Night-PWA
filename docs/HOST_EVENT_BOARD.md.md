# Aexern Host Event Board

## Purpose

Create a public `/host` page that allows players to know when Aexern is having a Warhammer Underworlds event.

This feature is an **event notice board**.

It is not Battle Log.
It is not tournament registration.
It is not a full attendance system yet.

The main problem this feature solves:

```txt
Players currently do not have one reliable place to check when the next Aexern Warhammer Underworlds session is happening.
```

The `/host` page should answer:

* When is the next event?
* Where is it held?
* What time does it start and end?
* Who is hosting?
* Is it beginner friendly?
* Is demo available?
* How many boards are available?
* What should players bring?
* How can the host notify players after creating the event?

---

# MVP Decision

For MVP, only the host can create, edit, cancel, and complete events.

Players can view events.

Players can optionally click:

```txt
I'm Interested
```

Players should not be required to manually join the event.

Do not use:

```txt
Join Event
```

Reason:

The Aexern Warhammer Underworlds community is still small. Most real confirmation will still happen in WhatsApp. A strict “Join Event” button may make the app feel too formal, and players may think they must register before attending.

The event board should reduce confusion, not add pressure.

---

# Must Implement

## 1. Public `/host` Page

Add route:

```txt
/host
```

This page is visible to everyone.

Public users can:

* View upcoming events
* View cancelled events
* View completed events
* Copy or share event info
* Press “I’m Interested” if the feature is enabled

Public users cannot:

* Create events
* Edit events
* Cancel events
* Complete events

---

## 2. Next Event Section

The top of `/host` must show the next upcoming scheduled event clearly.

Example:

```txt
Next Aexern Session

Aexern Warhammer Underworlds Casual Session
Saturday, 2:00 PM - 6:00 PM
Aexern Board Game Shop

Beginner Friendly
Demo Available
2 Boards Available
Hosted by Raven
```

Primary actions:

```txt
Copy WhatsApp Invite
Share to WhatsApp
```

Optional action:

```txt
I'm Interested
```

---

## 3. Event List

Below the next event, show event cards.

Group events into:

```txt
Upcoming Events
Past Events
Cancelled Events
```

For MVP, the layout can be simple.

Each event card should show:

* Title
* Date
* Start time
* End time
* Venue
* Host name
* Event type
* Format
* Board count
* Beginner-friendly badge
* Demo-available badge
* Interested player count
* Event status

---

## 4. Host Mode

The `/host` page should include Host Mode.

Host Mode allows protected host actions.

Host actions:

* Create event
* Edit event
* Cancel event
* Mark event as completed
* Copy WhatsApp invite
* Copy reminder message
* Copy cancellation message
* Copy event update message

Important:

The `/host` URL itself is not security.

Do not rely only on hidden frontend buttons.

Host actions must be protected by backend validation, Supabase Auth, server-side Host PIN, or another protected method.

---

## 5. Create Event

Host must be able to create an event.

Required fields:

```txt
Title
Event Type
Format
Date
Start Time
End Time
Venue
Host Name
Board Count
Beginner Friendly
Demo Available
Description
Status
```

Recommended optional fields:

```txt
Player Capacity
Venue Note
What To Bring
Prize Note
WhatsApp Note
```

Default values:

```txt
Title: Aexern Warhammer Underworlds Casual Session
Game System: Warhammer Underworlds
Event Type: Casual Session
Format: Teaching Game / Rivals / Nemesis
Venue: Aexern Board Game Shop
Host Name: Raven
Timezone: Asia/Kuala_Lumpur
Beginner Friendly: true
Demo Available: true
Board Count: 2
Status: scheduled
```

---

## 6. Event Created Notification Flow

After the host creates an event, the app must show:

```txt
Event Created Successfully
```

Then show a notification/share panel.

The panel must include:

```txt
Copy WhatsApp Invite
Share to WhatsApp
View Public Event
Back to Event Board
```

The app should generate a WhatsApp message immediately after event creation.

The host manually sends the message to the Aexern WhatsApp group.

This is the MVP notification mechanism.

Do not implement automatic PWA push notification yet.

---

## 7. WhatsApp Invite Message

The app must generate a copyable WhatsApp invite.

Example:

```txt
🎲 Aexern Warhammer Underworlds Session

📅 Date: Saturday
⏰ Time: 2:00 PM - 6:00 PM
📍 Venue: Aexern Board Game Shop
👤 Host: Raven

Beginner friendly ✅
Demo available ✅
Boards available: 2

Come play, learn, or watch. New players are welcome.

Event page:
{public_event_url}
```

If prize note exists, add:

```txt
🎁 Prize / lucky draw note:
{prize_note}
```

If player capacity exists, add:

```txt
Seats/boards are limited. Please reply in the WhatsApp group if you are coming.
```

---

## 8. Event Update Message

When the host edits an event, generate an update message.

Example:

```txt
📢 Aexern Event Update

The Warhammer Underworlds session detail has been updated.

📅 Date: Saturday
⏰ Time: 2:00 PM - 6:00 PM
📍 Venue: Aexern Board Game Shop

Please check the latest event page:
{public_event_url}
```

The host can manually copy and send this to WhatsApp.

---

## 9. Event Cancellation

Host can cancel an event.

Cancellation must require a reason.

Example reasons:

```txt
Host unavailable
Not enough players
Venue unavailable
Schedule changed
```

After cancelling, generate WhatsApp cancellation text.

Example:

```txt
⚠️ Aexern Event Cancelled

The Warhammer Underworlds session has been cancelled.

Reason:
{cancelled_reason}

We will update again when the next session is available.
```

Cancelled events should still be visible, but visually marked as cancelled.

---

## 10. Event Reminder Message

Host Mode should include:

```txt
Copy Reminder Message
```

Example reminder:

```txt
⏰ Reminder: Aexern Warhammer Underworlds Session

The session is happening today.

Time: 2:00 PM - 6:00 PM
Venue: Aexern Board Game Shop

Beginner friendly ✅
Demo available ✅

See you there!
```

For MVP, reminder is manual.

Do not implement automatic scheduled reminders yet.

---

## 11. Player Interest

Players do not need to join an event.

Instead, add optional:

```txt
I'm Interested
```

Purpose:

* Help host estimate interest
* Keep the action low-pressure
* Avoid making the app feel mandatory
* Keep WhatsApp as the real confirmation channel

After player clicks “I’m Interested”, ask for simple display name.

Example:

```txt
Your name
```

Then save:

```txt
event_id
display_name
created_at
```

Show count:

```txt
3 players interested
```

Do not treat this as confirmed attendance.

Do not block players from attending if they did not press the button.

Do not use the word:

```txt
Registered
```

Use:

```txt
Interested
```

---

## 12. Event Status

Each event should have one status:

```txt
draft
scheduled
cancelled
completed
```

### draft

Host is preparing the event. Not visible to public.

### scheduled

Event is confirmed and visible to public.

### cancelled

Event was cancelled. Visible but clearly marked.

### completed

Event already happened. Visible under past events.

---

## 13. Data Model

Suggested table:

```txt
events
```

Fields:

```txt
id
title
game_system
event_type
format
venue_name
venue_note
start_at
end_at
timezone
host_name
status
beginner_friendly
demo_available
board_count
player_capacity
description
what_to_bring
prize_note
whatsapp_note
public_event_url
cancelled_reason
completed_summary
created_at
updated_at
```

Suggested table:

```txt
event_interests
```

Fields:

```txt
id
event_id
display_name
created_at
```

## 14. Event Board vs Battle Log

Event Board and Battle Log must stay separate.

### Event Board

Used before the event.

Purpose:

```txt
Announce when and where players can come.
```

Example:

```txt
Aexern Warhammer Underworlds Casual Session
Saturday, 2:00 PM - 6:00 PM
Beginner friendly
Demo available
2 boards available
```

### Battle Log

Used after or between games.

Purpose:

```txt
Record game results.
```

Example:

```txt
Raven vs Hong
Skinnerkin vs Emberwatch
Final Glory: 12 - 9
Winner: Raven
Format: Rivals
```

Battle Log may optionally link to an event later:

```txt
battle_log.event_id = events.id
```

But Battle Log should not be forced during gameplay.

---

## 15. Recommended User Flow

### Player Flow

1. Player sees WhatsApp event message.
2. Player opens `/host`.
3. Player checks event date, time, and venue.
4. Player sees whether beginner demo is available.
5. Player optionally clicks “I’m Interested”.
6. Player replies in WhatsApp if they want to confirm.
7. Player attends the event.
8. Battle Log can be recorded separately after games.

### Host Flow

1. Host opens `/host`.
2. Host enters Host Mode.
3. Host creates event.
4. App shows “Event Created Successfully”.
5. App generates WhatsApp invite.
6. Host shares message to WhatsApp group.
7. Host copies reminder message before event if needed.
8. Host cancels or updates event if needed.
9. After event, host marks event as completed.
10. Optional: host writes completed summary.

---

## 16. Permissions

MVP permissions:

| Action                                  | Public Player | Host |
| --------------------------------------- | ------------: | ---: |
| View event                              |           Yes |  Yes |
| Share event                             |           Yes |  Yes |
| Mark interested                         |           Yes |  Yes |
| Create event                            |            No |  Yes |
| Edit event                              |            No |  Yes |
| Cancel event                            |            No |  Yes |
| Complete event                          |            No |  Yes |
| Generate WhatsApp invite                |           Yes |  Yes |
| Generate update/cancel/reminder message |            No |  Yes |

## 17. No Login MVP Notes

If the app currently has no full login system:

* Public users can read events.
* Public users can mark interest.
* Public users cannot create, update, cancel, or delete events.
* Host actions must be protected.
* Do not store Host PIN or secret directly in frontend code.
* Do not rely only on frontend hidden buttons.

If using Supabase:

* Anonymous users can select public scheduled/completed/cancelled events.
* Anonymous users can insert event interest.
* Anonymous users cannot insert, update, or delete events.
* Host event management should go through protected auth or secure backend function.

---

## 18. UI Direction

The page should feel:

* Simple
* Mobile-first
* Community-friendly
* Beginner-friendly
* WhatsApp-first
* Warm like a local board game shop notice board

Prioritize:

* Big date
* Clear time
* Clear venue
* Beginner-friendly badge
* Demo-available badge
* Board count
* Share buttons
* Simple host workflow

Avoid:

* Complex registration flow
* Tournament bracket
* Loyalty points
* Push notification setup
* Too many forms
* Requiring players to log in
* Forcing Battle Log during active gameplay

---

## 19. Success Criteria

This feature is successful if:

* A new player can open `/host` and know when to come.
* Host can create an event within 1 minute.
* Host can notify the WhatsApp group immediately after creating an event.
* Players are not required to register or join.
* Players can optionally show interest.
* Event Board does not confuse with Battle Log.
* The app still feels lightweight for a 4-player community.
* The feature can later grow into attendance, reminders, event history, and Hall of Fame.

---

# Final MVP Summary

Build `/host` as the official Aexern Event Board.

Only host can manage events.

Players can view events and optionally click “I’m Interested”.

Do not require players to join events manually.

When an event is created, generate a WhatsApp notification message for the host to share.

Do not build automatic push notification yet.

Keep Event Board separate from Battle Log.

Battle Log can optionally link to an event later, but should not be required during gameplay.
