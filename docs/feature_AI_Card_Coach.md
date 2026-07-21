# Feature: AI Card Coach (Chinese Card Explanation)

## Overview

The Playmat already allows players to tap a card and view its original English text.

Many beginner players can read basic English, but they still struggle to understand **when** and **why** to play a card. During games they frequently stop to ask experienced players for explanations, slowing down gameplay.

This feature adds an optional **AI Chinese Coach** inside the existing Card Detail dialog. Instead of directly translating the card, the AI explains it like an experienced Warhammer Underworlds player using simple conversational Chinese.

---

# Problem

Current experience:

* Player opens card detail.
* Reads official English text.
* Still doesn't know:

  * What does this card actually do?
  * When should I play it?
* Needs to ask another player.
* Game flow is interrupted.

For new players, literal translation is often just as confusing as the original English.

---

# Goal

Reduce the need to ask experienced players during games.

A player should understand the purpose of a Power/Objectives card in **less than 10 seconds**.

The explanation should prioritize gameplay understanding instead of rulebook wording.

---

# User Story

**As a beginner player**

I want to tap a card and instantly see a simple Chinese explanation

So I know when to use the card without asking someone else.

---

# UX Flow

```
Tap Card

↓

Card Detail Popup

↓

Original English Card

↓

✨ AI Coach (Chinese)

⭐ 一句话重点

⏰ 使用时机
```

The original English card remains the source of truth.

The Chinese explanation is a learning aid only.

---

# AI Prompt

```
You are an experienced Warhammer Underworlds coach.

Do NOT translate the card literally.

Instead, explain it for players using simple, conversational Chinese
(Malaysia/Taiwan style).

Avoid official rulebook wording whenever possible.

For every Power card and Objective card,
output ONLY these sections.

⭐ 一句话重点
(One short sentence explaining what the card does.)

⏰ 使用时机
(Explain when the player usually wants to play this card.)

Focus on helping a beginner understand the card in under 10 seconds.
```

---

# Example

## Original Card

Critical Effort

Score this immediately after you make an Attack roll if any of the results was a critical.

---

### AI Output

⭐ **一句话重点**

攻击时只要掷出一个暴击，就立刻得 1 荣誉。

⏰ **使用时机**

你的战队容易掷出暴击时最容易完成，攻击完马上记得检查有没有达成。

---

# UI Design

Inside the existing Card Detail popup.

```
------------------------------------

Card Image

Original Card Text

------------------------------------

✨ AI 中文教练

⭐ 一句话重点

......

⏰ 使用时机

......

------------------------------------
```

The AI section should feel like additional help instead of replacing the original card.

---

# Performance

AI response should be generated once and cached.

Suggested cache key:

```
CardId
+
Language
+
PromptVersion
```

Example

```
critical-effort
zh-CN
v1
```

Future prompt improvements can simply increase the PromptVersion.

---

# Future Expansion

Potential future AI sections:

* 🎯 为什么值得带？
* ⚠️ 新手容易犯的错误
* 🤝 常见连招
* 🔥 强度评分
* 🎲 Rivals Deck Synergy
* 🏆 Championship Advice

These are intentionally excluded from MVP to keep explanations concise.

---

# Acceptance Criteria

* Tapping a card still shows the existing English card.
* Every **Power** and **Objective** card includes an AI Chinese explanation.
* AI output contains **only**:

  * ⭐ 一句话重点
  * ⏰ 使用时机
* Explanation uses conversational Chinese instead of literal translation.
* Average reading time is under **10 seconds**.
* AI response is cached to avoid repeated generation.
* Original English text remains visible as the authoritative card text.

---

## Why only these two sections?

Early playtests showed that beginners mainly ask two questions:

1. **"这张卡是做什么的？"** → ⭐ 一句话重点
2. **"什么时候打最好？"** → ⏰ 使用时机

By limiting the output to these two answers, the feature minimizes reading time, reduces cognitive load during matches, and helps keep gameplay flowing without overwhelming new players.
