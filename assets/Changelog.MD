# Changelog

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
