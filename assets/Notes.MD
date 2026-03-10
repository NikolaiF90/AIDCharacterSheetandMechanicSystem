# CSMS Technical Notes

---
*Philosophy and Design Decisions come first — everything else is reference material.*

---

## Philosophy

**RIM — Reusable, Ideal, Maintainable**
RIM is not a checklist. It's a mindset — the lens through which every decision is made. A function, a variable name, an architecture choice — all run through RIM before they land. Reusable means one source of truth, no duplication, future features plug into what exists. Ideal means intentional — the best answer to the actual problem, not the fastest answer to get it working. Maintainable means a stranger reads this six months later and understands it immediately. No clever tricks that require context to decode. RIM is what keeps us 10 steps ahead instead of 10 steps behind.

**Organized chaos**
AI Dungeon is chaos by nature. CSMS doesn't eliminate chaos — it organizes it. Everyone has a job: the player shows intent, the script enforces consistency, the AI decorates mechanics into narrative. Our job is to make sure everyone can do their job cleanly. Chaos is fun. Logical chaos is beautiful.

**Stability above all**
Stability beats everything else. Speed, features, size, elegance — all secondary. A slow working system beats a fast broken one. A small stable system beats a large fragile one. Everything else competes for second place. Stability is non-negotiable.

**Feature discipline**
Before adding anything, three questions: Does it solve a real problem? Is it worth risking stability? Is the system ready for it? One yes is enough to proceed. All no — park it. Features ship in their simplest stable form first. Expansion comes after stability is proven. Features grow around features, not before them.

**Think ahead, always**
AID will add new APIs, new hooks, new globals, new quirks. We don't build for today's environment — we build so tomorrow's changes require the least possible surgery. Make room. Leave doors open. Never paint yourself into a corner just to solve today's problem. We don't plan to survive an issue. We plan to survive as long as we can.

**Blame policy**
CSMS offers auto-repair where reasonable and notifies when something is wrong. But it does not compensate for every possible misuse. If a world maker breaks their own card, that's on them. Fixes are offered, not forced. Player agency is respected — but agency comes with responsibility. Script is not accountable for human error.

**No silent failures**
If something breaks, someone must know. Silent failures are the enemy — they hide real problems and erode trust in the system. Every failure surfaces through notification, log, or debug output. Nothing dies quietly.

**Debug before fixing**
Never fix what hasn't been diagnosed. Shortcuts hide the real problem and create new ones. When stuck, trace the flow step by step — hook by hook, line by line, second by second if needed. Slow is fast when it means fixing it once. The debug UI exists because visibility is the first step to any real solution.

**The switch rule**
Every feature that can be toggled must be monitored. Attaching a switch isn't enough — you must know how to flick it, verify it flicked, and detect when someone messes with it. A switch without a monitor is just a future mystery.

**Lesson learned as design**
When something breaks unexpectedly, don't just fix it. Ask why the system allowed it to break silently. Then build so it can't happen again. Every bug is a design conversation. Every lesson earned gets written down.

---

## Design Decisions

**State as a single container**
`state` is the only persistent store across hooks. Everything CSMS owns lives under `state.csmsX` — characters, pending, debug buffer. This keeps state readable, avoids pollution, and makes it easy to audit what we own vs what AID owns. If multiple values belong together, group them in one object rather than spreading across individual keys.

**Canonical references over raw input**
Card operations, character lookups, and comparisons always use the stored canonical value — never the raw player input. Player input is lossy — wrong case, typos, extra spaces. `findCharacter()` resolves case-insensitively, but card title operations require exact match. Always resolve first, operate on the result.

**Story cards as the interface layer**
CSMS exposes its data through story cards — character sheets, config, inventory, debug console. Players adjust their own stats. Scenario creators customize behavior through the config card. World makers set up the adventure without touching the script. Cards are the contract between CSMS internals and everyone outside.

**Native keyword triggers not used**
AID's native keyword system is unreliable for cross-script use and can conflict with existing story cards. All CSMS logic lives in script and state — cards are read explicitly via `storyCards.find()`, never triggered passively by keywords.

**Command parsing reads anywhere in input**
AID prepends `> You` or `> You say, "..."` before player input. Format varies by version and scenario type. Scanning the entire input for `/csms` anywhere is format-agnostic and future-proof. `startsWith` would break silently.

**`##` as instruction signal**
`##` tells the AI this is a direct instruction, not story content. Injected at the end of context so it's the last thing AI reads before generating. Used for all multi-step ordinance and roll flows.

**Multi-step flows via `state.csmsPending`**
Some operations require multiple AI responses — ordinance detection, roll notation, narration. These are tracked as pending states under `state.csmsPending[key]`. Each key maps to one active operation. Steps advance via `pending.step`. Expiry is measured by inactivity — `actionCount` only increments when step hasn't changed. Active progress resets the counter.

**Player agency over automation**
CSMS respects player intent. `/csms roll` exists because players may want to call rolls explicitly. Where automation works cleanly, we automate. Where player choice matters, we surface a command.

**Bracketed output for OOC information**
`[...]` is established AID convention for out-of-character content. AI sees it but doesn't narrate it. Notifications, combat logs, ordinance steps all use this format to stay visible to the player without polluting the narrative.

**Compact narrative sheet format**
Full character sheets in context consume too many tokens. One-line format `[CSMS|Name|HP:x/y|AC:z|...]` gives the AI all mechanical data it needs per character. Readable, minimal, scalable.

**NotifyThem as a standalone system**
Notification logic is independent of CSMS mechanics. Keeping it separate means other scripters can use it without CSMS. Clean separation — CSMS calls notify, never the other way around.

**Position-based character card parsing**
Stat values are read by position, not label. World maker can rename `STR:` to anything — parser doesn't care. Structure is the contract, not the label text. `\S+` captures any value token and lets `safeInt()` validate — silent failures from `\d+` are unacceptable.

**`isMultiplayer()` over raw `info.characters` checks**
`info.characters` is unreliable — it persists after Third-Person is removed, can contain empty strings, and doesn't reflect actual active players. `isMultiplayer()` owns the detection logic in one place. Any future AID changes to multiplayer behavior = one function to update. Everything else just calls `isMultiplayer()`.

**`setCharacterSheet()` as the single card interface**
All character sheet card operations — create, update, delete — go through `setCharacterSheet()`. No scattered `storyCards.push()` or direct field mutations for character sheets anywhere else in the script. AID's card API is unreliable and verbose — one function owns it, everything else calls it.

**`isMultiplayerCharacter` flag**
Without it, `syncMultiplayerCharacters()` would delete NPC sheets when they're not in `info.characters`. Flag ensures only actual multiplayer player sheets get synced against the player list.

**Config parsed every hook**
Plain JS objects reset to script defaults every hook — they don't persist. `parseConfigCard()` runs at the top of every hook to restore world maker settings. Config lives in the card, not the object. The object is just a working copy.

---

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
- Library functions declared in the Library tab show up in `globalThis`

### state — the persistent layer
- `state` persists across all hooks within the same action — input → context → output share the same state
- `state` also persists between actions — it survives from one player action to the next
- Plain JS objects (config objects, constants) do NOT persist — they reset to script defaults every hook
- Anything that needs to survive across hooks or actions must live in `state`
- Always namespace state keys — use descriptive prefixes to avoid conflicts with other scripts

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
  - As of 3rd March 2026 (AID Beta Branch) — character creator also supports `${placeholder}` syntax
  - Classic scenario with PE templates gives more control over the starting state

### Multiplayer Findings (tested Feb 2026)
- `info.characters` is permanent — names never get removed even after player disconnects or closes adventure. "Leaving" is invisible to scripts. Sheet persistence is the correct design — never delete on disconnect
- Players who rename get their sheet renamed automatically — `syncMultiplayerCharacters()` detects seat mismatch and renames character + card
- All players default to name "You" on join — must change manually
- `info.characters` persists even after Third-Person plot component is removed — never trust it alone
- `info.characters.length <= 1` always means solo — true singleplayer, host alone, or Third-Person removed. All treated the same
- True multiplayer = `info.characters.length > 1` AND at least one valid named player with a sheet exists
- Without Third-Person, input always uses `> You` prefix regardless of player name or `info.characters` content
- Third Person plot component switches input format from `> You` to `> Name`
- All players see the same output in real-time
- Host model settings apply to all players
- Name changes mid-session don't sync instantly across all screens — AID UI lag
- Input format in third person: `\n> CharacterName action here`

### AI Instruction Injection (Lessons Learned)
Tested multiple methods for getting AI to produce structured output mid-story:

| Method | Result | Why |
|---|---|---|
| `frontMemory` injection | ⚠️ Context dependent | Works BEFORE player action. Ignored AFTER — AI already committed to narrating |
| `text` manipulation in output hook | ❌ Ignored | Treated as story continuation, not instruction |
| `authorsNote` | ⚠️ Avoid | Overwrites world maker's own notes — reserved for their use |
| Story card entry (keyword match) | ✅ Works | AI treats as established world fact — high priority |
| Context hook `##` instruction at end of text | ✅ Works | AI reads as direct instruction right before generating |

**Key insight:** `##` injected at the END of context works because AI reads sequentially — it sees the instruction right before it generates. Inject early and it gets buried under story text. Inject last and it's the freshest thing in AI memory.

**`frontMemory` nuance:** Works for pre-generation instructions (stat prompts, structured responses) because it fires before the AI generates. Fails when used to influence already-committed narration in output hook.

### info object
- `info.actionCount` — counts total text insertions into the adventure. Every text entered by player, AI, or system = +1. Deleting a text entry = -1. Not a player action counter despite the name — it counts all text entries regardless of source
- `info.actionCount === 0` — reliable indicator that the adventure has just started and no text has been inserted yet. Story opening hasn't fired
- `info.characters` — in third-person multiplayer, returns array of player character names. **Documentation says array of objects `[{ name: "Sam" }]` — THIS IS WRONG. Actual format: `["PlayerOne", "PlayerTwo"]`**
- `info.memoryLength` — length of memory portion of context text (context hook only)
- `info.maxChars` — total allowed context length before truncation (context hook only)

### Hook Execution Order
- Input → Context → Output. Always in this order, every action.
- Functions that depend on parsed data must run AFTER the parser in the same hook
- Reading a story card value in context hook but parsing it in input hook = always stale
- If a value must be available in output hook, either parse it there too or store it in `state` earlier

### Continue vs Retry vs Delete (verified in say/do mode, untested in story mode)
- **Player takes action** — fires Input → Context → Output
- **Player clicks Continue** — skips Input hook. Fires Context → Output only
- **Player deletes last AI output and clicks Continue** — same as Retry. Context → Output only, no Input
- **Player deletes their own input and retypes** — full Input → Context → Output fires again
- Scripts depending on input hook state must account for Continue-only flows where input hook never ran

### text variable
- `text` has no built-in backup — once mutated, original is gone
- Always store a copy before mutating: `const original = text`
- Especially important in output hook where AI narrative lives

### Known Bugs / Limitations
- `stop: true` in input modifier also suppresses player action from displaying
- Script Test panel unreliable — use PLAY + INSPECT workflow instead
- `log()` and LMI expire after a few minutes — not reliable for extended debugging. Use persistent `state` or story cards for long-lived debug output
- `updateWorldEntry` throws error if index doesn't exist (no longer silent)
- Inspect panel (Last AI Call) unreliable — use `log()` to verify frontMemory injection
- Story card writes in output hook don't reflect in UI until next player action
- Workaround: create dummy card in context hook, flush real data in output hook. Card renders correctly same action. Two-step appearance is intentional and communicates progress to world maker
- AI models occasionally output extra text alongside expected keywords — always use regex, never exact match
- AID can stutter and fire the same action twice — scripts must handle duplicate execution gracefully. Guard with `if (!state.x)` before setting state

---

## Compatibility Notes

### Inner Self (LewdLeah)
- IS uses `storyCards` directly — compatible
- IS uses `state` — compatible, use namespaced keys (`state.characters` not `state.char`)
- IS uses `state.memory` — compatible, don't overwrite IS memory fields
- Architecture mirrors IS pattern (`InnerSelf("input")` → `CSMS("input")`)
- IS scans history for character triggers — same approach as our `LOOKBACK_ACTIONS`

### LoLa — Localized Language (LewdLeah)
- **Incompatible** — LoLa overrides AI response language and output format
- CSMS heavily depends on parsing specific AI response patterns — stat blocks, roll notations, ordinance keywords
- Any script that alters AI output format or language will break CSMS parsing
- General rule: **anything that changes what the AI writes is incompatible with CSMS**

### Auto-Cards
- AC generates cards by character name keywords — potential overlap
- Current mitigation: `csms_cs_${name}` prefix on card keys
- Better solution: direct `frontMemory` injection (implemented) makes keyword matching irrelevant
- Tag system works WITH AC — AC generates a card, world maker adds `[CSMS]` tag, CSMS generates sheet

### General Compatibility Rules
- Always namespace state variables: `state.characters`, `state.notifyMessages` etc
- Never use generic keys that other scripts might use
- `📋` emoji prefix on card titles — distinctive enough to avoid conflicts
- Scripts that manipulate `frontMemory` may conflict — CSMS writes to it in context hook for stat generation and roll prompts
- Scripts that manipulate `text` in output hook may conflict — CSMS rewrites text during ordinance and roll resolution

---

## File Structure
```
src/
  library.js        — Main script (NotifyThem + CSMS bundled)
assets/
  Notes.MD          — This file
  Milestones.MD     — Phase tracking
  Changelog.MD      — Version history
  images/
    CSMS_CoverArt.png
README.md           — Public documentation
```
Note: NotifyThem is planned as a standalone release — currently bundled with CSMS in library.js

---

## Command Architecture

```
Player input (any format)
    ↓
Input hook
  ├─ parseConfigCard() — restore config from card
  ├─ state.playerInput = originalText — store for later use
  ├─ getCallerCharacter() — detect who is acting
  ├─ regex scan for /csms anywhere in text
  │     ↓
  │   parseCommand() — extract action and params
  │     ↓
  │   handle[Action]() — execute, notify result
  │     ↓
  │   return — AI never sees the command
  └─ handleActCommand() — detect act_ keywords in input
        ↓
      route to inventory / rest / consume / learn handlers

Context hook
  ├─ parseConfigCard() — restore config
  ├─ initDebugCard() — create/destroy debug card
  ├─ processDebugCommands() — execute debug card commands
  ├─ parseCharacterCard() — sync all character state from cards
  ├─ injectActiveCharacters() — inject narrative sheet into frontMemory
  ├─ syncMultiplayerCharacters() — add/remove players from state
  ├─ processTaggedCards() — detect [CSMS] tags, trigger sheet generation
  └─ injectOrdinanceCheck() — inject ## instructions for active ordinance steps

AI generates narrative

Output hook
  ├─ parseConfigCard() — restore config
  ├─ tickPending() — increment/expire stale pending states
  ├─ generateNarrativeSheet() — detect pending sheet, parse AI stat response
  ├─ rollCheck() — detect pending roll, parse AI stat response, resolve roll
  ├─ processOrdinanceTags() — advance ordinance steps, apply damage
  ├─ awardXPPerAction() — award XP for action taken
  ├─ processLevelUp() — check and apply level ups for all characters
  ├─ autoSpendNPCDP() — auto-allocate DP for NPCs
  ├─ updateCharacterCard() — write all character state back to cards
  ├─ updateNotification() — flush notify queue to text
  ├─ flushDebugLog() — flush debug buffer to debug card
  └─ trimDebugLog() — keep debug card within line limit

Player sees: [CSMS notification] + AI narrative
```

---

## Modules

- **Roll System** — `/csms roll` triggers stat detection and dice resolution. Opposed roll via `/csms roll vs Name` — both sides roll, higher wins, damage applied automatically. XP awarded to winner
- **Sheet Generation** — `[CSMS] Name` tag on story card triggers AI stat generation when name appears in recent history. Two-step render: dummy card shown first action, real stats second action. AID limitation, intentional behavior
- **Ordinance System** — `/csms ordinance/caller/ordinanceName/target(optional)` triggers multi-step AI flow. AI determines DAMAGING or NONDAMAGING, roll or narrative, resolves outcome. Ordinance card entry injected on final narration step — AI reads the actual rules when narrating. DAMAGING type scans narrative for damage words and applies HP automatically
- **Character Sheet** — `/csms create/name` for manual creation. `[CSMS]` tag for AI-driven generation. In multiplayer, player sheet auto-creates when player renames themselves — no command needed. All card operations go through `setCharacterSheet()` — never direct storyCards mutation
- **Inventory** — `act_take`, `act_drop`, `act_give`, `act_hurl` manage items. Items live in character sheet description under `[Inventory]` block. Receiver detection via keyword matching
- **Leveling** — XP awarded passively per action and actively via combat, rolls, ordinances, learning. Level up queued via `pendingLevelUp` flag. DP system lets player allocate stat points freely
- **Consume** — `act_eat`, `act_drink`, `act_consume` etc. Restores `CONSUME_HEAL_PERCENT`% max HP. AI narrates freely
- **Learn** — `act_read`, `act_study`, `act_observe` etc. Awards `XP_PER_LEARN` XP. AI narrates freely
- **Rest** — `act_rest` heals `REST_HEAL_PERCENT`% max HP. Cooldown and deflation parked for future
- **Debug UI** — `🔧 CSMS DEBUG` story card. Logs buffer in state, flush to card every output hook. Commands: `CLEAR_LOG`, `CLEAR:module`, `SET:path=value`


---

### Parked for Later
- Passive Ordinance types — fires automatically when condition is met in AI output
- How a character "learns" or "unlocks" an Ordinance
- Once-per-combat tracking
- Ordinance generator prompt
- Quest system
- Healing Ordinances — detect healing words, ADD hp, cap at max HP
- act_rest cooldown — prevent rest farming
- act_rest deflation — diminishing returns on consecutive rests
- act_rest in combat restriction — optional toggle
- Starting inventory — default items on character creation
- Card types standardization — `Configuration` for CFG, `Character Sheet` for character cards
- XP leveling too fast — world maker balance. Adjust XP_THRESHOLD and individual sources
- AI roll notation bias — injection example may anchor AI toward specific stat. Investigate
- `resolveReceiver()` edge case — when AI narrates "both of your bodies take damage", the word "your" near a damage word triggers caller self-damage incorrectly. Receive word guard helps most cases but this phrasing slips through. Won't fix — player can retry. Only triggers on specific multi-target narrative phrasing. Low priority until someone complains
- Multi-stat roll notation — AI occasionally returns `XdY+STAT+STAT2`. Regex only captures first stat. Either constrain prompt to one stat or expand resolver to handle multiple
- Configurable ordinance step prompts — each `##` injection hardcoded. Different models respond differently. World maker should override via config card
- DEBUG_TIMEZONE_OFFSET config — local timezone for debug timestamps
- NPC brain system — inspired by Inner Self. Key-value store of NPC thoughts, personality, relationships stored in story card. Inject into context hook text invisibly — AI reads it, player never sees it. Could tie into quest system, passive ordinances, NPC behavior over time. IS uses zero-width chars (`\u200B`) as invisible markers — togglable for debug. Worth exploring when AI-reliant modules grow more complex
- Leveling system (v1.10.0) — ✅ implemented
