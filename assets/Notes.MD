# CSMS Technical Notes

## AID Environment Discoveries

### globalThis dump (beta, Feb 2026)
```
"global"
"log"           ← native shorthand for console.log
"sandboxConsole"
"storyCards"    ← direct array manipulation works
"worldInfo"
"updateStoryCards"  ← native but unreliable, use storyCards directly
"updateState"       ← native but behavior unclear, use state directly
"state"
"memory"        ← separate from state.memory, don't write to this
"text"
"info"
"history"
```

### Key Findings
- `log()` is a native global shorthand for `console.log()`
- `storyCards.push()` works for creation, direct mutation works for updates
- `updateStoryCards` — tested, unreliable. Stick to direct `storyCards` manipulation
- `updateState` — tested, doesn't reflect changes. Use `state.x = y` directly
- `memory` global and `state.memory` are SEPARATE objects. Only write to `state.memory`
- Input text always has newline prefix — always `.trim()` before processing
- Script doesn't run if AI stutters/lags — player must retry, nothing we can do
- `.includes()` works fine on strings as long as values are sanitized with `|| ""`
- New storyCards pushed mid-output don't appear in UI until next action — AID rendering quirk

### state.memory
- `state.memory.context` — write to this to override Plot Essentials
- `state.memory.authorsNote` — write to this to override Author's Note
- `state.memory.frontMemory` — injected before last action, invisible to player
- Both readable and writable confirmed

### storyCard object structure
```js
{
  id: "542586357",              // auto-assigned by AID
  createdAt: "2026-02-23...",   // auto-assigned
  updatedAt: "2026-02-23...",   // auto-assigned
  keys: "keyword1, keyword2",
  entry: "card content here",
  type: "class",                // "class" = default, or custom string e.g "1- Species"
  title: "Card Title",
  description: "Notes field — shown to player during character creation",
  useForCharacterCreation: false  // true = card appears as selectable option in character creator scenarios
}
```

### Scenario Types (AID)
- **Classic** — standard adventure, PE supports `${placeholder}` template syntax for player input
- **Multi-choice** — player selects from creator-defined paths, each with different story openings
- **Character creator** — player builds character by selecting story card options, story starts blank
  - Cards with `useForCharacterCreation: true` appear as options
  - Selected options get written to Plot Essentials automatically
  - Classic scenario with PE templates gives MORE control — preferred for CSMS

### Multiplayer Findings (tested Feb 2026)
- `info.characters` returns **array of strings**, NOT array of objects
  - Documentation says `[{ name: "Sam" }]` — THIS IS WRONG
  - Actual format: `["Nikolai", "Datwangye"]`
- `info.characters` can contain empty strings — always guard with `!charName || charName.trim() === ""`
- All players default to name "You" on join — must change manually
- Third Person plot component switches input format from `> You` to `> Name`
- All players see the same output in real-time
- Host model settings apply to all players
- Name changes mid-session don't sync instantly across all screens — AID UI lag
- Input format in third person: `\n> CharacterName action here`

### Known Bugs / Limitations
- `stop: true` in input modifier also suppresses player action from displaying
- Script Test panel unreliable — use PLAY + INSPECT workflow instead
- LMI and logs expire after a few minutes — keep second tab open while testing
- `updateWorldEntry` throws error if index doesn't exist (no longer silent)
- Inspect panel (Last AI Call) unreliable — use `log()` to verify frontMemory injection
- New storyCards pushed in output hook don't appear in UI until next player action

---

## Design Decisions

### Why `state.characters[]` array instead of `state.character`
Multiple characters needed — player + NPCs. Array allows `find()`, `findIndex()`, iteration. Single object would require separate storage per character.

### Why `storedName` in handleReset
Player might type "JonaTHan" — `findCharacter()` finds it case-insensitively but `removeCharacterCard()` does exact title match. Always use the stored name from state for card operations.

### Why bracketed notifications `[...]`
AI treats bracketed content as out-of-character notes — sees it but doesn't narrate it directly. Established AID convention (same as `[Author's note:]`). Keeps narrative clean.

### Why regex scan instead of startsWith for commands
AID prepends `> You` or `> You say, "..."` to do/say inputs. Format changes between versions. Scanning entire input for `/csms` pattern anywhere is future-proof and format-agnostic.

### Why position-based parsing in parseCharacterCard
Reading values by position instead of label means player can rename any label without breaking the parser. `srt: 14` still gives us `14` for STR. Label is irrelevant — structure is what matters.

### Why `\S+` instead of `\d+` in parseCharacterCard regex
`\d+` fails silently if player types `ee` for a stat value — entire line match returns null and `safeInt` never gets called. `\S+` captures anything, lets `safeInt` handle validation and error reporting properly.

### Why `isMultiplayerCharacter` flag
Without it, `syncMultiplayerCharacters()` would delete NPC sheets when they're not in `info.characters`. Flag ensures only actual multiplayer player sheets get synced against the player list.

### Why compact injection format for frontMemory
Full character sheets in frontMemory would consume too much context. One-line format `[CSMS|Name|HP:x/y|AC:z|...]` gives AI all mechanical data it needs in minimum tokens. 20 characters × ~60 chars = ~1200 chars — very manageable.

### Why keyword system was deprioritized
AID's native keyword system is unreliable for cross-script compatibility. Direct `frontMemory` injection gives us full control over what the AI sees and when. No keyword conflicts possible.

### Why `state.csmsPending` is a single-item queue
AI generation happens one at a time — we hijack the entire output for stat generation. Processing multiple simultaneously would cause chaos. One per action is intentional. Multiple tagged cards process sequentially over consecutive actions.

### Why three branches in processTaggedCards
- Separate CS exists → player already has a sheet, just sync and clean tag
- Tagged card IS the CS → player put tag on their own sheet, parse and rename
- No CS anywhere → trigger AI generation
Each case needs different handling. Clear branching prevents silent wrong behavior.

### Why NotifyThem is separate from CSMS
Independent reusability — other scripters can use NotifyThem without CSMS. Publishable as standalone system. Clean separation of concerns.

---

## Command Architecture

```
Player input (any format)
    ↓
Input hook — regex scan for /csms anywhere in text
    ↓
parseCommand() — extract action and param
    ↓
handle[Action]() — execute, return result string
    ↓
notify(result) — store in state.notifyMessages
    ↓
Original player text passes to AI unchanged
    ↓
Context hook — parseCharacterCard + injectActiveCharacters + syncMultiplayerCharacters + processTaggedCards
    ↓
AI generates narrative (or stat response if csmsPending)
    ↓
Output hook — generateNarrativeSheet() + updateNotification()
    ↓
Player sees: [CSMS notification] + AI narrative
```

---

## Tag System Flow

```
World maker creates: [CSMS] Mira card with description entry
    ↓
Context hook — processTaggedCards() finds [CSMS] Mira
    ↓
Check recent history — does "Mira" appear?
    ↓
YES — check for existing CS
    ↓
No CS found — set state.csmsPending = "Mira"
Inject stat generation prompt into frontMemory
    ↓
AI responds with: STR:x DEX:x CON:x INT:x WIS:x CHA:x HP:x AC:x
    ↓
Output hook — generateNarrativeSheet() detects csmsPending
Parse stats, create character, updateCharacterCard()
Remove [CSMS] tag from original card
Strip stat string from visible output
Clear state.csmsPending
    ↓
Player sees: [Character sheet generated for Mira!] + normal narrative
```

---

## Compatibility Notes

### Inner Self (LewdLeah)
- IS uses `storyCards` directly — compatible
- IS uses `state` — compatible, use namespaced keys (`state.characters` not `state.char`)
- IS uses `state.memory` — compatible, don't overwrite IS memory fields
- Architecture mirrors IS pattern (`InnerSelf("input")` → `CSMS("input")`)
- IS scans history for character triggers — same approach as our `LOOKBACK_ACTIONS`

### Auto-Cards
- AC generates cards by character name keywords — potential overlap
- Current mitigation: `csms_cs_${name}` prefix on card keys
- Better solution: direct `frontMemory` injection (implemented) makes keyword matching irrelevant
- Tag system works WITH AC — AC generates a card, world maker adds `[CSMS]` tag, CSMS generates sheet

### General compatibility rule
- Always namespace state variables: `state.characters`, `state.notifyMessages` etc
- Never use generic keys that other scripts might use
- `📋` emoji prefix on card titles — distinctive enough to avoid conflicts

---

## File Structure
```
src/
  library.js        — Main script (NotifyThem + CSMS)
assets/
  Notes.MD          — This file
  Milestones.MD     — Phase tracking
  Changelog.MD      — Version history
  images/
    CSMS_CoverArt.png
README.md           — Public documentation
```

---

## Context Recovery (for new Claude sessions)
Paste this at start of conversation:
*"Here's our AID CSMS project: [library.js](https://raw.githubusercontent.com/NikolaiF90/AIDCharacterSheetandMechanicSystem/refs/heads/main/src/library.js) and [Notes.MD](https://raw.githubusercontent.com/NikolaiF90/AIDCharacterSheetandMechanicSystem/refs/heads/main/assets/Notes.MD). For reference, here's the [AI Dungeon official scripting site](https://help.aidungeon.com/scripting), though it could be outdated. Read all and let's continue from Phase 3."*
