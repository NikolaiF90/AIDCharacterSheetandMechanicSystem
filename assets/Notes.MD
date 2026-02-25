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
  type: "",
  title: "Card Title",
  description: "notes field",
  useForCharacterCreation: false  // undocumented field
}
```

### Known Bugs / Limitations
- `stop: true` in input modifier also suppresses player action from displaying
- Script Test panel unreliable — use PLAY + INSPECT workflow instead
- LMI and logs expire after a few minutes — keep second tab open while testing
- `updateWorldEntry` throws error if index doesn't exist (no longer silent)

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

### Why `feedToOutput` removed from notify()
Single responsibility principle. `notify()` just stores messages. `updateNotification()` handles flushing. Cleaner separation.

### Why NotifyThem is separate from CSMS
Independent reusability — other scripters can use NotifyThem without CSMS. Publishable as standalone system. Clean separation of concerns.

### Why `CSMS_CONFIG` kept even when empty
Placeholder for future world maker settings. Consistent pattern — world makers know to look at top of file for configuration. Better to establish the pattern early.

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
AI generates narrative
    ↓
Output hook — updateNotification() prepends [brackets] to output
    ↓
Player sees: [CSMS notification] + AI narrative
```

---

## Compatibility Notes

### Inner Self (LewdLeah)
- IS uses `storyCards` directly — compatible
- IS uses `state` — compatible, use namespaced keys (state.characters not state.char)
- IS uses `state.memory` — compatible, don't overwrite IS memory fields
- Architecture mirrors IS pattern (`InnerSelf("input")` → `CSMS("input")`)

### Auto-Cards
- AC generates cards by character name keywords — DANGEROUS overlap
- Solution (planned): change card keys to `csms_cs_CharacterName` — unique enough AC won't conflict
- Inject keyword into context so AI can still reference sheet

### General compatibility rule
- Always namespace state variables: `state.characters`, `state.notifyMessages` etc
- Never use generic keys that other scripts might use
- `📋` emoji prefix on card titles — distinctive enough to avoid conflicts

---

## File Structure
```
library.js      — Main script (NotifyThem + CSMS)
README.md       — Public documentation
MILESTONES.md   — Phase tracking
NOTES.md        — This file
CHANGELOG.md    — Version history
```

---

## Context Recovery (for new Claude sessions)
Paste this at start of conversation:
*"Here's our AID CSMS project: [raw GitHub URL of library.js] and [raw GitHub URL of NOTES.md]. Read both and let's continue from Phase 1.5."*

Claude will fetch both files and be fully up to speed.
