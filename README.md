# [AID] Character Sheet and Mechanics System (CSMS)
### by PrinceF90

> *"The AI handles judgment. The script handles consistency."*

![Cover Art](assets/images/CSMS_CoverArt.png)

---

## What is CSMS?

CSMS is a narrative-first RPG mechanics system for AI Dungeon. It doesn't try to turn AI Dungeon into a traditional TTRPG simulator — it gives the AI *just enough* mechanical grounding to make your story feel real, consequential, and alive.

Most stat systems for AID tell the AI what to do. CSMS gives the AI something to *work with*.

---

## Why CSMS over other systems?

There are other DnD and stat systems out there — TATS, Hashtag DnD, and others. They're good. But CSMS is built on a different philosophy:

| Other systems | CSMS |
|---|---|
| Script decides outcomes | AI decides outcomes, script tracks them |
| Hardcoded rules | Flexible narrative mechanics |
| Player vs numbers | Player vs story |
| Combat focused | Story focused — combat is just one part |
| Single character | Multi-character, NPC sheets included |
| Fixed ruleset | Designed to be extended |

CSMS doesn't replace the AI's judgment — it *informs* it. The dice create friction. The stats give context. The AI decides what it all means in the story.

---

## Features (Current)

- Multi-character support — player and NPCs share the same system
- Dynamic story card character sheets — visible to both player and AI
- Editable stats directly from story card — script validates and syncs automatically
- Case-insensitive command handling with punctuation stripping
- Bracketed notifications — script communicates to player without breaking AI narrative
- Debug logging system with timestamps (NotifyThem)
- Orphaned card cleanup
- Compact character data injection into AI context — efficient even with large parties
- Multiplayer compatible — auto-creates sheets on join, detects active player, syncs on name change
- Banned names protection — prevents invalid character names
- **Tag system** — add `[CSMS]` to any story card title, AI reads the entry and auto-generates a character sheet when that character appears in the story
- **Dice engine** — full roll notation support (`1d20+STR`, advantage, disadvantage) with D&D 5e stat modifiers
- **Player roll command** — `/csms roll [action]` lets player invoke mechanics explicitly; AI determines the relevant stat, script rolls the dice, result feeds back into the narrative
- Module toggles — enable/disable CHARACTER_SHEETS, COMBAT, FEATS independently
- D&D 5e stat foundation (STR, DEX, CON, INT, WIS, CHA)
- Designed for compatibility with Inner Self, Auto-Cards, and other popular systems

---

## Planned Features

- Damage and HP tracking
- Feat system (natural language, AI-interpreted)
- Inventory system
- NotifyThem as standalone publishable system

---

## Commands

```
/csms create [name]    — Create a new character sheet
/csms stats [name]     — Refresh character sheet display
/csms sync [name]      — Sync story card edits back to state
/csms reset [name]     — Remove a specific character
/csms reset            — Remove all characters
/csms cleanup          — Remove orphaned story cards
/csms roll [action]    — Roll dice for an action (AI determines stat)
```

---

## Tag System

The tag system lets world makers pre-define characters without manually assigning stats. Just add `[CSMS]` to the beginning of any story card title:

```
Title:  [CSMS] Mira
Entry:  Mira is a battle-hardened mercenary with years of
        combat experience. She's fast, strong, and ruthless.
        Her body is covered in scars from countless fights.
```

When Mira's name appears in the story, CSMS automatically:
1. Reads the card entry
2. Has the AI determine appropriate stats from the description
3. Creates a proper character sheet
4. Removes the `[CSMS]` tag from the original card

The original card stays untouched. Works with manually created cards, AC-generated cards, or any other source.

---

## Roll System

CSMS puts mechanics in the player's hands. When an action has an uncertain outcome, the player invokes a roll explicitly:

```
> You try to pick the lock /csms roll
> /csms roll convince the guard to let you pass
> You attempt to leap across the gap /csms roll
```

**What happens:**
1. Script strips the command, stores the clean action text
2. Context hook injects a one-word stat question to the AI
3. AI replies with the relevant stat (DEX, STR, CHA, etc.)
4. Output hook catches the stat, rolls `1d20 + modifier`, replaces AI's response with the result
5. Player sees a notification with the full breakdown (e.g. `1d20+DEX = [14] + DEX(+2) = 16`)
6. Player presses Continue — AI narrates the outcome informed by the roll result

The AI determines *what* stat applies. The script handles *how* the dice fall. The AI decides *what it means* for the story.

**Roll modes** (used internally, available for future DC/opposed checks):
- `normal` — standard single roll
- `advantage` — roll twice, take higher
- `disadvantage` — roll twice, take lower

---

## Installation

1. Copy [library.js](src/library.js) contents into your scenario's **Library** tab
2. Add to **Input** tab:
```js
CSMS("input");
const modifier = (text) => { return { text } };
modifier(text)
```
3. Add to **Context** tab:
```js
CSMS("context");
const modifier = (text) => { return { text, stop } };
modifier(text)
```
4. Add to **Output** tab:
```js
CSMS("output");
const modifier = (text) => { return { text } };
modifier(text)
```

---

## Configuration

At the top of `library.js` you'll find two config blocks:

```js
const CSMS_CONFIG =
{
  MODULES:
  {
    CHARACTER_SHEETS: true,  // includes tag system + context injection
    COMBAT: true,            // uses dice internally, needs CHARACTER_SHEETS
    FEATS: true,             // uses dice internally, needs CHARACTER_SHEETS
    INVENTORY: false,        // Future — not yet implemented
  },

  STAT_MAX: 50,
  STAT_MIN: 1,
  AVERAGE_STAT: 10,          // Used for modifier calculation (D&D 5e formula)
  DEFAULT_STAT: 10,          // Initial value assigned to all stats on creation
  DEFAULT_HP: 10,
  DEFAULT_AC: 10,
  DEFAULT_SPEED: 30,

  LOOKBACK_ACTIONS: 5,
  INJECTED_SHEET_MAX: 20,

  AUTO_GENERATION_TAG: "[CSMS]",
  BANNED_NAMES: ["you", "adventurer"],
}

const NOTIFY_CONFIG =
{
  NOTIFICATION_HEADER: "!NOTIFICATION!",
  DEBUG_MODE: false
}
```

Set `DEBUG_MODE: true` while building your scenario. Set to `false` before publishing.

---

## Multiplayer

CSMS is fully multiplayer compatible. In third-person multiplayer adventures:
- Character sheets are **auto-created** when players join — no `/csms create` needed
- The active player is detected automatically from input
- If a player renames their character mid-session, their old sheet is removed and a new one created automatically
- "You" and other banned names are silently ignored during auto-creation

---

## Editing Stats

Players can edit their character sheet directly from the story card UI. Just change any value and the script will:
- Validate the new value on the next action
- Fall back to the last known good value if invalid
- Notify the player of any errors
- Rewrite the card cleanly

Use `/csms sync [name]` to force an immediate sync after editing.

---

## Philosophy

CSMS is built by a scripter, for scripters. Every design decision has a reason:

- **AI does the heavy lifting** — script handles math and state, AI handles narrative judgment
- **Player agency** — player decides when mechanics apply, AI decides what stat, script produces the number
- **Minimal action steps** — player shouldn't need 5 commands to do 1 thing
- **Compatible by default** — works alongside Inner Self, Auto-Cards, and other systems
- **Transparent** — bracketed notifications keep players informed without breaking immersion
- **Extensible** — clean architecture, each feature is its own layer
- **World builder friendly** — show everything, restrict nothing, warn when something's wrong

---

## Project Status

**Phase 1 — Complete ✅**
Character sheet foundation, commands, NotifyThem integration

**Phase 1.5 — Complete ✅**
Editable stats, multiplayer, context injection, banned names

**Phase 2 — Complete ✅**
Tag-based auto sheet generation

**Phase 3 — Complete ✅**
Dice engine, roll notation, stat modifiers, advantage/disadvantage

**Phase 4 — Complete ✅**
Player roll command, AI stat determination, two-action roll flow

**Phase 5 — Planned 📋**
Feat system (natural language, AI-interpreted)

---

## Credits

Built with zero external dependencies. Compatible with AI Dungeon beta.
Companion system: **NotifyThem** (included) — standalone notification and debug logging system for AID scripts.

---

*If you use CSMS or NotifyThem in your scenario, credit is appreciated but not required. If you improve it, share it back.*
