# CSMS Milestones

## Phase 1 — Foundation ✅ COMPLETE
*v1.0.0 — February 2026*

- [x] `/csms create [name]` — character creation, first is player, rest are NPCs
- [x] `/csms stats [name]` — refresh story card display
- [x] `/csms reset [name]` / `/csms reset` — remove specific or all characters
- [x] `/csms cleanup` — remove orphaned story cards
- [x] `state.characters[]` — multi-character persistent storage
- [x] Individual story cards per character — `📋 Name`
- [x] `CSMS_CONFIG` and `NOTIFY_CONFIG` — world maker configuration blocks
- [x] Regex command detection anywhere in player input (do/say/normal)
- [x] NotifyThem — bracketed notifications, debug logging, timestamps

---

## Phase 1.5 — Quality of Life ✅ COMPLETE
*v1.2.0 — February 2026*

- [x] `parseCharacterCard()` — editable stats from story card UI, auto-synced every context hook
- [x] `/csms sync [name]` — manual sync story card edits to state
- [x] `injectActiveCharacters()` — compact character data injected into frontMemory
- [x] Multiplayer auto-create — sheets created automatically when players join
- [x] `syncMultiplayerCharacters()` — sheet management for multiplayer sessions
- [x] `BANNED_NAMES`, `LOOKBACK_ACTIONS`, `INJECTED_SHEET_MAX`, `STAT_MIN`, `STAT_MAX` in config

---

## Phase 2 — Tag System ✅ COMPLETE
*v1.3.0 — February 2026*

- [x] `[CSMS] CharacterName` tag on existing story cards triggers AI sheet generation
- [x] Lazy load — only generates when name appears in recent history
- [x] AI reads card entry, determines appropriate stats
- [x] Tag removed from original card after sheet generated
- [x] Dummy card created immediately — prevents ghost button AID rendering quirk
- [x] `AUTO_GENERATION_TAG` in config — world maker configurable

---

## Phase 3 — Dice Engine ✅ COMPLETE
*v1.4.0 — February 2026*

- [x] `resolveRoll(notation, character, mode)` — full roll engine, `XdY+STAT` notation
- [x] Normal / advantage / disadvantage modes
- [x] `rollDice()`, `getModifier()`, `formatMod()`, `statMod()` — modular dice utilities
- [x] `AVERAGE_STAT`, `DEFAULT_STAT`, `DEFAULT_HP`, `DEFAULT_AC`, `DEFAULT_SPEED` in config

---

## Phase 4 — Roll Command ✅ COMPLETE
*v1.4.0 — February 2026*

- [x] `/csms roll [action]` — player-initiated roll with AI stat detection
- [x] `/csms roll vs Name` — opposed roll, both sides roll, higher wins, damage applied automatically
- [x] Two-action flow — stat detection then narrative
- [x] Retry mechanism for failed AI stat detection
- [x] Full/abbreviated stat name matching — `Dexterity`, `DEX`, `dex` all caught

---

## Phase 5 — Inventory Foundation ✅ COMPLETE
*v1.5.2 — February 2026*

- [x] `[Inventory]` and `[Ordinances]` blocks in character sheet Notes field
- [x] `parseInventory()` — reads Notes field, extracts item array
- [x] `/csms update/notes/Name` — syncs both blocks from card to state
- [x] `inventory: []` and `ordinances: []` on all characters

---

## Phase 6 — Ordinance Execution Engine ✅ COMPLETE
*v1.6.0 — v1.8.1 — March 2026*

- [x] Ordinance story cards — natural language rules, world maker written
- [x] `/csms ordinance/caller/name/target` — executes ordinance
- [x] Multi-step AI flow — DAMAGING/NONDAMAGING, roll/narrative, outcome
- [x] Ordinance card entry injected on final narration step — AI follows actual rules
- [x] Damage detection — scans narrative for damage words, applies HP automatically
- [x] Ordinance assignment per character — only listed ordinances can be executed
- [x] Natural command replacement — raw `/csms` replaced with natural prose in story feed
- [x] `resolveReceiver()` — pronoun-resolving damage direction engine
- [x] `CSMS_ORD_TIERS` — configurable damage word tiers

---

## Phase 7 — Configuration Card ✅ COMPLETE
*v1.7.0 — March 2026*

- [x] `⚙️ CSMS CFG` story card — live config panel, no script editing needed
- [x] Auto-created on first action, populated with script defaults
- [x] Auto-repair — missing keys appended automatically on existing adventures
- [x] World maker edits Notes field mid-game, changes take effect next action

---

## Phase 8 — Inventory Command System ✅ COMPLETE
*v1.9.0 — March 2026*

- [x] `act_take`, `act_grab` — pick up items into inventory
- [x] `act_drop`, `act_discard` — remove items from inventory
- [x] `act_give`, `act_hand` — transfer items between characters
- [x] `act_throw`, `act_hurl` — throw items at targets
- [x] Natural failure narration — AI narrates failed attempts if item not in inventory
- [x] Receiver detection — `to Name`, `at Name`, `from Name` parsing

---

## Phase 9 — Debug UI ✅ COMPLETE
*v2.0.0 — March 2026*

- [x] `🔧 CSMS DEBUG` story card — persistent debug log visible in game
- [x] `debugLog()`, `flushDebugLog()`, `trimDebugLog()` — buffer in state, flush to card every action
- [x] Debug card commands — `CLEAR_LOG`, `CLEAR:module`, `SET:path=value`
- [x] `DEBUG_MAX_LINES` config key

---

## Phase 10 — Combat, Progression & Action System ✅ COMPLETE
*v2.0.0 — March 2026*

- [x] Leveling system — XP, level up, HP increase, proficiency scaling
- [x] Development Points (DP) — player allocates stat gains on level up
- [x] NPC auto-leveling — NPCs level up alongside players
- [x] All XP sources individually configurable — set any to 0 to disable
- [x] `act_rest` — rest to recover HP
- [x] `act_eat`, `act_drink`, `act_consume` — consume to restore HP
- [x] `act_read`, `act_study`, `act_observe` — learn to gain XP
- [x] Pending state engine — `setPending()`, `clearPending()`, `tickPending()`, auto-expiry
- [x] `isModuleBusy()` — module collision guard
- [x] `isMultiplayer()` — reliable multiplayer detection
- [x] Multiplayer rename detection — sheet renames automatically, all data preserved
- [x] `setCharacterSheet()` — unified card manager, no scattered storyCards mutations
- [x] `addToText()`, `setText()` — RIM text mutation helpers
