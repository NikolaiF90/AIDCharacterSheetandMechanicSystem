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
- Library functions show up in `globalThis` — confirmed by testing `rollDice`

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
  - Actual format: `["PlayerOne", "PlayerTwo"]`
- `info.characters` can contain empty strings — always guard with `!charName || charName.trim() === ""`
- All players default to name "You" on join — must change manually
- Third Person plot component switches input format from `> You` to `> Name`
- All players see the same output in real-time
- Host model settings apply to all players
- Name changes mid-session don't sync instantly across all screens — AID UI lag
- Input format in third person: `\n> CharacterName action here`

### AI Instruction Injection (Lessons Learned)
Tested multiple methods for getting AI to produce structured output mid-story:

| Method | Result | Why |
|---|---|---|
| `frontMemory` injection | ❌ Ignored | AID positions it AFTER player action — AI already committed to narrating |
| `text` manipulation | ❌ Ignored | Treated as story continuation, not system instruction |
| `authorsNote` | ⚠️ Don't touch | World maker territory — would overwrite their notes |
| Story card entry (keyword match) | ✅ Works | AI treats as established world fact — highest priority |
| Context hook `##` instruction at end of text | ✅ Works | AI reads as direct instruction before generating |

**Key insight:** For roll stat detection, `##` injected at the END of context (after all story text) works because AI reads sequentially — it sees the instruction right before it generates. For tag system stat detection, same principle applies via frontMemory positioned correctly.

### Known Bugs / Limitations
- `stop: true` in input modifier also suppresses player action from displaying
- Script Test panel unreliable — use PLAY + INSPECT workflow instead
- LMI and logs expire after a few minutes — keep second tab open while testing
- `updateWorldEntry` throws error if index doesn't exist (no longer silent)
- Inspect panel (Last AI Call) unreliable — use `log()` to verify frontMemory injection
- New storyCards pushed in output hook don't appear in UI until next player action
- Harbinger model occasionally outputs extra text alongside stat word — stat regex catches it anyway

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

### Why player agency instead of automatic roll detection
Attempted to have AI automatically signal rolls via `[ROLL:XdY+STAT]` tags. Failed — AI ignored all instruction injection methods tested (frontMemory, text manipulation). Player saying `/csms roll` is explicit and reliable. Aligns with TTRPG philosophy: player declares intent to roll, AI determines what stat, script produces the number.

### Why `##` format for roll instructions
`##` signals to the AI that this is a direct instruction (not story content). Injected at end of context so AI reads it immediately before generating. Two-action flow: action 1 gets the stat, action 2 gets the narrative informed by the result.

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
              + stat question injection (if csmsRollPending)
    ↓
AI generates narrative (or stat response if csmsPending/csmsRollPending)
    ↓
Output hook — generateNarrativeSheet() + rollCheck() + updateNotification()
    ↓
Player sees: [CSMS notification] + AI narrative (or ## instruction if roll pending)
```

---

## Roll Flow

```
Player: > You pick the lock /csms roll
  ↓
Input hook — strips /csms roll, stores "pick the lock" in state.csmsRollPending
  ↓
Context hook — detects csmsRollPending
Appends: ## Reply with only one word — the most relevant stat for "pick the lock": STR, DEX, CON, INT, WIS, or CHA.
  ↓
AI responds: "DEX" (or "Dexterity" or similar)
  ↓
Output hook — rollCheck() detects csmsRollPending
Regex matches stat from AI response
resolveRoll("1d20+DEX", player, "normal") → { total: 16, breakDown: "1d20+DEX = [14] + DEX(+2) = 16" }
notify("You initiated a roll: pick the lock\n1d20+DEX = [14] + DEX(+2) = 16")
text = "## Continue the story. The player attempted to pick the lock. Roll result: 16 (1d20+DEX = [14] + DEX(+2) = 16)."
state.csmsRollPending = null
  ↓
Player sees: [!NOTIFICATION!\nYou initiated a roll: pick the lock\n1d20+DEX = [14] + DEX(+2) = 16]
             + ## instruction (not shown directly, feeds next AI turn)
  ↓
Player presses Continue
  ↓
AI reads ## instruction → narrates outcome based on roll result 16
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

## Opposed Roll Design (Planned)

### Why it's needed
Current system is player-centered — only player rolls. Without opposed rolls, NPC attacks have no mechanical weight. HP never updates from NPC actions. A failed dodge roll is just AI vibes, not a real hit.

Opposed roll closes the loop:
- Player rolls DEX (dodge) → 6
- Guard rolls STR (attack) → 15
- Guard wins by 9 → hit confirmed by script, HP updates, AI narrates

### Proposed AI response format
Two separate `##` instructions, each asking for one thing:

```
## Reply with only one word — the most relevant stat for "{action}": STR, DEX, CON, INT, WIS, or CHA.
## If this action is contested by an NPC, reply OPPOSED:NPCName (first name only). If not, reply SOLO.
```

AI responds on two lines:
```
DEX
OPPOSED:Guard
```

### Why two separate blocks instead of pipe format
Pipe format `DEX | true | Guard` is too complex — AI adds narrative, ignores format, hallucinates fields. Proven from tag system experience. Single-concept responses per line are what reliably survives.

### Parsing
```js
const opposedMatch = text.match(/OPPOSED:(\w+)/i);
const isOpposed = !!opposedMatch;
const npcName = opposedMatch ? opposedMatch[1] : null;
// SOLO or anything without OPPOSED: = simple roll, current flow unchanged
```

### Open questions
- What if NPC name has spaces (Guard Captain)? `\w+` breaks — instruction says first name only as mitigation
- After script determines winner — does HP update automatically or just feed result to AI?
- DC checks (fixed threshold) still undesigned — park until after opposed rolls ship

### DC vs AC vs Opposed (quick reference)
| Type | Example | Both sides roll? |
|---|---|---|
| DC check | Pick a lock (DC 15) | ❌ Player rolls vs fixed number |
| AC check | Attack someone | ❌ Attacker rolls vs defender's static AC |
| Opposed roll | Dodge a punch | ✅ Both sides roll, higher wins |

Opposed roll is the priority — it's what makes NPC actions mechanically real.

---

## Ordinance System Design

### What is an Ordinance
Ordinances are NOT god moves. They are injected rules that steer the narrative logically and non-ridiculously. World builders write them as story cards in natural language. Script detects the trigger, feeds the card entry to AI as context, AI interprets the rules, script handles mechanical outcomes.

Think of it as a prompting mechanic system built into CSMS — working WITH the existing dice and combat system to achieve logical outcomes like dealing damage, stealing inventory, or calling reinforcements.

### Philosophy
- Ordinance IS: conditional rule injection that extends existing mechanics
- Ordinance IS NOT: a separate game system, a replacement for dice, a way to bypass narrative logic
- AI interprets the rules. Script executes the numbers. World maker writes the conditions.
- How well AI interprets depends on how well the ordinance is written — that's the writer's responsibility.

### Ordinance Card Format
Free-form natural language. No fixed structure required. Examples:

```
Quick Strike:
The character dashes forward and strikes the target before they can react.
This is a damaging move.
```

```
Tactical Reinforcement:
When engaged in combat, the player may call for reinforcements once per combat.
Allies arriving = XdY + X.
X = 1 (hostile territory), 2 (neutral), 3 (allied territory).
Y = 2 * caller's Wisdom modifier.
Player must belong to a faction.
```

```
Counter Strike:
When the character loses a roll, they may still deal half damage to the opponent.
Damage = half of opponent's damage roll, rounded down.
```

### Command
```
/csms ordinance/OrdinanceName/TargetName
```

### Multi-Step Execution Flow
Ordinance takes multiple actions to execute correctly. This is intentional — executing wrong in 1 action is worse than executing right in 3.

```
/csms ordinance/Quick Strike/Guard
    ↓
Script finds Ordinance card by name
Script injects card entry + target context into ## instruction
    ↓
Action 1: AI judges — DAMAGING or NON-DAMAGING
    ↓
DAMAGING branch:
  Action 2: AI determines relevant stat → script rolls 1d20+STAT
    Roll success → Action 3: AI determines damage formula → [DAMAGE:XdY+Z]
                             Script parses, resolveRoll(), applyDamage()
                             AI narrates successful strike
    Roll fail    → AI narrates failure, no damage applied
    ↓
NON-DAMAGING branch:
  Action 2: AI judges — needs a roll or pure narrative?
    Needs roll   → AI determines stat → script rolls → AI narrates outcome
    Pure narrative → AI narrates Ordinance effect directly
```

### Why Multi-Step
Previous single-step approach caused roll=2 but damage=8 bug. Root cause: roll result and Ordinance execution fired independently. AI had no awareness of roll outcome when deciding damage output.

Fix: roll result must be passed INTO Ordinance execution context. Each step feeds the next. AI never executes damage without knowing if the roll warranted it.

### Blame Policy
- Wrong `[DAMAGE:]` format → script error → our problem
- Valid format, wrong numbers → ordinance writer's problem
- AI misinterprets ordinance entry → writer's problem (write better)
- Script's contract: **valid format = we calculate it. Period.**

---

## Inventory Format

### Item list
```
[Inventory]
- dark blazer
- BMW keys
- note "Meet at X at noon"
- crumpled paper "The bigger is coming"
- glass bottle
- glass bottle
```

### Key rules
- `[Inventory]` block header — script looks for this
- Each `- item` = one array element
- Duplicate items = separate lines. No `x3` stacking.
- Items with inline text use quoted format — `- note "Meet at X at noon"` or `- crumpled paper "The bigger is coming"`. These are **actual items**, not annotations. The quoted text is part of the item name. Script reads the full string as one item. AI reads and understands the content.
- No special annotation syntax — everything is just an item

---

### Parked for Later
- Ordinance assigned to character sheet — CS should list which ordinances each character has access to
- Passive Ordinance types — fires automatically when condition is met in AI output, no command needed
- How a character "learns" or "unlocks" an Ordinance
- Once-per-combat tracking
- Multiple Ordinance rolls in one output — sequential or simultaneous?
- NONDAMAGING per-card damage detection flag — card entry contains `DAMAGE_DETECTION: true` to opt in
- **Config Card System (Phase 7)** — a story card (`📋 CSMS Config`) that acts as a live config panel. Script reads it on every action and overrides `CSMS_CONFIG` values. World makers and players can toggle settings mid-game without touching script code. Example:
```
Title:  📋 CSMS Config
Entry:  ORD_ND_DAMAGE_DETECTION: true
        ORD_PROXIMITY: 60
        DEBUG_MODE: false
```

---


