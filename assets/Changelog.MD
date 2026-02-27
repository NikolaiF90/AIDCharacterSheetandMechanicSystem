# Changelog

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
- `MODULES` block — `CHARACTER_SHEETS`, `COMBAT`, `FEATS`, `INVENTORY` toggles
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
