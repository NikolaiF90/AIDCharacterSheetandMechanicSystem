// ============================================
// CSMS - Character Stats and Mechanics System
// v1.5.0 by PrinceF90
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

  /* COMBAT (only when combat mechanis is true) */
  DAMAGE_DIE: 6,    // low fantasy = d4, high combat = d8
  
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

    let closureText = "";

    // Extract for quick call
    const {caller, action, oppose} = state.csmsRollPending;
    const statMap = {
      "str": "str", "strength": "str",
      "dex": "dex", "dexterity": "dex",
      "con": "con", "constitution": "con",
      "int": "int", "intelligence": "int",
      "wis": "wis", "wisdom": "wis",
      "cha": "cha", "charisma": "cha",
    };

    const statMatches = text.match(/\b(str(?:ength)?|dex(?:terity)?|con(?:stitution)?|int(?:elligence)?|wis(?:dom)?|cha(?:risma)?)\b/gi);

    const callerStat = statMatches?.[0] ? statMap[statMatches[0].toLowerCase()] : null;  // first match
    const opposeStat = statMatches?.[1] ? statMap[statMatches[1].toLowerCase()] : null;  // second match (opposed only)
    
    if (!callerStat)
    {
      // AI didn't respond with a stat — tell player to retry
      notify(
        `Roll failed — AI didn't determine a stat for ${caller}. Clear everything and re-type your input`,
        `roll failed: no stat detected`
      );
      /* Keep this for now. Let player manually delete their last input and re-enter it.
      text = `## A dice roll was requested for "${state.csmsRollPending.action}". Reply with only one word — the most relevant stat: STR, DEX, CON, INT, WIS, or CHA.`;
      // Keep state.csmsRollPending set — don't clear it
      */
      return;
    }

    if (oppose && !opposeStat)
    {
      notify(
        `Roll failed — AI didn't determine a stat for ${oppose}. Clear everything and re-type your input`,
        `roll failed: no stat detected`
      );
      return;
    }

    // Find stat value for caller
    const cCharacter = findCharacter(caller);
    // Roll for caller
    const cResult = resolveRoll(`1d20+${callerStat.toUpperCase()}`, cCharacter, "normal");
    let finalResult = 0;

    if (oppose)
    {
      // VS Character
      const oCharacter = findCharacter(oppose);
      // Roll for oppose
      const oResult = resolveRoll(`1d20+${opposeStat}`, oCharacter, "normal");
      
      // Stop invalid roll
      if (!cResult || !oResult)
      {
        notify("Roll failed — could not resolve dice. Please retry.", "roll failed: resolveRoll returned null");
        text = text || " ";
        return;
      }

      // Compare
      finalResult = cResult.total - oResult.total;
      
      if (cResult.total === oResult.total)
      {
        // Tie
        notify(
          `${caller} initiated a roll: ${cResult.breakDown}`,
          `${caller} roll: ${cResult.breakDown}`);
        notify(
          `${oppose} initiated a roll: ${oResult.breakDown}`,
          `${oppose} roll: ${oResult.breakDown}`);
        notify("Both rolls result a TIE");
        closureText = `${caller} rolled a ${cResult.total} against ${oResult.total} of ${oppose} resulting a TIE.`;
      }
      else if (cResult.total > oResult.total)
      {
        // Caller win
        const damage = resolveDamage(cCharacter, Math.abs(finalResult));
        notify(`
          ${caller}'s Damage Roll: ${damage.breakDown}. ${damage.total} damage point applied to ${oppose}
          `, `Damage roll: ${damage.breakDown}
        `);
        // Apply damage
        const remainingHP = applyDamage(oCharacter, damage.total);       

        // AI doesnt have to know full break down. Just who wins with what points and who left with what points.
        closureText = `${caller} rolled a ${cResult.total} against ${oResult.total} of ${oppose}. ${caller} wins and ${damage.total} damage point applied to ${oppose}. ${oppose} left with ${remainingHP} HP.`;
      }
      else
      {
        // Oppose win
        const damage = resolveDamage(oCharacter, Math.abs(finalResult));
        notify(`
          ${oppose}'s Damage Roll: ${damage.breakDown}. ${damage.total} damage point applied to ${caller}
          `, `Damage roll: ${damage.breakDown}
        `);
        // Apply damage
        const remainingHP = applyDamage(cCharacter, damage.total);

        closureText = `${caller} rolled a ${cResult.total} against ${oResult.total} of ${oppose}. ${oppose} wins and ${damage.total} damage point applied to ${caller}. ${caller} left with ${remainingHP} HP.`;
      }
    }
    else
    {
      notify(
        `${caller} initiated a roll: ${cResult.breakDown}`,
        `roll: ${cResult.breakDown}`
      );
      closureText = `${caller} rolled ${cResult.total} to ${action}.`;
    }

    // Give instructions to player and GM
    text = `## Continue the story. ${caller} attempted to ${action}. ${closureText}`;
    state.csmsRollPending = null;
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
  // COMBAT
  // ==================  
  
  function applyDamage(character, damage)
  {
    const cHP = character.hp.current;
    let fHP = cHP - damage;

    // Set to threshold
    if (fHP <= 0) { fHP = 0 }

    // apply hp
    character.hp.current = fHP;
    notify(
      `${character.name}'s HP: ${cHP} => ${fHP}`,
      `${character.name}'s HP: ${fHP}`
    );
    updateCharacterCard(character);

    // No need to inform of dead. Some doesn't prefer permadeath. HP 0 =/= dead.
    return character.hp.current;
  }

  function resolveDamage(character, bonus)
  {
    const die = rollDice(CSMS_CONFIG.DAMAGE_DIE);
    const total = die + bonus;
    const breakDown = `1d${CSMS_CONFIG.DAMAGE_DIE}+${bonus} = [${die}] + ${bonus} = ${total}`;

    return {total: total, breakDown: breakDown};
  }

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
    if (!state.csmsRollPending) return;
    const { caller, action, oppose } = state.csmsRollPending;
    if (state.csmsRollPending.oppose)
    {
      // VS NPC
      text = text.trimEnd() + `\n---\n\n## Reply with exactly two lines.\nLine 1: most relevant stat for ${caller} to "${action}": STR, DEX, CON, INT, WIS, or CHA.\nLine 2: most relevant stat for ${oppose} to oppose this: STR, DEX, CON, INT, WIS, or CHA. Nothing else.\n`;
    }
    else
    {
      text = text.trimEnd() + `\n---\n\n## Reply with only one word — the most relevant stat for ${caller} to "${action}": STR, DEX, CON, INT, WIS, or CHA. Nothing else.\n`
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
  function handleRoll(caller, action, opponent)
  {
    // Stop incomplete command
    if (!caller || !action) return "Command failed to execute. Incomplete arguments. At least caller and action needed: /csms roll/caller/action/opponent";

    if (!findCharacter(caller)) return `No character sheet found for ${caller}. Create with /csms create/${caller} , then try again`;

    let vs = null;
    if (opponent !== "")
    {
      // Could be npc or object
      if (opponent.charAt(0) === opponent.charAt(0).toUpperCase() && opponent.charAt(0) !== opponent.charAt(0).toLowerCase())
      {
        // Character - then look for CS
        if (!findCharacter(opponent)) return `No character sheet found for ${opponent}. Create with /csms create/${opponent} , then try again`;
        
        vs = opponent;
      }
    }
    state.csmsRollPending = 
    {
      caller: caller,
      action: action,
      oppose: vs,
    };
    
    return null; // Silent for now, Notification comes later
  }

  function parseCommand(cText)
  {
    const parts   = cText.split("/");
    const action  = parts[1]?.toLowerCase().trim();
    const args1   = parts[2]?.trim() || "";
    const args2   = parts[3]?.trim() || "";
    const args3   = parts[4]?.trim() || "";

    switch(action)
    {
      case "create":  return handleCreate(args1);
      case "stats":   return handleStats(args1);
      case "sync":    return handleSync(args1);
      case "reset":   return handleReset(args1);
      case "cleanup": return handleCleanup();
      case "roll":    return handleRoll(args1, args2, args3);
      case "test":    return handleTest();
      default:        return `Unknown CSMS command. Available: /csms create [name], /csms stats [name], /csms sync [name], /csms reset [name], /csms reset, /csms cleanup`;
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
      const result = parseCommand(csmsMatch[0].trim());
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
