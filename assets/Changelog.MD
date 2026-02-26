# Changelog

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
