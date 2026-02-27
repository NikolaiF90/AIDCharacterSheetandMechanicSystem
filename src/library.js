// ============================================
// CSMS - Character Stats and Mechanics System
// v1.4.0 by PrinceF90
// Visit https://github.com/NikolaiF90?tab=repositories
// Include this header if you're using this script in your scenario
// ============================================

// Edit this field as your preference
const CSMS_CONFIG =
{
  // Module toggles
  MODULES:
  {
    CHARACTER_SHEETS: true,   // includes tag system + context injection
    COMBAT: true,             // uses dice internally, needs CHARACTER_SHEETS
    FEATS: false,             // uses dice internally, needs CHARACTER_SHEETS          // Future - not yet implemented
    INVENTORY: false,         // Future - not yet implemented
  },

  /*  STATS */
  STAT_MAX: 50,         // Maximum value for any stats
  STAT_MIN: 1,          // Minimum value for any stats
  AVERAGE_STAT: 10,     // Average character stats
  DEFAULT_STAT: 10,     // Default value assigned to stat without customisation
  DEFAULT_HP: 10,       // Default value assigned to Health Points
  DEFAULT_AC: 10,       // DEfault value assigned to Armor Class
  DEFAULT_SPEED: 30,    // Default value assigned to Speed

  /*  TECHNICAL */
  LOOKBACK_ACTIONS: 5,      // How many actions back to search for characters
  INJECTED_SHEET_MAX: 20,   // Maximum charater sheet should be loaded
  
  /*  TEXT CUSTOMIZATION */
  AUTO_GENERATION_TAG: "[CSMS]",    // System will generate Charater Sheet for cards with this tag
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


function CSMS(hook)
{
  // ==================
  // UTILITIES
  // ==================

  function rollDice(sides)
  {
    return Math.floor(Math.random() * sides) + 1;
  }
  // Calculate the modifier
  function getModifier(score)
  {
    return Math.floor((score - CSMS_CONFIG.AVERAGE_STAT) / 2);
  }
  // give the + sign if modifier more than 0
  function formatMod(mod)
  {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  // calculate stat modifier, and return the result in string
  function statMod(score)
  {
    return formatMod(getModifier(score));
  }

  // ============================================
  // DICE ENGINE — internal infrastructure
  // ============================================


  function resolveRoll(notation, character, mode)
  {
    // Default mode
    mode = mode || "normal";

    // Parse notation - e.g. "1d20+STR", "2d6", "1d8+3"
    const match = notation.match(/^(\d+)d(\d+)(?:\+([a-zA-Z0-9]+))?$/i);
    if (!match) return null;

    const numDice = parseInt(match[1]);
    const dieSides = parseInt(match[2]);
    const modRaw = match [3] || null;  // "STR", "3", null

    // Resolve modifier - check if its a state name or flat number
    let modifierValue = 0;
    let modifierLabel = "";

    if (modRaw)
    {
      if (!isNaN(parseInt(modRaw)))
      {
        // Flat number - "1d8+3"
        modifierValue = parseInt(modRaw);
        modifierLabel = `${modifierValue}`;
      } 
      else if (character)
      {
        // Stat name - "1d20+STR"
        const stat = character.stats[modRaw.toLowerCase()];
        if (stat !== undefined)
        {
          modifierValue = getModifier(stat);
          const formatted = formatMod(modifierValue); 
          modifierLabel = `${modRaw.toUpperCase()}(${formatted})`;
        }
      }
    }

    function doRoll()
    {
      const results = [];
      for (let i = 0; i < numDice; i++)
      {
        /*
        let result = rollDice();
        results.push(result);
        */
        results.push(rollDice(dieSides));
      }
      return results;
    }

    let rolls, rolls2;

    if (mode === "advantage")
    {
      rolls = doRoll();
      rolls2 = doRoll();
      const sum1 = rolls.reduce((a, b) => a+b, 0);
      const sum2 = rolls2.reduce((a, b) => a+b, 0);
      rolls = sum1 >= sum2 ? rolls : rolls2;
    }
    else if (mode === "disadvantage")
    {
      rolls = doRoll();
      rolls2 = doRoll();
      const sum1 = rolls.reduce((a, b) => a+b, 0);
      const sum2 = rolls2.reduce((a, b) => a+b, 0);
      rolls = sum1 <= sum2 ? rolls : rolls2;
    }
    else 
    {
      rolls = doRoll();
    }

    const rollSum = rolls.reduce((a, b) => a+b, 0);
    const total = rollSum + modifierValue;

    const modeLabel = mode !== "normal" ? `(${mode})`: "";
    const modPart = modifierLabel ? ` + ${modifierLabel}` : "";
    const breakDown = `${notation}${modeLabel} = [${rolls.join(", ")}]${modPart} = ${total}`;

    return { rolls, modifier: modifierValue, total, breakDown};
  }

  // check if roll is needed and execute accordingly
  function rollCheck()
  {
    if (!state.csmsRollPending) return;  // not a roll action, exit early

    if (state.csmsRollPending)
    {
      const statMap = {
        "str": "str", "strength": "str",
        "dex": "dex", "dexterity": "dex",
        "con": "con", "constitution": "con",
        "int": "int", "intelligence": "int",
        "wis": "wis", "wisdom": "wis",
        "cha": "cha", "charisma": "cha",
      };

      const statMatch = text.match(/\b(str(?:ength)?|dex(?:terity)?|con(?:stitution)?|int(?:elligence)?|wis(?:dom)?|cha(?:risma)?)\b/i);
      const stat = statMatch ? statMap[statMatch[1].toLowerCase()] : null;

      if (stat)
      {
        const player = getActivePlayer();
        const result = resolveRoll(`1d20+${stat.toUpperCase()}`, player, "normal");

        if (!result)
        {
          notify("Roll failed — could not resolve dice. Please retry.", "roll failed: resolveRoll returned null");
          text = text || " ";
          return;
        }
        
        notify(
          `You initiated a roll: ${state.csmsRollPending}\n${result.breakDown}`,
          `roll: ${state.csmsRollPending} | ${result.breakDown}`
        );

        text = `## Continue the story. The player attempted to ${state.csmsRollPending}. Roll result: ${result.total} (${result.breakDown}).`;
        state.csmsRollPending = null;
      }
      else
      {
        // AI didn't respond with a stat — tell player to retry
        notify(
          "Roll failed — AI didn't determine a stat. Clear everything and re-type your input",
          "roll failed: no stat detected"
        );
        text = `## A dice roll was requested for "${state.csmsRollPending}". Reply with only one word — the most relevant stat: STR, DEX, CON, INT, WIS, or CHA.`;
        // Keep state.csmsRollPending set — don't clear it
      }
    }
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
      if (!charName || charName.trim() === "") return;
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
      hp: { current: CSMS_CONFIG.DEFAULT_HP, max: CSMS_CONFIG.DEFAULT_HP },
      ac: CSMS_CONFIG.DEFAULT_AC,
      speed: CSMS_CONFIG.DEFAULT_SPEED,
      proficiencyBonus: 2,
      canCastSpell: false,
      stats: {
        str: CSMS_CONFIG.DEFAULT_STAT,
        dex: CSMS_CONFIG.DEFAULT_STAT,
        con: CSMS_CONFIG.DEFAULT_STAT,
        int: CSMS_CONFIG.DEFAULT_STAT,
        wis: CSMS_CONFIG.DEFAULT_STAT,
        cha: CSMS_CONFIG.DEFAULT_STAT  
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

  // Detect if its valid CS card
  function isCharacterSheet(card, name)
  {
    const hasEmoji = card.title === `📋 ${name}`;
    const hasKey = card.keys.indexOf(`csms_cs_${name.toLowerCase()}`) !== -1;
    return hasEmoji || hasKey;
  }

  // Scan for card with `generation tag`
  function getTaggedCards()
  {
    return storyCards.filter(card =>
      card.title.toLowerCase().startsWith(CSMS_CONFIG.AUTO_GENERATION_TAG.toLowerCase())
    );
  }

  // Get the name of the card with `generation tag` and remove the tag
  function getTaggedName(card)
  {
    const tag = CSMS_CONFIG.AUTO_GENERATION_TAG.toLowerCase();
    const stripped = card.title.toLowerCase().startsWith(tag)
      ? card.title.slice(tag.length).trim()
      : card.title.trim();
    
    // Strip emoji prefix if world maker included it
    return stripped.replace(/^📋\s*/,"").trim();
  }

  // Generate CS for tagged cards
  function processTaggedCards()
  { 
    const taggedCards = getTaggedCards();
        
    taggedCards.forEach(card =>
    {
      const name = getTaggedName(card);
      if (!name) return;

      // Check if name appears in recent history
      const recentHistory = history.slice(-CSMS_CONFIG.LOOKBACK_ACTIONS);
      const recentText = recentHistory.map(h => h.text || "").join(" ").toLowerCase();
      if (recentText.indexOf(name.toLowerCase()) === -1) return;

      // Search for a SEPARATE existing CS card
      const existingCS = storyCards.find(c => c !== card && isCharacterSheet(c, name));

      if (existingCS)
      {
        // Separate CS exists — sync it, remove tag from this card
        const character = findCharacter(name);
        if (character) parseCharacterCard(character);
        card.title = name;
      }
      else if (isCharacterSheet(card, name))
      {
        // Tagged card IS the CS — parse it directly, remove tag
        const character = findCharacter(name);
        if (character)
        {
          parseCharacterCard(character);
          card.title = `📋 ${name}`;  // rename properly
        }
      }
      else
      {
        // No CS anywhere — trigger AI generation
        if (!state.csmsPending)
        {
          state.csmsPending = name;
          state.memory.frontMemory = `[Do not continue the story. Instead, based on the story card entry for "${name}", respond ONLY with this exact format and nothing else: STR:x DEX:x CON:x INT:x WIS:x CHA:x HP:x AC:x]`;
        }
      }
    });
  }

  // Create CS based on AI output
  function generateNarrativeSheet()
  {
    if (state.csmsPending)
    {
      const name = state.csmsPending;
      
      // Try to parse stats from AI response
      const strMatch = text.match(/STR:\s*(\d+)/i);
      const dexMatch = text.match(/DEX:\s*(\d+)/i);
      const conMatch = text.match(/CON:\s*(\d+)/i);
      const intMatch = text.match(/INT:\s*(\d+)/i);
      const wisMatch = text.match(/WIS:\s*(\d+)/i);
      const chaMatch = text.match(/CHA:\s*(\d+)/i);
      const hpMatch  = text.match(/HP:\s*(\d+)/i);
      const acMatch  = text.match(/AC:\s*(\d+)/i);

      if (strMatch && dexMatch && conMatch && intMatch && wisMatch && chaMatch && hpMatch && acMatch)
      {
        // Create character
        const isPlayer = state.characters.length === 0;
        const character = initCharacter(name, isPlayer);
        character.stats.str = parseInt(strMatch[1]);
        character.stats.dex = parseInt(dexMatch[1]);
        character.stats.con = parseInt(conMatch[1]);
        character.stats.int = parseInt(intMatch[1]);
        character.stats.wis = parseInt(wisMatch[1]);
        character.stats.cha = parseInt(chaMatch[1]);
        character.hp.current = parseInt(hpMatch[1]);
        character.hp.max = parseInt(hpMatch[1]);
        character.ac = parseInt(acMatch[1]);

        state.characters.push(character);
        updateCharacterCard(character);

        // Remove tag from original card
        const taggedCard = storyCards.find(c =>
          c.title.toLowerCase() === `${CSMS_CONFIG.AUTO_GENERATION_TAG.toLowerCase()} ${name.toLowerCase()}`
        );
        if (taggedCard) taggedCard.title = name;

        // Clear pending and strip stats from output
        state.csmsPending = null;
        text = text.replace(/STR:\s*\d+\s*DEX:\s*\d+\s*CON:\s*\d+\s*INT:\s*\d+\s*WIS:\s*\d+\s*CHA:\s*\d+\s*HP:\s*\d+\s*AC:\s*\d+/i, "").trim();

        notify(`Character sheet generated for ${name}!`, `generated: ${name}`);
      }
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

  function injectStatCheck()
  {
    // Roll pending — ask AI what stat applies
    if (state.csmsRollPending)
    {
      text = text.trimEnd() + `\n---\n\n## Reply with only one word — the most relevant stat for "${state.csmsRollPending}": STR, DEX, CON, INT, WIS, or CHA. Nothing else.\n`;
    }
  };

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

  // Dice engine
  // Sign action as roll
  function handleRoll(param)
  {
    const action = param.trim();

    if (!action || action === "")
    {
      return "No action provided. Usage: /csms roll [action] or [action] /csms roll";
    }

    state.csmsRollPending = action
      .replace(/^>?\s*\w+\s+/i, "")   // strip "> You" or "> Nikolai" — any first word
      .replace(/[^a-zA-Z0-9\s]/g, "") // strip punctuation
      .trim();

    return null; // silent for now, notification comes after AI responds
  }

  function parseCommand(cText, fullAction)
  {
    const parts = cText.split(" ");
    const action = parts[1]?.toLowerCase();
    const param = parts.slice(2).join(" ").replace(/[^a-zA-Z0-9\s]/g, "").trim();

    switch(action)
    {
      case "create": return handleCreate(param);
      case "stats":  return handleStats(param);
      case "sync": return handleSync(param);
      case "reset":  return handleReset(param);
      case "cleanup": return handleCleanup();
      case "roll": return handleRoll(fullAction || param);
      case "test": return handleTest();
      default:       return `Unknown CSMS command. Available: /csms create [name], /csms stats [name], /csms sync [name], /csms reset [name], /csms reset, /csms cleanup`;
    }
  }

  function handleTest()
  {
    const char = findCharacter("Nikolai");
    log(JSON.stringify(resolveRoll("1d20+STR", char, "normal")));
    log(JSON.stringify(resolveRoll("2d6", char, "advantage")));
    log(JSON.stringify(resolveRoll("1d8+3", char, "normal")));
  }

  // ==================
  // HOOKS
  // ==================

  if (hook === "input")
  {
    // Zeor or one command, no more
    const csmsMatch = text.match(/\/csms\s+\w+(\s+\S+)*/i);

    if (csmsMatch)
    {
      const action = text.replace(/\/csms\s+\w+/i, "").trim(); // everything except command
      const result = parseCommand(csmsMatch[0].trim(), action);
      if (result) notify(result, result);
    }
  }

  if (hook === "context")
  {
    state.characters.forEach(c =>
    {
      parseCharacterCard(c);
    });
    
    injectActiveCharacters();
    syncMultiplayerCharacters();
    processTaggedCards();

    if (CSMS_CONFIG.MODULES.COMBAT) injectStatCheck();
  }

  if (hook === "output")
  {
    generateNarrativeSheet();
    if (CSMS_CONFIG.MODULES.COMBAT) rollCheck();
    updateNotification();

    text = text || " ";
  }

}
