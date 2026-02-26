// Edit this field as your preference
const CSMS_CONFIG =
{
  STAT_MAX: 50,   // Maximum value for any stats
  STAT_MIN: 1,    // Minimum value for any stats
  LOOKBACK_ACTIONS: 5,    // How many actions back to search for characters
  INJECTED_SHEET_MAX: 20,   // Maximum charater sheet should be loaded
  TEMP_TRIGGER: "github.com/NikolaiF90/AIDCharacterSheetandMechanicSystem",
  BANNED_NAMES: ["you", "adventurer"],
}

// ============================================
// NotifyThem - An AID dynamic notification and logging system made by programmer for programmer
// v1.0.0 by PrinceF90
//
// How to use:
// Put initNotify() in your Library initiliazation
// Put updateNotification() in your Output script
// Use notify(STRING, STRING) to add your message 
// Visit https://github.com/NikolaiF90?tab=repositories
// Include this header if you're using this script in your scenario
// ============================================

const NOTIFY_CONFIG = 
{
  NOTIFICATION_HEADER: "!NOTIFICATION!",   // Header message
  DEBUG_MODE: true,   // For developer only
}

function initNotify ()
{
  if (state.notifyDebugMode === undefined) { state.notifyDebugMode = NOTIFY_CONFIG.DEBUG_MODE }
}

function notify(sMessage, dMessage = "")
{
  if (!state.notifyMessages) { state.notifyMessages = [NOTIFY_CONFIG.NOTIFICATION_HEADER] }
  // store messages for later output
  state.notifyMessages.push(sMessage);

  let debugMessage;
  // Debug messages will always shown real-time
  if (state.notifyDebugMode && dMessage !== "")
  {
    const time = new Date();
    const timeStamp = `${time.getDate()}/${time.getMonth() +1}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}`;
    
    debugMessage = `[${timeStamp}]NOTIFY DEBUG LOG: ${dMessage}`
    log(debugMessage);
  }
}

// Update the whole notification and feed it into the game
// Recommended to use only once, on the output script
function updateNotification()
{
  if (state.notifyMessages && state.notifyMessages.length > 1) 
    {
      const notiMessage = `[${state.notifyMessages.join("\n")}]`;
      text = `${notiMessage}\n\n${text}`;
      resetNotification();
    }
}

function resetNotification()
{
  if (state.notifyMessages) {state.notifyMessages = [NOTIFY_CONFIG.NOTIFICATION_HEADER]}
}

// ============================================
// End of script
// ============================================

// ============================================
// CSMS - Character Stats and Mechanics System
// v1.2.0 by PrinceF90
// Visit https://github.com/NikolaiF90?tab=repositories
// Include this header if you're using this script in your scenario
// ============================================


function CSMS(hook)
{
  // ==================
  // UTILITIES
  // ==================

  function rollDice(sides)
  {
    return Math.floor(Math.random() * sides) + 1;
  }

  function getModifier(score)
  {
    return Math.floor((score - 10) / 2);
  }

  function formatMod(mod)
  {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  function statMod(score)
  {
    return formatMod(getModifier(score));
  }

  // ==================
  // INITIALIZATION
  // ==================
  initNotify();

  if (state.characters === undefined)
  {
    state.characters = [];
  }

  // Create CS for new player
  if (info.characters && info.characters.length > 0)
  {
    info.characters.forEach(charName =>
    {
      // Skip banned names
      if (CSMS_CONFIG.BANNED_NAMES.indexOf(charName.toLowerCase()) !== -1) return;

      // Skip if already exists
      if (findCharacter(charName)) return;

      // First character created is the player
      const isFirstPlayer = state.characters.length === 0;
      const character = initCharacter(charName, isFirstPlayer, true);
      state.characters.push(character);
      updateCharacterCard(character);
      notify(`Character sheet auto-created for ${charName}`, `auto-created: ${charName}`);
    });
  }

  // Always check for ghost
  syncMultiplayerCharacters();

  // ==================
  // CHARACTER
  // ==================

  function initCharacter(cName, cIsPlayer = false, cIsMultiplayer = false)
  {
    return {
      name: cName,
      isPlayer: cIsPlayer,
      isMultiplayerCharacter: cIsMultiplayer,
      level: 1,
      xp: 1,
      hp: { current: 10, max: 10 },
      ac: 10,
      speed: 30,
      proficiencyBonus: 2,
      canCastSpell: false,
      stats: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
      }
    };
  }

  // Find any character from global namespace by name
  function findCharacter(name)
  {
    return state.characters.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Find and return player from list of characters in global namespace
  function getPlayer()
  {
    return state.characters.find(c => c.isPlayer === true);
  }

  // Find player that execute the action
  function getActivePlayer()
  {
    // Singleplayer — just return the player
    if (!info.characters || info.characters.length === 0)
    {
      return getPlayer();
    }

    // Multiplayer — detect from input text
    const inputText = text.trim();
    for (const charName of info.characters)
    {
      if (inputText.indexOf(`> ${charName}`) !== -1)
      {
        return findCharacter(charName);
      }
    }

    // Fallback
    return getPlayer();
  }

  // Remove ghost data and CS
  function syncMultiplayerCharacters()
  {
    if (!info.characters || info.characters.length === 0) return;

    // Find state characters that are multiplayer but no longer in info.characters
    const toRemove = state.characters.filter(c =>
      c.isMultiplayerCharacter === true &&
      info.characters.indexOf(c.name) === -1
    );

    toRemove.forEach(c =>
    {
      const index = state.characters.indexOf(c);
      state.characters.splice(index, 1);
      removeCharacterCard(c.name);
      notify(`Character sheet removed for ${c.name} (left or renamed).`, `removed: ${c.name}`);
    });
  }

  // ==================
  // STORY CARD
  // ==================

  // Update character state data by value from CS
  function parseCharacterCard(character)
  {
    const c = character;
    const card = storyCards.find(card => card.title === `📋 ${c.name}`);
    if (!card) return;

    // seperate by lines
    const lines = card.entry.split("\n");
    // container for invalid value
    const errors = [];

    // Helper - validate and fallback
    function safeInt(value, fallback, label)
    {
      const parsed = parseInt(value);
      
      if (isNaN(parsed))
      {
        errors.push(`${label}: "${value}" is not a number. Kept ${fallback}.`);
        return fallback;
      }

      if (parsed < CSMS_CONFIG.STAT_MIN || parsed > CSMS_CONFIG.STAT_MAX)
      {
        errors.push(`${label}: ${parsed} out of range (${CSMS_CONFIG.STAT_MIN}-${CSMS_CONFIG.STAT_MAX}). Kept ${fallback}.`);
        return fallback;
      }
      
      return parsed;
    }

    // Line 1 - Name: PrinceF90 | Level: 0 | XP: 0
    const line1 = lines[0]?.match(/\w+:\s*(.+?)\s*\|\s*\w+:\s*(\S+)\s*\|\s*\w+:\s*(\S+)/i);
    if (line1)
    {
      c.name = line1[1].trim() || c.name;
      c.level = safeInt(line1[2], c.level, "Level");
      c.xp = safeInt(line1[3], c.xp, "XP");
    }

    // Line 2 - HP: 10/10 | AC: 10 | Speed: 30ft
    const line2 = lines[1]?.match(/\w+:\s*(\S+)\/(\S+)\s*\|\s*\w+:\s*(\S+)\s*\|\s*\w+:\s*(\S+)/i);
    if (line2 && c.hp)
    {
      c.hp.current = safeInt(line2[1], c.hp.current, "HP Current");
      c.hp.max = safeInt(line2[2], c.hp.max, "HP Max");
      c.ac = safeInt(line2[3], c.ac, "AC");
      c.speed = safeInt(line2[4], c.speed, "Speed");
    }

    // Line 3 - Proficiency: +2
    const line3 = lines[2]?.match(/\w+:\s*(\S+)/i);
    if (line3)
    {
      c.proficiencyBonus = safeInt(line3[1], c.proficiencyBonus, "Proficiency");
    }

    // Line 5 — str: 10 (+0)  dex: 10 (+0)  con: 10 (+0)
    const line5 = lines[4]?.match(/\w+:\s*(\S+)\s*\(.*?\)\s*\w+:\s*(\S+)\s*\(.*?\)\s*\w+:\s*(\S+)/i);
    if (line5)
    {
      c.stats.str = safeInt(line5[1], c.stats.str, "STR");
      c.stats.dex = safeInt(line5[2], c.stats.dex, "DEX");
      c.stats.con = safeInt(line5[3], c.stats.con, "CON");
    }

    // Line 6 — int: 10 (+0)  wis: 10 (+0)  cha: 10 (+0)
    const line6 = lines[5]?.match(/\w+:\s*(\S+)\s*\(.*?\)\s*\w+:\s*(\S+)\s*\(.*?\)\s*\w+:\s*(\S+)/i);
    if (line6)
    {
      c.stats.int = safeInt(line6[1], c.stats.int, "INT");
      c.stats.wis = safeInt(line6[2], c.stats.wis, "WIS");
      c.stats.cha = safeInt(line6[3], c.stats.cha, "CHA");
    }

    // Notify of any errors
    if (errors.length > 0)
    {
      notify(`Card sync errors for ${c.name}:\n- ${errors.join("\n- ")}`, `sync errors: ${errors.join(" | ")}`);
    }

    updateCharacterCard(c);
  }

  function updateCharacterCard(character)
  {
    const c = character;
    if (!c) return;

    const cEntry = [
      `Name: ${c.name} | Level: ${c.level} | XP: ${c.xp}`,
      `HP: ${c.hp.current}/${c.hp.max} | AC: ${c.ac} | Speed: ${c.speed}ft`,
      `Proficiency: ${formatMod(c.proficiencyBonus)}`,
      ``,
      `STR: ${c.stats.str} (${statMod(c.stats.str)})  DEX: ${c.stats.dex} (${statMod(c.stats.dex)})  CON: ${c.stats.con} (${statMod(c.stats.con)})`,
      `INT: ${c.stats.int} (${statMod(c.stats.int)})  WIS: ${c.stats.wis} (${statMod(c.stats.wis)})  CHA: ${c.stats.cha} (${statMod(c.stats.cha)})`,
    ].join("\n");

    const cardTitle = `📋 ${c.name}`;

    const existing = storyCards.find(card => card.title === cardTitle);
    if (existing)
    {
      existing.entry = cEntry;
    }
    else
    {
      storyCards.push({
        title: cardTitle,
        keys: `csms_cs_${c.name}, ${CSMS_CONFIG.TEMP_TRIGGER}`,
        entry: cEntry,
        description: `CSMS Character Sheet - ${c.name}`
      });
    }
  }

  function removeCharacterCard(name)
  {
    const cardTitle = `📋 ${name}`;
    const existing = storyCards.find(card => card.title === cardTitle);
    if (existing)
    {
      storyCards.splice(storyCards.indexOf(existing), 1);
    }
  }

  function injectActiveCharacters()
  {
    const recentHistory = history.slice(-CSMS_CONFIG.LOOKBACK_ACTIONS);
    const recentText = recentHistory.map(m => m.text || "").join(" ").toLowerCase();

    const player = getPlayer();
    const mentioned = state.characters.filter(c => 
      c !== player && recentText.includes(c.name.toLowerCase())
    );

    const toInject = [player, ...mentioned]
      .filter(Boolean)
      .slice(0, CSMS_CONFIG.INJECTED_SHEET_MAX);

    const injected = toInject.map(c => 
      `[CSMS|${c.name}|HP:${c.hp.current}/${c.hp.max}|AC:${c.ac}|STR:${c.stats.str}|DEX:${c.stats.dex}|CON:${c.stats.con}|INT:${c.stats.int}|WIS:${c.stats.wis}|CHA:${c.stats.cha}]`
    ).join("\n");
    
    if (injected)
    {
      state.memory.frontMemory = injected;
    }
  }

  // ==================
  // COMMANDS
  // ==================

  function handleCreate(param)
  {
    const name = param || "Adventurer";

    // Name is important
    if (CSMS_CONFIG.BANNED_NAMES.indexOf(name.toLowerCase()) !== -1)
    {
      return `"${name}" is not a valid character name. Please choose a different name.`;
    }

    // We don't want doppleganger
    if (findCharacter(name))
    {
      return `${name} already exists! Use /csms reset ${name} to start over.`;
    }

    // Decide if its player character
    const isPlayer = state.characters.length === 0;
    const character = initCharacter(name, isPlayer);
    state.characters.push(character);
    updateCharacterCard(character);

    const role = isPlayer ? "player character" : "NPC";
    return `A new character sheet has been created for the ${role}, ${name}.`;
  }

  function handleStats(param)
  {
    const name = param;
    let character;

    if (name)
    {
      character = findCharacter(name);
      if (!character)
      {
        return `No character named ${name} found.`;
      }
    }
    else
    {
      character = getActivePlayer();
      if (!character)
      {
        return `No player character found. Use /csms create [name] first.`;
      }
    }

    updateCharacterCard(character);
    return `${character.name} checks their status.`;
  }

  // Manually sync CS to character state data by name
  function handleSync(param)
  {
    const name = param;
    let c;

    if (name)
    {
      c = findCharacter(name);
      if (!c)
      {
        return `No character named ${name} found.`;
      }
    } else
    {
      c = getActivePlayer();
      if (!c)
      {
        return `No player character found.`;
      }
    }

    parseCharacterCard(c);
    return `${c.name}'s character sheet has been synced.`;
  }

  function handleReset(param)
  {
    const name = param;

    if (name)
    {
      // Reset specific character
      const index = state.characters.findIndex(
        c => c.name.toLowerCase() === name.toLowerCase()
      );
      if (index === -1)
      {
        return `No character named ${name} found.`;
      }

      const storedName = state.characters[index].name;
      state.characters.splice(index, 1);
      removeCharacterCard(storedName);
      return `${storedName}'s character sheet has been removed.`;
    }
    else
    {
      // Reset ALL characters
      state.characters = [];
      const toRemove = storyCards.filter(card => card.title.startsWith("📋"));

      toRemove.forEach(card =>
      {
        storyCards.splice(storyCards.indexOf(card), 1);
      });
      return `All character sheets have been reset.`;
    }
  }

  function handleCleanup()
  {
    // Find all 📋 cards that don't have matching character in state
    const orphaned = storyCards.filter(card =>
    {
      if (!card.title.startsWith("📋")) return false;
      const cardName = card.title.replace("📋 ", "");
      return !findCharacter(cardName);
    });

    if (orphaned.length === 0)
    {
      return `No orphaned character sheet found.`;
    }

    orphaned.forEach(card => 
    {
      storyCards.splice(storyCards.indexOf(card), 1);
    });

    return `Cleaned up ${orphaned.length} orphaned character sheet(s).`;
  }

  function parseCommand(cText)
  {
    const parts = cText.split(" ");
    const action = parts[1]?.toLowerCase();
    const param = parts.slice(2).join(" ").replace(/[^a-zA-Z0-9\s]/g, "").trim();

    const tempMessage = `Player executed command ${action}`
    notify(tempMessage, tempMessage);

    switch(action)
    {
      case "create": return handleCreate(param);
      case "stats":  return handleStats(param);
      case "sync": return handleSync(param);
      case "reset":  return handleReset(param);
      case "cleanup": return handleCleanup();
      default:       return `Unknown CSMS command. Available: /csms create [name], /csms stats [name], /csms sync [name], /csms reset [name], /csms reset, /csms cleanup`;
    }
  }

  // ==================
  // HOOKS
  // ==================

  if (hook === "input")
  {
    const csmsMatch = text.match(/\/csms\s+\w+(\s+\S+)*/i);

    if (csmsMatch)
    {
      const result = parseCommand(csmsMatch[0].trim());
      notify(result, result);
    }
  }

  if (hook === "context")
  {
    state.characters.forEach(c =>
    {
      parseCharacterCard(c);
    });
    
    injectActiveCharacters();
  }

  if (hook === "output")
  {
    updateNotification();
  }

}
