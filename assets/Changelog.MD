# Changelog

## v2.0.1b — Bug Fix Patch

**Fixed**
- Fixed `addToTextText` typo in Ordinance step 2 DAMAGING — function didn't exist. Replaced with `setText` so the OOC rolling message replaces output cleanly.

**Added**
- End of script marker comment for better readability and easier script merging.

---

## v2.0.0 — Combat, Progression & Action System
*March 2026*

A major milestone. CSMS now has a full progression loop, a complete action system, reliable multiplayer detection, and a proper debug toolchain. Characters grow, heal, learn, and fight with mechanical weight.

### For Players
**Progression**
- Characters now gain XP and level up through play — no manual tracking needed
- XP awarded automatically for actions, rolls, combat, ordinances, learning, and killing blows
- On level up — max HP increases and Development Points (DP) are awarded
- Use `/csms dp/check` to see available DP and current stats
- Use `/csms dp/STR:2,INT:1` to spend DP across stats in one command — you choose how your character grows
- Unspent DP carries over — no pressure to spend immediately
- NPCs level up too — the world grows with you

**Actions**
- `act_rest` — rest to recover HP. Just type it naturally in your input
- `act_eat`, `act_drink`, `act_consume` — consume something to restore HP
- `act_read`, `act_study`, `act_observe` — learn something to gain XP
- All actions are natural — no rigid syntax, just describe what you do

**Combat**
- Opposed rolls now supported — `/csms roll vs Name` rolls both sides, higher wins, damage applied automatically
- Ordinances now follow their written rules — AI narrates based on the actual card entry, not just the name

**Multiplayer**
- Player sheet auto-creates when you rename yourself — no `/csms create` needed
- Renaming mid-session preserves all stats, XP, inventory, ordinances — sheet renames automatically
- Multiplayer detection overhauled — no more false detection when Third-Person is removed

**Commands**
- `/csms reset/pending` — stuck in a broken state? Clear all pending processes instantly
- `/csms reset/character/Name` — remove a specific character sheet

### For World Makers
**New Config Keys**
- `MODULE_LEVELING: true/false` — toggle leveling system
- `LEVEL_CAP` — max level, default 50
- `XP_THRESHOLD` — XP required per level, you set the pace
- `HP_PER_LEVEL` — max HP gained on level up
- `DP_PER_LEVEL` — Development Points awarded per level
- `PROFICIENCY_THRESHOLDS` — comma separated levels where proficiency bonus increases
- `XP_PER_ACTION`, `XP_PER_ORDINANCE`, `XP_PER_HIT`, `XP_PER_KILL`, `XP_PER_ROLL_SUCCESS`, `XP_PER_ROLL_FAIL`, `XP_PER_DAMAGE_RECEIVED` — all XP sources individually configurable. Set any to 0 to disable
- `REST_HEAL_PERCENT` — HP recovered per rest action
- `CONSUME_HEAL_PERCENT` — HP recovered per consume action
- `XP_PER_LEARN` — XP awarded per learn action
- `PENDING_EXPIRY` — actions before stale pending state auto-clears
- `DEBUG_MAX_LINES` — max lines in debug card before trimming
- All new keys auto-added to `⚙️ CSMS CFG` card on first action — existing adventures update automatically

**Debug UI**
- `🔧 CSMS DEBUG` story card — persistent log visible in game. Enable via `DEBUG_MODE: true` in config card
- Debug card commands: `CLEAR_LOG`, `CLEAR:ordinance`, `CLEAR:roll`, `SET:path=value`

### Bug Fixes
- Ordinance AI now reads the actual card entry when narrating — previously improvised from name alone
- Ghost card rendering fixed — no more duplicate "Add character" button after sheet generation
- Multiplayer opening notification spam fixed — no more false "caller not found" on story start
- Pending expiry fixed — multi-step ordinances no longer expire mid-execution
- Second person damage detection fixed — "your" near damage word now correctly targets the caller
- Config values now consistent across all hooks — debug mode and other config no longer reset mid-action

### Technical
- `act_` system — universal narrative action prefix replacing `iv_`. Extensible for future action types
- `setPending()`, `clearPending()`, `tickPending()` — RIM pending state engine with auto-expiry
- `CSMS_PENDING_KEYS` global registry — new modules register here, expiry handling automatic
- `isModuleBusy()` — universal module collision guard
- `setCharacterSheet(name, entry, keys, notes, del)` — unified card manager. All character sheet operations go through one function
- `isMultiplayer()` — reliable multiplayer detection replacing raw `info.characters` check
- `addToText()`, `setText()` — RIM text mutation helpers replacing scattered direct assignments
- `awardXP()`, `processLevelUp()`, `autoSpendNPCDP()` — modular progression functions, callable from custom scripts

---

## v1.9.0 — Inventory Command System
*March 2026*

### For Players
- Inventory management is now natural and seamless — use `iv_` commands directly in your input
- Pick up items: `iv_take knife`, `iv_grab the car keys`, `iv_tuck gun under blazer`
- Drop items: `iv_drop wallet`, `iv_discard the note`
- Give items to characters: `iv_give contract to Barbara`, `iv_hand pen to Borris`
- Throw items: `iv_throw bottle at Borris`, `iv_hurl knife`
- Your character sheet inventory updates automatically — no manual editing needed
- If you don't have the item, AI narrates the failed attempt naturally
- One `iv_` command per input — choose the inventory-relevant action
- One item at a time — use separate commands for multiple items
- Always use character names, not pronouns — `iv_give gun to Borris` not `iv_give gun to him`

### For World Makers
- `CSMS_IV_KEYWORDS` — keyword map for take, drop, give, hurl actions. Add custom keywords as needed
- `handleInventoryCommand()` — main parser, detects action, item, receiver from natural input
- `takeItem()` — adds item to caller inventory, optionally removes from source character
- `dropItem()` — removes item from caller inventory
- `giveItem()` — transfers item between two characters with validation
- `hurlItem()` — removes item from caller, optional target character
- `updateNotesField()` — writes inventory and ordinances back to character sheet Notes field
- `parseInventory()` now called in context hook forEach — state stays synced from card every action
- Auto-repair — missing `[Inventory]` or `[Ordinances]` blocks added automatically to existing sheets
- `originalText` copy pattern in input hook — permanent fix for timing issues across all systems
- `getActivePlayer()` accepts optional `inputText` parameter — prevents timing issues when `text` is replaced before caller detection

---

## v1.8.1 — Patch
*March 2026*

### For Players
- Character sheets now always include `[Inventory]` and `[Ordinances]` sections — even on older sheets
- Ordinance commands with no target no longer produce awkward trailing text

### For World Makers
- Auto-created `[Inventory]` and `[Ordinances]` blocks now include placeholder dash so format is clear
- `naturalizeOrdinanceCommand()` — no-target case fixed, no trailing "against ."

---

## v1.8.0 — Inventory, Ordinance Assignment & Damage Detection Overhaul
*March 2026*

### For Players
- Character sheets now have `[Inventory]` and `[Ordinances]` sections in Notes field
- Ordinances can be assigned per character — only listed Ordinances can be executed
- Executing an unassigned Ordinance fails with a clear message
- Ordinance commands replaced with natural prose in story feed — no more raw `/csms` visible
- Damage detection completely rewritten — pronouns now resolve correctly, no more ghost damage on clean wins

### For World Makers
*March 2026*

### Inventory System
- Fixed `contine` typo in `parseInventory()` — items were never being skipped correctly
- `inventory: []` and `ordinances: []` added to `initCharacter()` — all characters start with empty arrays
- `[Inventory]` and `[Ordinances]` blocks auto-created in Notes field on new character sheet
- Existing cards without Notes field get blocks added automatically on next update
- `/csms update/notes/CharacterName` — replaces old `update/inventory`, syncs both blocks in one command
- `handleUpdateSheetNotes()` — new unified handler for Notes field parsing

### Ordinance Assignment
- `parseOrdinances()` — reads `[Ordinances]` block from character sheet Notes field
- Characters with entries in `[Ordinances]` can only use listed Ordinances
- Characters with empty `[Ordinances]` can use any Ordinance — backwards compatible
- Validation fires in `handleOrdinance()` before execution — hard stop with clear error
- `parseOrdinances()` called fresh inside `handleOrdinance()` — no timing issues

### Natural Command Replacement
- Raw `/csms ordinance/...` command replaced with natural prose in story feed
- `naturalizeOrdinanceCommand()` — generates natural text from command arguments
- Success: `"execute [Ordinance] against [Target]."`
- Failure: `"try to use [Ordinance] against [Target], but failed to do so."`
- `processCommand()` — handles command post-processing in input hook, keeps hook clean
- AI reads natural prose instead of raw command — narrates correctly in both cases

### Damage Detection — Full Rewrite
- `resolveReceiver()` — order-aware, pronoun-resolving damage direction engine
- Checks 25-char window after action word for immediate receiver
- Direct name match → applies damage to that character
- `you/your` → caller takes damage
- `him/her/his/them/their` → pronoun chain resolution
- Chain resolution scans backwards through sentences to find antecedent
- No receiver found → action invalid → no damage, no false positives
- Asymmetric word boundaries — leading `\b` prevents false substring matches, trailing removed for conjugations
- `CSMS_ORD_TIERS` expanded — more action words across all tiers
- Reaction words removed — too ambiguous, replaced with more action words

### Config Card Addition
- `ORD_ND_DAMAGE_DETECTION` now properly toggleable via `⚙️ CSMS CFG` card

---

## v1.7.0 — Phase 7: Configuration Card
*March 2026*

### Config Card System
- `⚙️ CSMS CFG` story card — live configuration panel, no script editing needed
- Auto-created on first action if not present — populated with script defaults
- World maker edits Notes field mid-game → changes take effect next action
- Works in same action as commands — edit CFG and `/csms create` in one go
- `initConfigCard()` — creates card if missing, runs in input and context hooks
- `parseConfigCard()` — reads Notes field, overrides `CSMS_CONFIG` values, runs in input and context hooks
- Input hook ensures config loads before any command executes
- Context hook ensures config stays current every action

### Overridable Values
- Module toggles: `MODULE_CHARACTER_SHEETS`, `MODULE_COMBAT`, `MODULE_ORDINANCE`, `MODULE_INVENTORY`
- Feature toggles: `DEBUG_MODE`, `ORD_ND_DAMAGE_DETECTION`
- Stat settings: `STAT_MAX`, `STAT_MIN`, `AVERAGE_STAT`, `DEFAULT_STAT`, `DEFAULT_HP`, `DEFAULT_AC`, `DEFAULT_SPEED`
- Combat: `DAMAGE_DIE`
- Technical: `LOOKBACK_ACTIONS`, `INJECTED_SHEET_MAX`, `ORD_PROXIMITY`, `ORD_DEFAULT_ROLL`

### Config Addition
- `WEBSITE` — project website URL, used in CFG card entry field

---

## v1.6.0 — Phase 6: Ordinance Execution Engine
*March 2026*

### Ordinance System — Full Rewrite
- Multi-step execution flow replacing single-step approach
- Command updated: `/csms ordinance/CallerName/OrdinanceName/TargetName`
- Target is optional for non-combat Ordinances
- Step 1: AI determines DAMAGING or NONDAMAGING
- Step 2: AI provides roll notation — fallback to `ORD_DEFAULT_ROLL` if none provided
- Step 3 DAMAGING: Narrative damage detection on both caller and target
- Step 3-ND NONDAMAGING: Pure narrative, no damage applied
- Caller and target validation on command entry — loud errors on all failure paths
- Player-friendly "Press Continue" messages between each step

### Damage Detection
- `detectNarrativeDamage()` — scans AI narrative for damage on named characters
- Order-aware detection — "Borris strikes you" vs "you strike Borris" handled correctly
- Whole-word boundary matching — prevents false positives e.g. "sever" vs "severely"
- Explicit number extraction — "10 damage" takes priority over tier detection
- Percentage-based damage from max HP — proportional across all power levels
- First/second person pronoun support — "you", "your", "I", "me", "my" map to caller
- Both directions detected in single pass — caller and target from same narrative

### Damage Tiers — `CSMS_ORD_TIERS`
- Separate constant block outside config — clean separation of data and settings
- Six force-based tiers: glancing → solid → heavy → fierce → brutal → lethal
- Each tier has word list and HP percentage damage range
- World maker can customize word lists without touching script logic
- Highest matching tier wins — lethal checked before glancing

### Config Additions
- `ORD_ERROR` — customizable error message header
- `ORD_PROXIMITY` — word window size for damage detection (default: 50)
- `ORD_DEFAULT_ROLL` — fallback notation when AI doesn't provide one (default: 1d20)
- `ORD_ND_DAMAGE_DETECTION` — toggle damage detection on NONDAMAGING ordinances (default: false)

---

## v1.5.2 — Phase 5 Complete
*March 2026*

### Added (Phase 5 — Ordinance Skeleton)
- `ORDINANCE` module toggle in `CSMS_CONFIG.MODULES`
- `/csms ordinance/OrdinanceName/TargetName` — trigger an Ordinance against a target
- `handleOrdinance(param)` — parses Ordinance name and target from command
- Ordinance card lookup — finds story card by name match
- `##` instruction injection — feeds Ordinance card entry + target context to AI
- Multi-step execution flow — AI judges DAMAGING vs NON-DAMAGING before any roll fires
- `[DAMAGE:XdY+Z]` tag parsing in output hook — script calculates, never AI
- `applyDamage()` — applies resolved damage to target character HP
- Blame policy enforced — valid format executes, wrong numbers are writer's responsibility

### Added (Phase 5 — Inventory MVP)
- Inventory stored in CS card `description` (Notes) field — no character limit, no separate card
- `[Inventory]` block format — dash list, duplicate items as separate entries, optional inline `notes "..."`
- `/csms update/inventory/CharacterName` — syncs inventory from Notes field to `state`
- `/csms update/stats/CharacterName` — renamed from `sheet`, syncs stats from Entry field
- `state.characters[i].inventory[]` — inventory array per character in state
- `parseInventory(card)` — reads Notes field, extracts item array, preserves annotations

### Renamed
- `FEATS` module → `ORDINANCE` in `CSMS_CONFIG.MODULES`
- `/csms update/sheet` → `/csms update/stats` — sheet refers to the card, not a command target

---

## v1.4.0 — Phase 3 & 4 Complete
*February 2026*

### Added (Phase 3 — Dice Engine)
- `rollDice(sides)` — single die roll utility
- `getModifier(score)` — D&D 5e modifier formula, uses `CSMS_CONFIG.AVERAGE_STAT`
- `formatMod(mod)` — signed string formatting (`+2`, `-1`, `+0`)
- `statMod(score)` — convenience wrapper: getModifier + formatMod
- `resolveRoll(notation, character, mode)` — full roll engine
  - Parses `XdY+STAT` notation
  - Supports `normal`, `advantage`, `disadvantage` modes
  - Returns `{ total, rolls, modifier, breakDown }` object
  - Breakdown string format: `1d20+DEX = [14] + DEX(+2) = 16`
- `AVERAGE_STAT: 10` — configurable base for modifier calculation
- `DEFAULT_STAT: 10` — initial stat value on character creation
- `DEFAULT_HP`, `DEFAULT_AC`, `DEFAULT_SPEED` — configurable character defaults

### Added (Phase 4 — Roll Command)
- `/csms roll [action]` command — player-initiated roll
- `handleRoll(param)` — action text extraction with position-independent command parsing
- `state.csmsRollPending` — persists action text across hooks during roll flow
- Context hook stat question injection — prompts AI for single stat word
- `rollCheck()` — stat detection, roll execution, output replacement
  - Full/abbreviated stat name matching (Dexterity, DEX, dex all caught)
  - Roll breakdown notification shown to player
  - `##` instruction injected for AI narrative on Continue
  - Retry prompt if AI fails to return a valid stat
- Multiplayer-compatible action text cleaning — strips `> You` / `> CharacterName` prefixes

### Added (Config)
- `MODULES` block — `CHARACTER_SHEETS`, `COMBAT`, `ORDINANCE`, `INVENTORY` toggles
- `INVENTORY: false` — marked as future, not yet implemented

---

## v1.3.0 — Phase 2 Complete
*February 2026*

### Added
- `isCharacterSheet(card, name)` — identifies valid CS cards by `📋` emoji OR `csms_cs_` key
- `getTaggedCards()` — scans storyCards for `AUTO_GENERATION_TAG` prefix
- `getTaggedName(card)` — extracts clean name from tagged card, strips emoji and tag
- `processTaggedCards()` — full tag detection and branching logic, runs in context hook
- `generateNarrativeSheet()` — output hook intercepts AI stat response, creates sheet silently
- `state.csmsPending` — single-item generation queue, one character at a time
- `AUTO_GENERATION_TAG: "[CSMS]"` — configurable tag in `CSMS_CONFIG`
- Three-branch tag processing — handles separate CS / tagged card is CS / no CS cases
- Stats stripped from visible output after generation — player never sees raw stat string
- Tag removed from original card title after sheet generated

### Fixed
- Empty string guard in multiplayer auto-create — prevents blank sheets from empty `info.characters` entries

---

## v1.2.0 — Phase 1.5 Complete
*February 2026*

### Added
- `parseCharacterCard(character)` — position-based SC parser, label-agnostic regex
- `safeInt()` — value validation with fallback and error notification
- `/csms sync [name]` — manual sync story card edits to state
- Auto-sync on every context hook run
- `injectActiveCharacters()` — compact character data injected into `frontMemory`
- `getActivePlayer()` — detects active player from input text in multiplayer
- `syncMultiplayerCharacters()` — removes sheets for players who left or renamed
- `isMultiplayerCharacter` flag on character objects — protects NPCs from multiplayer sync
- Multiplayer auto-create — sheets created automatically when players join
- `STAT_MIN`, `STAT_MAX` — stat range validation in `CSMS_CONFIG`
- `LOOKBACK_ACTIONS` — history scan depth for character detection in `CSMS_CONFIG`
- `INJECTED_SHEET_MAX` — max sheets injected per action in `CSMS_CONFIG`
- `BANNED_NAMES` — invalid name protection in `CSMS_CONFIG`
- `canCastSpell: false` flag — added to `initCharacter()` for future spell system
- SC keyword placeholder `csms_cs_${name}` — AC-safe card trigger keys

### Fixed
- `handleReset()` now uses `storedName` for card removal — fixes case mismatch bug
- `handleCleanup()` `length` typo fixed

---

## v1.0.0 — Phase 1 Complete
*February 2026*

### Added
- `CSMS()` function with input/context/output hooks
- `/csms create [name]` — character creation
- `/csms stats [name]` — character sheet refresh
- `/csms reset [name]` — remove specific character
- `/csms reset` — remove all characters
- `/csms cleanup` — remove orphaned story cards
- `state.characters[]` — multi-character persistent storage
- `initCharacter()` — D&D 5e stat foundation
- `findCharacter()` — case-insensitive name search
- `getPlayer()` — quick player character access
- `updateCharacterCard(character)` — dynamic story card sync
- `removeCharacterCard(name)` — story card removal
- Individual story cards per character (`📋 Name`)
- Regex-based command detection — works in do/say/normal input
- Punctuation stripping from command parameters
- `storedName` fix — case-safe card removal
- `CSMS_CONFIG` — world maker configuration block

### Added (NotifyThem v1.0.0)
- `initNotify()` — debug mode initialization
- `notify(sMessage, dMessage)` — message storage + debug logging
- `updateNotification()` — flush messages to output as `[bracketed]` block
- `resetNotification()` — clear message queue
- `NOTIFY_CONFIG` — header and debug mode configuration
- Timestamped debug logs via `log()`
