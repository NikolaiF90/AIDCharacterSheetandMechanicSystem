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
- Case-insensitive command handling
- Bracketed notifications — script communicates to player without breaking AI narrative
- Debug logging system with timestamps (NotifyThem)
- Orphaned card cleanup
- D&D 5e stat foundation (STR, DEX, CON, INT, WIS, CHA)
- Designed for compatibility with Inner Self, Auto-Cards, and other popular systems

---

## Planned Features

- Editable stats directly from story card
- Tag-based auto character sheet generation `[CSMS] CharacterName`
- Dice roll system with stat modifiers
- Damage and HP tracking
- Feat system (natural language, AI-interpreted)
- Multiplayer compatibility
- SpellCasting flag
- NotifyThem as standalone publishable system

---

## Commands

```
/csms create [name]    — Create a new character sheet
/csms stats [name]     — Refresh character sheet display
/csms reset [name]     — Remove a specific character
/csms reset            — Remove all characters
/csms cleanup          — Remove orphaned story cards
```

---

## Installation

1. Copy [library.js](src/library.js) contents into your scenario's **Library** tab
2. Add to **Input** tab:
```js
CSMS("input");
const modifier = (text) => { return { text }; };
modifier(text);
```
3. Add to **Context** tab:
```js
CSMS("context");
const modifier = (text) => { return { text, stop }; };
modifier(text);
```
4. Add to **Output** tab:
```js
CSMS("output");
const modifier = (text) => { return { text }; };
modifier(text);
```

---

## Configuration

At the top of `library.js` you'll find:

```js
const NOTIFY_CONFIG =
{
  NOTIFICATION_HEADER: "!NOTIFICATION!",  // Change notification header text
  DEBUG_MODE: false                        // Set true for debug logging
}
```

Set `DEBUG_MODE: true` while building your scenario. Set to `false` before publishing.

---

## Philosophy

CSMS is built by a scripter, for scripters. Every design decision has a reason:

- **AI does the heavy lifting** — script handles math and state, AI handles narrative judgment
- **Minimal action steps** — player shouldn't need 5 commands to do 1 thing
- **Compatible by default** — works alongside Inner Self, Auto-Cards, and other systems
- **Transparent** — bracketed notifications keep players informed without breaking immersion
- **Extensible** — clean architecture, each feature is its own layer

---

## Project Status

**Phase 1 — Complete ✅**
Character sheet foundation, commands, NotifyThem integration

**Phase 2 — In Progress 🔄**
Editable stats, tag system, multiplayer

**Phase 3+ — Planned 📋**
Roll system, combat, feats

---

## Credits

Built with zero external dependencies. Compatible with AI Dungeon beta.
Companion system: **NotifyThem** (included) — standalone notification and debug logging system for AID scripts.

---

*If you use CSMS or NotifyThem in your scenario, credit is appreciated but not required. If you improve it, share it back.*
