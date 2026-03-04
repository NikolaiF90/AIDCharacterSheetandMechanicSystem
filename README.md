# [AID] Character Sheet and Mechanics System (CSMS)
### by PrinceF90

> *"The AI handles judgment. The script handles consistency."*

![Cover Art](assets/images/CSMS_CoverArt.png)

---

## What is CSMS?

CSMS is an Ordinance system for AI Dungeon.

At its core, CSMS lets world builders write conditional rules in natural language — and have those rules execute logically inside the story, without breaking narrative immersion or requiring the AI to do math.

Everything else in CSMS — character sheets, dice, inventory, combat — exists to support that. You can use each piece independently. But Ordinance is why CSMS exists.

---

## What is an Ordinance?

An Ordinance is a story card written by a world builder that injects conditional logic into the narrative. Not a god move. Not a cheat. Just a rule that steers the story in a direction that makes sense.

Some examples of what an Ordinance can do:

- A gang leader calls for reinforcements — the number of allies depends on whose territory they're in
- A character with a counter-strike style can deal half damage even when losing a roll
- A character dashes behind a target before striking — damaging only if the roll succeeds
- A faction leader negotiates differently depending on their reputation stat

The world builder writes the conditions. The AI interprets them. The script executes the numbers. Three responsibilities, cleanly separated.

---

## How It Works

```
Player triggers an Ordinance
    ↓
Script finds the Ordinance card, feeds the entry to AI
    ↓
AI judges what kind of action this is
    ↓
Damaging move   → roll first → success: damage applied / fail: narrate only
Non-damaging    → roll if needed → AI narrates outcome
Pure narrative  → AI narrates directly, no mechanics needed
```

No free damage. No bypassing dice. Every Ordinance that could hurt something goes through a roll first — even if the card doesn't explicitly say so.

---

## The Tools

Everything below supports the Ordinance system. Each module can be enabled or disabled independently.

**Character Sheets** — tracks stats, HP, AC, speed per character. Player and NPCs share the same system. Editable directly from story card UI.

**Tag System** — add `[CSMS]` to any story card title. When that character appears in the story, CSMS automatically generates their sheet from the card description. No manual stat assignment needed.

**Dice Engine** — full roll notation support (`1d20+STR`, advantage, disadvantage). Modifier calculation built in.

**Roll Command** — `/csms roll [action]` lets the player invoke mechanics explicitly. AI determines the relevant stat. Script rolls. Result feeds back into the narrative.

**Inventory** — item tracking per character, stored in the character sheet card. Player edits manually, script syncs.

**Combat** — HP tracking, damage application, death states. Feeds into Ordinance execution for any damaging moves.

---

## Commands

```
/csms create [name]              — Create a new character sheet
/csms stats [name]               — Refresh character sheet display
/csms sync [name]                — Sync story card edits back to state
/csms reset [name]               — Remove a specific character
/csms reset                      — Remove all characters
/csms cleanup                    — Remove orphaned story cards
/csms roll [action]              — Roll dice for an action (AI determines stat)
/csms ordinance/Name/Character   — Trigger an Ordinance for a character
```

---

## Writing Ordinances

Ordinances are story cards. The title is the Ordinance name. The entry is free-form natural language — write it like you're explaining a rule to the AI.

```
Title:  Quick Strike
Entry:  The character dashes forward and strikes the target before
        they can react. This is a damaging move.
```

```
Title:  Tactical Reinforcement
Entry:  When engaged in combat, the caller may request reinforcements
        once per combat. Allies arriving = XdY + X, where X depends
        on territory control: 1 (hostile), 2 (neutral), 3 (allied).
        Y = 2 × caller's Wisdom modifier. Caller must belong to a faction.
```

```
Title:  Counter Strike
Entry:  When this character loses a roll, they may still deal half
        damage to the opponent. Damage = half of opponent's roll,
        rounded down.
```

**The script's contract:** if the formula is valid, it gets calculated. If the numbers are wrong — that's on the Ordinance writer. Write clearly, write precisely.

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

```js
const CSMS_CONFIG =
{
  MODULES:
  {
    CHARACTER_SHEETS: true,  // tag system + context injection
    COMBAT: true,            // HP tracking, damage application
    ORDINANCE: true,         // the whole point
    INVENTORY: true,         // item tracking per character
  },

  STAT_MAX: 50,
  STAT_MIN: 1,
  AVERAGE_STAT: 10,          // modifier calculation baseline (D&D 5e formula)
  DEFAULT_STAT: 10,
  DEFAULT_HP: 10,
  DEFAULT_AC: 10,
  DEFAULT_SPEED: 30,

  LOOKBACK_ACTIONS: 5,
  INJECTED_SHEET_MAX: 20,

  AUTO_GENERATION_TAG: "[CSMS]",
  BANNED_NAMES: ["you", "adventurer"],
}
```

---

## Multiplayer

CSMS is fully multiplayer compatible:
- Sheets auto-created when players join — no `/csms create` needed
- Active player detected automatically from input
- Name changes mid-session handled automatically
- Banned names silently ignored during auto-creation

---

## Philosophy

- **Player decides when** mechanics apply
- **AI decides what** rules apply and how to interpret them
- **Script decides the numbers** — math is never left to the AI
- **World maker writes the conditions** — through Ordinance cards, in plain language
- **Fail loudly** — if something goes wrong, the player is notified
- **Don't blow the world while lock picking a door** — mechanics are controlled and deliberate. Freedom scales with intent.

---

## Project Status

**Phase 1 — Complete ✅** — Character sheets, commands, NotifyThem

**Phase 1.5 — Complete ✅** — Editable stats, multiplayer, context injection

**Phase 2 — Complete ✅** — Tag-based auto sheet generation

**Phase 3 — Complete ✅** — Dice engine, roll notation, stat modifiers

**Phase 4 — Complete ✅** — Player roll command, AI stat determination

**Phase 5 — Complete ✅** — Ordinance skeleton, Inventory MVP

**Phase 6 — Planned 📋** — Ordinance multi-step execution, full damaging/non-damaging flow

---

## Credits

Built with zero external dependencies. Compatible with AI Dungeon beta.
Companion system: **NotifyThem** (included) — standalone notification and debug logging for AID scripts.

---

*If you use CSMS in your scenario, credit is appreciated but not required. If you improve it, share it back.*
