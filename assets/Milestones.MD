# CSMS Milestones

## Phase 1 — Foundation ✅ COMPLETE

### Goals
- Basic character sheet creation and display
- Multi-character support (player + NPCs)
- Command parser
- NotifyThem notification system
- Clean Library architecture

### Completed
- [x] `/csms create [name]` — creates character, first is player, rest are NPCs
- [x] `/csms stats [name]` — refreshes story card display
- [x] `/csms reset [name]` — removes specific character
- [x] `/csms reset` — removes all characters
- [x] `/csms cleanup` — removes orphaned story cards
- [x] `state.characters[]` array — multi-character storage
- [x] Individual story cards per character titled `📋 Name`
- [x] Case-insensitive name handling everywhere
- [x] `storedName` fix — card removal uses actual stored name not typed input
- [x] NotifyThem — bracketed notifications, debug logging, timestamps
- [x] `CSMS_CONFIG` and `NOTIFY_CONFIG` — world maker configuration
- [x] Regex command detection anywhere in player input (do/say/normal)
- [x] Punctuation stripping from command params

### Architecture
- Library tab — all logic (CSMS + NotifyThem)
- Input/Context/Output tabs — single line each calling `CSMS(hook)`
- `state.characters[]` — persistent character storage
- `storyCards[]` — display layer, synced to state

---

## Phase 1.5 — Quality of Life ✅ COMPLETE

### Goals
- Editable stats from story card UI
- Multiplayer compatibility
- `canCastSpell` flag
- Context injection system

### Completed
- [x] `/csms sync [name]` — manual sync story card edits to state
- [x] `parseCharacterCard()` — position-based parser, label-agnostic regex
- [x] `safeInt()` — validation with fallback and error notification
- [x] Auto-sync on every context hook
- [x] `canCastSpell: false` flag — added to `initCharacter()`
- [x] `STAT_MIN` and `STAT_MAX` in `CSMS_CONFIG`
- [x] `BANNED_NAMES` — prevents invalid names like "You", "Adventurer"
- [x] Empty string guard — prevents blank auto-create from empty `info.characters` entries
- [x] `injectActiveCharacters()` — compact sheet injection into frontMemory
- [x] `LOOKBACK_ACTIONS` and `INJECTED_SHEET_MAX` in `CSMS_CONFIG`
- [x] Multiplayer auto-create — sheets created on join via `info.characters`
- [x] `getActivePlayer()` — detects active player from input text in multiplayer
- [x] `isMultiplayerCharacter` flag — protects NPCs from multiplayer sync
- [x] `syncMultiplayerCharacters()` — removes sheets for players who left or renamed
- [x] SC keyword placeholder `csms_cs_${name}` — AC-safe card trigger keys

---

## Phase 2 — Tag System ✅ COMPLETE

### Goals
- `[CSMS] CharacterName` tag on existing story cards
- Lazy load — only generate sheet when name appears in recent history
- AI reads card entry, determines appropriate stats
- Remove tag from original card after sheet generated

### Completed
- [x] `getTaggedCards()` — scans storyCards for AUTO_GENERATION_TAG prefix
- [x] `getTaggedName()` — extracts clean name from tagged card title, strips emoji too
- [x] `isCharacterSheet()` — identifies valid CS cards by emoji OR csms_cs_ key
- [x] `processTaggedCards()` — full detection and branching logic in context hook
- [x] `generateNarrativeSheet()` — output hook intercepts AI stat response
- [x] Three-branch logic — separate CS exists / tagged card IS CS / no CS anywhere
- [x] `state.csmsPending` — single-item queue for AI generation, one character at a time
- [x] Stats stripped from visible output — player never sees raw stat response
- [x] Tag removed from original card after sheet generated
- [x] `AUTO_GENERATION_TAG` in `CSMS_CONFIG` — world maker configurable
- [x] Case-insensitive tag matching

### Known Limitations
- New card requires one extra action to appear in UI — AID rendering quirk, not a bug
- Multiple tagged cards process one per action — intentional, AI generation is sequential

---

## Phase 3 — Roll System 📋 PLANNED

### Goals
- Dice rolling with stat modifiers
- DC checks (success/fail)
- Player explicit roll commands
- AI signals rolls via output tags

### Tasks
- [ ] `/csms roll [dice]` — explicit roll command
- [ ] AI output tag detection `[ROLL:1d20+STR]`
- [ ] Stat modifier calculation and application
- [ ] DC threshold check — script determines success/fail
- [ ] Result injection — script feeds result back, AI narrates
- [ ] Proficiency bonus application

---

## Phase 4 — Combat 📋 PLANNED

### Goals
- Damage application
- HP tracking
- Death/injury states
- AC-based hit detection

### Tasks
- [ ] AI output tag `[DAMAGE:name:amount]`
- [ ] AI output tag `[HEAL:name:amount]`
- [ ] HP update and story card sync
- [ ] Death threshold detection
- [ ] Injury states (narrative flags for AI)
- [ ] AC vs attack roll comparison

---

## Phase 5 — Feats 📋 PLANNED

### Goals
- Natural language feat cards
- AI interprets and executes feats
- Script tracks ownership and cooldowns

### Tasks
- [ ] Feat story card format
- [ ] `/csms feat add [name]` — assign feat to character
- [ ] Feat injection into context when relevant
- [ ] Cooldown tracking in state
- [ ] One-time use feat handling

---

## Backlog / Future Ideas

- NotifyThem as standalone published system
- PE template integration — read player-filled Plot Essentials template, auto-generate sheet
- `/csms setplayer [name]` — reassign who is the player character
- `/csms debug [on/off]` — player toggleable debug mode
- Inventory system
- Status effects / conditions
- XP and leveling system
- Proficiency bonus auto-scaling with level
- Spell slot tracking (if `canCastSpell: true`)
- World maker scenario templates
