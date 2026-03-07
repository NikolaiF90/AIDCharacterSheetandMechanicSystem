// ============================================
// CSMS - Character Stats and Mechanics System
// v1.10.0 by PrinceF90
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
    ORDINANCE:true,           // uses dice internally, needs 
    INVENTORY: true,          // Natural language inventory management
    LEVELING: true,           // XP, level up, upgrade points, proficiency scaling
  },

  /* LEVELING */
  LEVEL_CAP:    50,     // Maximum level a character can reach
  XP_THRESHOLD: 30,    // Flat XP required to level up
  HP_PER_LEVEL: 10,     // Max HP gained per level up
  DP_PER_LEVEL: 3,      // Development Points awarded on level up

  // XP Sources - Set 0 to disable
  XP_PER_ACTION: 1,           // Every action taken
  XP_PER_ORDINANCE: 5,        // Every Ordinance execution
  XP_PER_HIT: 3,              // When inflicting damage
  XP_PER_DAMAGE_RECEIVED: 2,  // When taking damage 
  XP_PER_KILL: 10,            // When making a killing blow
  XP_PER_ROLL_SUCCESS: 3,     // On successful dice roll
  XP_PER_ROLL_FAIL: 1,        // On failed dice roll

  // Proficiency +1 at each of these levels
  PROFICIENCY_THRESHOLDS:  [2, 8, 12, 16, 20, 28, 36, 44, 50],

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

  /* ORDINANCE */
  ORD_ERROR: "⚠ ORDINANCE ERROR\n",    // Header for Ordinance error message
  ORD_PROXIMITY: 50,                    // Word window for narraive damage detection
  ORD_DEFAULT_ROLL: "1d20",             // fallback when AI doesn't provide notation
  ORD_ND_DAMAGE_DETECTION: false,       // Auto-detect damage on non damaging ordinance(failed execution)
  
  /*  TEXT CUSTOMIZATION */
  // Official CSMS Website
  WEBSITE: "https://nikolaif90.github.io/AIDCharacterSheetandMechanicSystem/",
  AUTO_GENERATION_TAG: "[CSMS]",    // System will generate Charater Sheet for cards with this tag
  TEMP_TRIGGER: "github.com/NikolaiF90/AIDCharacterSheetandMechanicSystem",
  BANNED_NAMES: ["you", "adventurer"],
}

const NOTIFY_CONFIG = 
{
  NOTIFICATION_HEADER: "!NOTIFICATION!",   // Header message
  DEBUG_MODE: true,   // For developer only
}

// ============================================
// ORDINANCE DAMAGE TIERS
// Word lists for narrative damage detection
// Highest matching tier wins
// ============================================

const CSMS_ORD_TIERS =
{
  glancing:  
  {
    range: [0.02, 0.06],
    words: ["graze", "brush", "clip", "nick", "scratch", "tap", "flick", "skim", "catch", "nudge", "bump", "touch"]
  },
  solid:     
  {
    range: [0.06, 0.14],
    words: ["hit", "strike", "cut", "slash", "jab", "smack", "crack", "connect", "land", "snap", "knock", "jolt", "send", "floor", "drop"]
  },
  heavy:     
  {
    range: [0.14, 0.22],
    words: ["slam", "drive", "pierce", "gouge", "pound", "crash", "pummel", "hammer", "thrust", "hurl", "plow", "barrel", "crunch"]
  },
  fierce:  
  {
    range: [0.22, 0.35],
    words: ["maul", "rend", "tear", "cleave", "batter", "wrench", "savage", "shatter", "mangle", "cripple", "splinter", "crush", "break", "fracture"]
  },
  brutal:    
  {
    range: [0.35, 0.50],
    words: ["obliterate", "annihilate", "pulverize", "eviscerate", "decimate", "destroy", "shred", "mutilate", "demolish", "flatten", "incapacitate"]
  },
  lethal:    
  {
    range: [0.60, 0.75],
    words: ["sever", "impale", "disembowel", "incinerate", "disintegrate", "liquefy", "behead", "dismember", "gut", "skewer", "execute"]
  },
};

// ============================================
// Inventory management keywords
// ============================================

const CSMS_IV_KEYWORDS =
{
  take:   ["take", "grab", "pick up", "collect", "retrieve", "get", "acquire", "tuck"],
  drop:   ["drop", "discard", "throw away", "leave", "abandon", "let go of"],
  give:   ["give", "hand", "pass", "offer", "deliver", "transfer", "slide", "shove"],
  hurl:   ["throw", "toss", "hurl", "fling", "chuck", "lob"],
};

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
  // INITIALIZATION
  // ==================

  // CFG CARD
  function initConfigCard()
  {
    // Look for existing CFG card
    const existing = storyCards.find(card => card.title === "⚙️ CSMS CFG");
    if (existing) return; // Card exists — parseConfigCard() will handle it

    // Create with script defaults
    const entry = 
      `CSMS Configuration Card\n` +
      `Edit values in the Notes field below, not here.\n` +
      `For features: use true to turn on, false to turn off.\n` +
      `For numbers: integers only e.g. 10, 50.\n` +
      `For dice: use XdY format e.g. 1d20, 2d6.\n` +
      `Full guide: ${CSMS_CONFIG.WEBSITE}`;

    const notes =
      `MODULE_CHARACTER_SHEETS: true\n` +
      `MODULE_COMBAT: true\n` +
      `MODULE_ORDINANCE: true\n` +
      `MODULE_INVENTORY: true\n` +
      `DEBUG_MODE: false\n` +
      `STAT_MAX: 50\n` +
      `STAT_MIN: 1\n` +
      `AVERAGE_STAT: 10\n` +
      `DEFAULT_STAT: 10\n` +
      `DEFAULT_HP: 10\n` +
      `DEFAULT_AC: 10\n` +
      `DEFAULT_SPEED: 30\n` +
      `DAMAGE_DIE: 6\n` +
      `LOOKBACK_ACTIONS: 5\n` +
      `INJECTED_SHEET_MAX: 20\n` +
      `ORD_PROXIMITY: 50\n` +
      `ORD_DEFAULT_ROLL: 1d20\n` +
      `ORD_ND_DAMAGE_DETECTION: false`;

    storyCards.push(
    {
      title: "⚙️ CSMS CFG",
      type: "other",
      keys: "csms_cfg",
      entry: entry,
      description: notes,
    });
  }

  // Parse the value - Sync script values with cfg card
  function parseConfigCard()
  {
    const card = storyCards.find(card => card.title === "⚙️ CSMS CFG");
    if (!card || !card.description) return;

    const lines = card.description.split("\n");

    for (const line of lines)
    {
      const match = line.match(/^([A-Z_]+):\s*(.+)$/);
      if (!match) continue;

      const key   = match[1].trim();
      const value = match[2].trim();

      switch(key)
      {
        // Modules
        case "MODULE_CHARACTER_SHEETS": CSMS_CONFIG.MODULES.CHARACTER_SHEETS = value === "true"; break;
        case "MODULE_COMBAT":           CSMS_CONFIG.MODULES.COMBAT           = value === "true"; break;
        case "MODULE_ORDINANCE":        CSMS_CONFIG.MODULES.ORDINANCE        = value === "true"; break;
        case "MODULE_INVENTORY":        CSMS_CONFIG.MODULES.INVENTORY        = value === "true"; break;

        // Toggles
        case "DEBUG_MODE":               NOTIFY_CONFIG.DEBUG_MODE                    = value === "true"; break;
        case "ORD_ND_DAMAGE_DETECTION":  CSMS_CONFIG.ORD_ND_DAMAGE_DETECTION        = value === "true"; break;

        // Integers
        case "STAT_MAX":          CSMS_CONFIG.STAT_MAX          = parseInt(value); break;
        case "STAT_MIN":          CSMS_CONFIG.STAT_MIN          = parseInt(value); break;
        case "AVERAGE_STAT":      CSMS_CONFIG.AVERAGE_STAT      = parseInt(value); break;
        case "DEFAULT_STAT":      CSMS_CONFIG.DEFAULT_STAT      = parseInt(value); break;
        case "DEFAULT_HP":        CSMS_CONFIG.DEFAULT_HP        = parseInt(value); break;
        case "DEFAULT_AC":        CSMS_CONFIG.DEFAULT_AC        = parseInt(value); break;
        case "DEFAULT_SPEED":     CSMS_CONFIG.DEFAULT_SPEED     = parseInt(value); break;
        case "DAMAGE_DIE":        CSMS_CONFIG.DAMAGE_DIE        = parseInt(value); break;
        case "LOOKBACK_ACTIONS":  CSMS_CONFIG.LOOKBACK_ACTIONS  = parseInt(value); break;
        case "INJECTED_SHEET_MAX":CSMS_CONFIG.INJECTED_SHEET_MAX= parseInt(value); break;
        case "ORD_PROXIMITY":     CSMS_CONFIG.ORD_PROXIMITY     = parseInt(value); break;

        // Dice notation
        case "ORD_DEFAULT_ROLL":  CSMS_CONFIG.ORD_DEFAULT_ROLL  = value; break;

        // Leveling
        case "MODULE_LEVELING":         CSMS_CONFIG.MODULES.LEVELING        = value === "true"; break;
        case "LEVEL_CAP":               CSMS_CONFIG.LEVEL_CAP               = parseInt(value); break;
        case "XP_THRESHOLD":            CSMS_CONFIG.XP_THRESHOLD            = parseInt(value); break;
        case "HP_PER_LEVEL":            CSMS_CONFIG.HP_PER_LEVEL            = parseInt(value); break;
        case "DP_PER_LEVEL":            CSMS_CONFIG.DP_PER_LEVEL            = parseInt(value); break;
        case "XP_PER_ACTION":           CSMS_CONFIG.XP_PER_ACTION           = parseInt(value); break;
        case "XP_PER_ORDINANCE":        CSMS_CONFIG.XP_PER_ORDINANCE        = parseInt(value); break;
        case "XP_PER_HIT":              CSMS_CONFIG.XP_PER_HIT              = parseInt(value); break;
        case "XP_PER_DAMAGE_RECEIVED":  CSMS_CONFIG.XP_PER_DAMAGE_RECEIVED  = parseInt(value); break;
        case "XP_PER_KILL":             CSMS_CONFIG.XP_PER_KILL             = parseInt(value); break;
        case "XP_PER_ROLL_SUCCESS":     CSMS_CONFIG.XP_PER_ROLL_SUCCESS     = parseInt(value); break;
        case "XP_PER_ROLL_FAIL":        CSMS_CONFIG.XP_PER_ROLL_FAIL        = parseInt(value); break;
        case "PROFICIENCY_THRESHOLDS":
          CSMS_CONFIG.PROFICIENCY_THRESHOLDS = value.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
          break;
      }
    }
  }


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
      notify(
        `Character sheet auto-created for ${charName}`, 
        `auto-created: ${charName}`);
    });
  }

  // Always check for ghost
  syncMultiplayerCharacters();

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
        `roll failed: no stat detected`);
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
        `roll failed: no stat detected`);
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

      notify(
        `${caller}'s roll: ${cResult.breakDown}`,
        `${caller} roll: ${cResult.breakDown}`
      );
      notify(
        `${oppose}'s roll: ${oResult.breakDown}`,
        `${oppose} roll: ${oResult.breakDown}`
      );
      
      if (cResult.total === oResult.total)
      {
        // Tie
        notify("Both rolls result a TIE");
        closureText = `${caller} rolled a ${cResult.total} against ${oResult.total} of ${oppose} resulting a TIE.`;

        // Tie — both rolled, both get roll XP
        awardXP(cCharacter, CSMS_CONFIG.XP_PER_ROLL_SUCCESS);
        awardXP(oCharacter, CSMS_CONFIG.XP_PER_ROLL_SUCCESS);
      }
      else if (cResult.total > oResult.total)
      {
        // Caller win
        const damage = resolveDamage(cCharacter, Math.abs(finalResult));
        notify(
          `${caller}'s Damage Roll: ${damage.breakDown}. ${damage.total} damage point applied to ${oppose}`, 
          `Damage roll: ${damage.breakDown}`);

        // Apply damage
        const remainingHP = applyDamage(oCharacter, damage.total);

        // AWard XP (caller win)
        awardXPClassicRoll(cCharacter, oCharacter);

        // AI doesnt have to know full break down. Just who wins with what points and who left with what points.
        closureText = `${caller} rolled a ${cResult.total} against ${oResult.total} of ${oppose}. ${caller} wins and ${damage.total} damage point applied to ${oppose}. ${oppose} left with ${remainingHP} HP.`;
      }
      else
      {
        // Oppose win
        const damage = resolveDamage(oCharacter, Math.abs(finalResult));
        notify(
          `${oppose}'s Damage Roll: ${damage.breakDown}. ${damage.total} damage point applied to ${caller}`, 
          `Damage roll: ${damage.breakDown}`);

        // Apply damage
        const remainingHP = applyDamage(cCharacter, damage.total);

        // AWard XP (oppose win)
        awardXPClassicRoll(oCharacter, cCharacter)

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

      // AWard XP (solo roll)
      awardXPClassicRoll(cCharacter)
    }

    // Give instructions to player and GM
    text = `## Continue the story. ${caller} attempted to ${action}. ${closureText}`;
    state.csmsRollPending = null;
  }

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
      `${character.name}'s HP: ${fHP}`);
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

  // Generate damage from narrative
  function detectNarrativeDamage(output, callerName, targetName, callerMaxHp, targetMaxHp)
  {
    const words         = output.toLowerCase().split(/\s+/);
    const callerLow     = callerName.toLowerCase();
    const targetLow     = targetName.toLowerCase();
    const callerPronouns = ["you", "your", "i ", "i'm", "i've", "my", "me"];

    const result = { caller: null, target: null };
    
    // ---- EXPLICIT NUMBER DETECTION ----
    const explicitMatch = output.match(/(\d+)\s*(?:damage|dmg|hp|points?)\b/i)
                      || output.match(/dealt?\s+(\d+)/i)
                      || output.match(/loses?\s+(\d+)/i);

    if (explicitMatch)
    {
      const dmg      = parseInt(explicitMatch[1]);
      const matchIdx = output.toLowerCase().indexOf(explicitMatch[0].toLowerCase());
      const before   = output.toLowerCase().slice(Math.max(0, matchIdx - 60), matchIdx);

      const isTargetHit = before.includes(targetLow);
      const isCallerHit = before.includes(callerLow)
                      || callerPronouns.some(p => before.includes(p));

      if (isTargetHit)
      {
        result.target = { tier: "explicit", damage: dmg };
      }
      else if (isCallerHit)
      {
        result.caller = { tier: "explicit", damage: dmg };
      }
      
      return result;
    }

    // ---- TIER WORD DETECTION ----
    // Tier scan - highest first, first match wins
    const tierOrder = ["lethal", "brutal", "fierce", "heavy", "solid", "glancing"];

    for (const tierName of tierOrder)
    {
      const tier = CSMS_ORD_TIERS[tierName];

      for (const word of tier.words)
      {
        const wordIdx = output.toLowerCase().search(new RegExp(`\\b${word}`));
        if (wordIdx === -1) continue;

        const receiver = resolveReceiver(output, wordIdx, callerName, targetName);
        if (!receiver) continue; // no valid receiver — skip

        const [min, max] = tier.range;

        if (receiver === "target" && !result.target)
        {
          const dmg = Math.max(1, Math.round(targetMaxHp * (min + Math.random() * (max - min))));
          result.target = { tier: tierName, damage: dmg };
        }
        else if (receiver === "caller" && !result.caller)
        {
          const dmg = Math.max(1, Math.round(callerMaxHp * (min + Math.random() * (max - min))));
          result.caller = { tier: tierName, damage: dmg };
        }

        if (result.caller && result.target) break;
      }

      if (result.caller && result.target) break;
    }

    return result;
  }

  // Used when receiver is ambiguous like him
  function resolveReceiver(output, wordIdx, callerName, targetName)
  {
    const callerLow = callerName.toLowerCase();
    const targetLow = targetName.toLowerCase();

    // Check immediate window after action word (~15 chars)
    const nearAfter = output.toLowerCase().slice(wordIdx, wordIdx + 25);

    // Explicit caller pronouns
    if (/\byou\b|\byour\b/.test(nearAfter)) return "caller";

    // Explicit names
    if (nearAfter.includes(callerLow)) return "caller";
    if (nearAfter.includes(targetLow)) return "target";

    // Him/them/her — chain resolve
    if (/\bhim\b|\bthem\b|\bher\b|\bhis\b|\btheir\b/.test(nearAfter))
    {
      // Split into sentences, find which one contains our word
      const sentences = output.toLowerCase().split(/[.!?]+/);
      const wordSentenceIdx = sentences.findIndex(s => 
        output.toLowerCase().indexOf(s.trim()) <= wordIdx && 
        output.toLowerCase().indexOf(s.trim()) + s.length >= wordIdx
      );

      // Scan backwards from current sentence
      for (let i = wordSentenceIdx; i >= 0; i--)
      {
        const s = sentences[i];
        const hasHim    = /\bhim\b|\bthem\b|\bher\b|\bhis\b|\btheir\b/.test(s);
        const hasCaller = s.includes(callerLow);
        const hasTarget = s.includes(targetLow);

        // Same sentence has pronoun + name — clear attribution
        if (hasHim && hasTarget && !hasCaller) return "target";
        if (hasHim && hasCaller && !hasTarget) return "caller";

        // Both names in same sentence — whoever appears later is receiver
        if (hasCaller && hasTarget)
        {
          return s.lastIndexOf(targetLow) > s.lastIndexOf(callerLow)
            ? "target"
            : "caller";
        }

        // Pronoun sentence has no names — look back for nearest name
        if (hasHim && !hasCaller && !hasTarget)
        {
          for (let j = i - 1; j >= 0; j--)
          {
            const prev = sentences[j];
            if (prev.includes(targetLow)) return "target";
            if (prev.includes(callerLow)) return "caller";
          }
        }
      }
    }
    
    // No receiver found — invalid
    return null;
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
      },
      inventory:      [],
      ordinances:     [],
      pendingDP:      0,
      pendingLevelUp: false,
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

  // Find player that execute the action and return the character
  function getCallerCharacter(inputText = text)
  {
    // Singleplayer — just return the player
    if (!info.characters || info.characters.length === 0)
    {
      return getPlayer();
    }

    // Multiplayer — detect from input text
    const input = inputText.trim();
    for (const charName of info.characters)
    {
      if (input.indexOf(`> ${charName}`) !== -1)
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
      notify(
        `Character sheet removed for ${c.name} (left or renamed).`, 
        `removed: ${c.name}`);
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
    function safeInt(value, fallback, label, useStatLimit = true)
    {
      const parsed = parseInt(value);
      
      if (isNaN(parsed))
      {
        errors.push(`${label}: "${value}" is not a number. Kept ${fallback}.`);
        return fallback;
      }

      // Keep things in reasonable range
      if (useStatLimit && (parsed < CSMS_CONFIG.STAT_MIN || parsed > CSMS_CONFIG.STAT_MAX))
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
      c.level = safeInt(line1[2], c.level, "Level", false);
      c.xp = safeInt(line1[3], c.xp, "XP", false);
    }

    // Line 2 - HP: 10/10 | AC: 10 | Speed: 30ft
    const line2 = lines[1]?.match(/\w+:\s*(\S+)\/(\S+)\s*\|\s*\w+:\s*(\S+)\s*\|\s*\w+:\s*(\S+)/i);
    if (line2 && c.hp)
    {
      c.hp.current = safeInt(line2[1], c.hp.current, "HP Current", false);
      c.hp.max = safeInt(line2[2], c.hp.max, "HP Max", false);
      c.ac = safeInt(line2[3], c.ac, "AC", false);
      c.speed = safeInt(line2[4], c.speed, "Speed", false);
    }

    // Line 3 - Proficiency: +2
    const line3 = lines[2]?.match(/\w+:\s*(\S+)/i);
    if (line3)
    {
      c.proficiencyBonus = safeInt(line3[1], c.proficiencyBonus, "Proficiency", false);
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
      notify(
        `Card sync errors for ${c.name}:\n- ${errors.join("\n- ")}`, 
        `sync errors: ${errors.join(" | ")}`);
    }

    // Backward compatibilty
    if (c.pendingDP === undefined) c.pendingDP = 0;
    if (c.pendingLevelUp === undefined) c.pendingLevelUp = false;

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

    const cNotes = [
      `[Inventory]`,
      `- `,
      ``,
      `[Ordinances]`,
      `- `
    ].join("\n");

    const cardTitle = `📋 ${c.name}`;

    const existing = storyCards.find(card => card.title === cardTitle);
    if (existing)
    {
      existing.entry = cEntry;
      // Only add notes if missing - never overwrite existitng inventory/ordinances

      if (!existing.description || !existing.description.includes("[Inventory]"))
      {
        existing.description = cNotes;
      }
    }
    else
    {
      storyCards.push({
        title: cardTitle,
        keys: `csms_cs_${c.name}, ${CSMS_CONFIG.TEMP_TRIGGER}`,
        entry: cEntry,
        description: cNotes
      });
    }
  }

  function updateNotesField(character)
  {
    const c = character;
    const card = storyCards.find(card => card.title === `📋 ${c.name}`);
    if (!card) return;

    const inventoryLines = c.inventory.length > 0 ? c.inventory.map(i => `- ${i}`).join("\n") : `- `;
    const ordinanceLines = c.ordinances.length > 0 ? c.ordinances.map(o => `- ${o}`).join("\n") : `- `;

    card.description = `[Inventory]\n${inventoryLines}\n\n[Ordinances]\n${ordinanceLines}`;
  }

  // ==================
  // LEVELING SYSTEM
  // ==================

  // Add cp to character
  function awardXP(character, amount)
  {
    // Only when module is active
    if (!CSMS_CONFIG.MODULES.LEVELING) return;
    // Skip if amount is 0 (when some action deosnt give XP)
    if (!amount || amount <= 0) return;
    // Skip if reached max level
    if (character.level >= CSMS_CONFIG.LEVEL_CAP) return;

    // DEBUG
    log(`awardXP: ${character.name} += ${amount} (was ${character.xp})`);

    // Add amount to character XP
    character.xp += amount;

    // Enough to level up
    if (character.xp >= CSMS_CONFIG.XP_THRESHOLD)
    {
      // Spilled xp stored
      character.xp -= CSMS_CONFIG.XP_THRESHOLD;
      character.pendingLevelUp = true;
    }
  }

  function processLevelUp(character)
  {
    // DEBUG
    log(`processLevelUp: ${character.name} pendingLevelUp=${character.pendingLevelUp} pendingDP=${character.pendingDP}`);

    // Only for character pending leveling up
    if (!character.pendingLevelUp) return;
    // Stop if reached max level
    if (character.level >= CSMS_CONFIG.LEVEL_CAP)
    {
      character.pendingLevelUp = false;
      return;
    }

    // Increase the level if pass earlier checks
    character.level          += 1;
    // Reset flag
    character.pendingLevelUp = false;

    // HP Increase - current and max both go up
    character.hp.max      += CSMS_CONFIG.HP_PER_LEVEL;
    character.hp.current  += CSMS_CONFIG.HP_PER_LEVEL;

    // Development Points
    character.pendingDP   += CSMS_CONFIG.DP_PER_LEVEL;

    // Proficiency bonus
    if (CSMS_CONFIG.PROFICIENCY_THRESHOLDS.includes(character.level))
    {
      character.proficiencyBonus += 1;
    }

    // Update character card
    updateCharacterCard(character);

    // Notify player
    notify(
      `${character.name} reached Level ${character.level}!\n` +
      `HP +${CSMS_CONFIG.HP_PER_LEVEL}. New max: ${character.hp.max}\n` +
      `${character.name} has ${character.pendingDP} Development Point(s) available.` + 
      (character.isPlayer ? `Use /csms dp/check to allocate.`: ``) +
      (CSMS_CONFIG.PROFICIENCY_THRESHOLDS.includes(character.level)
        ? `\nProficiency bonus increased to +${character.proficiencyBonus}!`
        : ``),
      `level up`
    );
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

        notify(
          `Character sheet generated for ${name}!`, 
          `generated: ${name}`);
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
      text = text.trimEnd() + `\n---\n\n## Reply with only one word — the most relevant stat for ${caller} to "${action}": STR, DEX, CON, INT, WIS, or CHA. Nothing else.\n`;
    }
  };

  // ==================
  // ORDINANCE
  // ==================

  // Make the input sounds more natural
  function naturalizeOrdinanceCommand(csmsText, failed)
  {
    const parts        = csmsText.split("/");
    const ordinanceArg = parts[3]?.trim().replace(/[.,!?"]+$/, "") || "";
    const targetArg    = parts[4]?.trim().replace(/[.,!?"]+$/, "") || "";

    return failed
      ? `try to use ${ordinanceArg}${targetArg ? ` against ${targetArg}` : ""}. The attempt fails.`
      : `execute ${ordinanceArg}${targetArg ? ` against ${targetArg}` : ""}.`;
  }

  // Sync ordinances from character with CS card
  function parseOrdinances(character)
  {
    const c = character;
    const card = storyCards.find(card => card.title === `📋 ${c.name}`);
    if (!card || !card.description) return;

    const description = card.description;
    const blockStart  = description.indexOf("[Ordinances]");
    if (blockStart === -1) return;

    const block = description.slice(blockStart);
    const lines = block.split("\n");
    const ordinances = [];

    for (const line of lines)
    {
      const trimmed = line.trim();
      if (trimmed === "[Ordinances]") continue;
      if (trimmed.startsWith("- ") || trimmed.startsWith("-")) ordinances.push(trimmed.replace(/^-\s*/, "").trim());
    }

    c.ordinances = ordinances;
  }

  function processOrdinanceTags()
  {
    // Stop immediately if there is no pending states
    if (!state.csmsOrdinancePending) return;

    const pending = state.csmsOrdinancePending;
    const { step, caller, target, type, notation } = pending

    // ---- STEP 1: Detect DAMAGING or NONDAMAGING ----
    if (step === 1)
    {
      const isDamaging = /\bDAMAGING\b/i.test(text);
      const isNonDamaging = /\bNONDAMAGING\b/i.test(text);

      if (!isDamaging && !isNonDamaging)
      {
        // Both do not exist
        notify(
          `${CSMS_CONFIG.ORD_ERROR}Step 1 failed - AI failed to detect DAMAGING or NON DAMAGING.\nOrdinance "${pending.ordinanceName}" has been cancelled.`,
          `ordinance step 1: unexpected response`
        );

        state.csmsOrdinancePending = null;
        text = "OOC: Clear everything including your input and try again.";

        return;
      }

      pending.type = isDamaging ? "DAMAGING" : "NONDAMAGING";
      pending.step = 2;
      // Strip everything. Step 2 instruction injects on next action
      text = `[Ordinance "${pending.ordinanceName}" is being prepared. Press Continue to proceed.]\n`;

      return;
    }

    // ---- STEP 2 DAMAGING: Get roll notation ----
    if (step === 2 && pending.type === "DAMAGING")
    {
      const notationMatch = text.match(/(\d+d\d+(?:[+\-][a-zA-Z]+)?)/i);
      // Use default notation if none provided
      const resolvedNotation = notationMatch?. [1] || `1d${CSMS_CONFIG.DAMAGE_DIE}`;

      if (!notationMatch)
      {
        notify(
          `No roll notation found - using default: 1d${CSMS_CONFIG.DAMAGE_DIE}`,
          `ordinance step 2: using default notation`
        );
      }

      // Roll for it... 😏
      const callerChar = findCharacter(state.csmsOrdinancePending.caller);
      const rollResult = resolveRoll(resolvedNotation, callerChar, "normal");
      pending.notation = resolvedNotation;
      pending.rollResult = rollResult;

      notify(
        `${pending.caller} rolls for "${pending.ordinanceName}": ${rollResult.breakDown}`,
        `ordinance roll: ${rollResult.breakDown}`
      );

      pending.step = 3;
      text = `[Rolling for "${pending.ordinanceName}"... ${rollResult.breakDown}. Press Continue to resolve.]\n\n`;

      return;
    }

    // ---- STEP 3 DAMAGING: Scan narrative for damage ----
    if (step === 3)
    {
      const targetChar = findCharacter(state.csmsOrdinancePending.target);
      const callerChar = findCharacter(state.csmsOrdinancePending.caller);

      if (targetChar && callerChar)
      {
        const dmgResult = detectNarrativeDamage(
          text,
          callerChar.name,
          targetChar.name,
          callerChar.hp.max,
          targetChar.hp.max
        );

        // Apply damage
        if (dmgResult.target)
        {
          applyDamage(targetChar, dmgResult.target.damage);
          awardXPDamage(callerChar, targetChar);
        } 
        if (dmgResult.caller)
        {
          applyDamage(callerChar, dmgResult.caller.damage);
          awardXPDamage(targetChar, callerChar);
        }
      }

      state.csmsOrdinancePending = null;
      
      return;
    }

    // ---- STEP 2 NONDAMAGING: Roll or Narrative ----
    if (step === 2 && pending.type === "NONDAMAGING")
    {
      const needsRoll   = /\bROLL\b/i.test(text);
      const isNarrative = /\bNARRATIVE\b/i.test(text);

      if (!needsRoll && !isNarrative)
      {
        notify(
          `${CSMS_CONFIG.ORD_ERROR}Step 2 failed — AI did not return ROLL or NARRATIVE.\nOrdinance "${pending.ordinanceName}" has been cancelled.`,
          `ordinance step 2 nondamaging: unexpected response`);
        state.csmsOrdinancePending = null;
        text = "OOC: Clear everything including your input and try again.";
        return;
      }

      if (isNarrative)
      {
        pending.step = "3-ND";
        text = `[Ordinance "${pending.ordinanceName}" — no roll needed. Press Continue to resolve.]\n`;
        return;
      }

      pending.step = "2-B";
      text = `[Ordinance "${pending.ordinanceName}" — a roll will determine the outcome. Press Continue.]\n`;
      return;
    }

    // ---- STEP 2-B NONDAMAGING: Get roll notation ----
    if (step === "2-B")
    {
      const notationMatch = text.match(/(\d+d\d+(?:[+\-][a-zA-Z]+)?)/i);
      const resolvedNotation = notationMatch?.[1] || `${CSMS_CONFIG.ORD_DEFAULT_ROLL}`;

      if (!notationMatch)
      {
        notify(
          `No roll notation provided — using default: ${CSMS_CONFIG.ORD_DEFAULT_ROLL}`,
          `ordinance step 2-B: using default notation`);
      }

      const callerChar = findCharacter(state.csmsOrdinancePending.caller);
      const rollResult = resolveRoll(resolvedNotation, callerChar, "normal");
      
      pending.notation   = resolvedNotation;
      pending.rollResult = rollResult;

      notify(
        `${pending.caller} rolls for "${pending.ordinanceName}": ${rollResult.breakDown}`,
        `ordinance roll: ${rollResult.breakDown}`);

      pending.step = "3-ND";
      text = `\n[Rolling for "${pending.ordinanceName}"... ${rollResult.breakDown}. Press Continue to resolve.]\n\n`;
      return;
    }

    // ---- STEP 3-ND NONDAMAGING: Pure narrative, clear state ----
    if (step === "3-ND")
    {
      state.csmsOrdinancePending = null;
      return;
    }
  }

  function injectOrdinanceCheck()
  {
    // Stop from always running
    if (!state.csmsOrdinancePending) return;

    const pending = state.csmsOrdinancePending;
    const { step, caller, target, entry, ordinanceName } = pending;

    // STEP 1
    if (step === 1)
    {
      const targetHint = target ? `The target is ${target}.` : `There is no specific target.`;

      text = text.trimEnd() + 
        `\n---\n` + 
        `Ordinance triggered by ${caller}.\n` +
        `${targetHint}\n` + 
        `Ordinance entry: ${entry}\n\n` + 
        `## Reply with exactly one word: DAMAGING or NONDAMAGING. Nothing else.`;
    }

    // STEP 2 - Damaging
    if (step === 2 && pending.type === "DAMAGING")
    {
      text = text.trimEnd() + 
        `\n---\n` + 
        `## Ordinance "${ordinanceName}" is a damaging move by ${caller} against ${target}.\n` + 
        `What roll notation should be used? Reply with only the notation e.g. 1d20+STR. Nothing else.`;
    }

    // STEP 2 - Non damaging
    if (step === 2 && pending.type === "NONDAMAGING")
    {
      text = text.trimEnd() + 
      `\n---\n` + 
      `## Ordinance "${ordinanceName}" triggered by ${caller}.\n` + 
      `Does this require a roll? Reply with exactly one word: ROLL or NARRATIVE. Nothing else.`;
    }

    if (step === "2-B")
    {
      text = text.trimEnd() +
        `\n---\n` +
        `## Ordinance "${pending.ordinanceName}" requires a roll for ${pending.caller}.\n` +
        `What roll notation should be used? Reply with only the notation e.g. 1d20+CHA. Nothing else.`;
    }

    if (step === "3-ND")
    {
      const rollLine = pending.rollResult
        ? `Roll result: ${pending.rollResult.total} (${pending.rollResult.breakDown}).`
        : "";

      text = text.trimEnd() +
        `\n---\n` +
        `${rollLine}\n` +
        `## Continue the story. Narrate the outcome of ${pending.caller} using "${pending.ordinanceName}"${pending.target ? ` against ${pending.target}` : ""}.`;
    }
  }

  // ==================
  // INVENTORY
  // ==================

  function parseInventory(character)
  {
    const c = character;
    const card = storyCards.find(card => card.title === `📋 ${c.name}`);
    if (!card)
    {
      notify(`No character sheet found for ${c.name}`, `inventory: no card found`);
    
      return;
    }

    const description = card.description || "";
    const inventoryStart = description.indexOf("[Inventory]");

    if (inventoryStart === -1)
    {
      // Auto repair — add missing blocks
      const card = storyCards.find(card => card.title === `📋 ${c.name}`);
      if (card)
      {
        card.description = `[Inventory]\n- \n\n[Ordinances]\n- `;
      }
      return;
    }

    const inventoryBlock = description.slice(inventoryStart);
    const lines = inventoryBlock.split("\n");
    const items = [];

    // push inventory to data
    for (const line of lines)
    {
      const trimmed = line.trim();
      if (trimmed.startsWith("- "))
      {
        const itemName = trimmed.slice(2).trim();
        if (itemName) items.push(itemName);  // skip empty - 
      }
    }

    c.inventory = items;
  }

  // ==================
  // ACTION HANDLER
  // ==================

  function takeItem(caller, item, receiver, originalText)
  {
    
    const from = receiver ? findCharacter(receiver) : null;

    if (from)
    {
      const idx = from.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
  
      if (idx === -1)
      {
        text = originalText.replace(/iv_[^\n]*/i, `look for ${item} on ${from.name}, but cannot find it.`);

        return true;
      }
      from.inventory.splice(idx, 1);
      updateNotesField(from);
    }

    caller.inventory.push(item);
    updateNotesField(caller);

    return null;
  }

  function dropItem(caller, item, originalText)
  {
    const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    
    if (idx === -1)
    {
      text = originalText.replace(/iv_[^\n]*/i, `reach for ${item}, but realize it isn't there.`);

      return true;
    }
    caller.inventory.splice(idx, 1);
    updateNotesField(caller);

    return null;
  }

  function giveItem(caller, item, receiver, originalText)
  {
    const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    if (idx === -1)
    {
      text = originalText.replace(/iv_[^\n]*/i, `about to give something but realize that its nowhere to be found.`);

      return true;
    }

    if (!receiver)
    {
      text = originalText.replace(/iv_[^\n]*/i, `look around, unsure who to give the ${item} to.`);

      return true;
    }

    const to = findCharacter(receiver);
    if (!to)
    {
      text = originalText.replace(/iv_[^\n]*/i, `look for someone to give the ${item} to, but cannot find them.`);

      return true;
    }

    caller.inventory.splice(idx, 1);
    to.inventory.push(item);
    updateNotesField(caller);
    updateNotesField(to);

    return null;
  }

  function hurlItem(caller, item, receiver, originalText)
  {
    const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    if (idx === -1)
    {
      text = originalText.replace(/iv_[^\n]*/i, `reach for ${item} to throw, but realize it isn't there.`);

      return true;
    }

    caller.inventory.splice(idx, 1);
    updateNotesField(caller);

    return null;
  }

  // ==================
  // COMMANDS / HANDLER
  // ==================

  function processCommand(csmsMatch, result)
  {
    // ORDINANCE
    const isOrdinance = csmsMatch[0].toLowerCase().includes("ordinance");
    if (isOrdinance)
    {
      const failed = result && (
        result.includes(CSMS_CONFIG.ORD_ERROR.trim()) || 
        result.includes("[Ordinance Failed]")
      );

      text = text.replace(csmsMatch[0], naturalizeOrdinanceCommand(csmsMatch[0], failed));
    }
  }

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
      character = getCallerCharacter();
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
      c = getCallerCharacter();
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

    if (!findCharacter(caller)) return `No character sheet found for "${caller}". Remember: /csms roll/CallerName/action/opponent`;

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

  function handleOrdinance(callerName, ordinanceName, targetName)
  {
    if (!callerName || !ordinanceName)
    {
      return `${CSMS_CONFIG.ORD_ERROR}Missing arguments.\nCorrect format: /csms ordinance/CallerName/OrdinanceName/TargetName\nTarget is optional for non-combat Ordinances.`;
    }

    // Extract only ordinance cards
    const allOrds = storyCards.filter(card => card.type === "Ordinance");
    if (allOrds.length === 0)
    {
      return `${CSMS_CONFIG.ORD_ERROR}No Ordinance cards found.\nCreate a story card and set its type to "CUSTOM" => "Ordinance".`;
    }

    // Extract the exact card
    const ordCard = allOrds.find(card => card.title.toLowerCase().trim() === ordinanceName.toLowerCase().trim());
    if (!ordCard)
    {
      return `${CSMS_CONFIG.ORD_ERROR}Ordinance "${ordinanceName}" not found.\nCheck the card title matches exactly. Card type must be set to "CUSTOM" => "Ordinance".`;
    }

    // Validate caller exists
    const callerChar = findCharacter(callerName);
    if(!callerChar)
    {
      return `${CSMS_CONFIG.ORD_ERROR}Caller "${callerName}" has no character sheet.\nCreate one with /csms create/${callerName}`;
    }

    // Sync ordinances fresh before validating
    parseOrdinances(callerChar);
   
    // Validate caller has this Ordinance assigned
    if (callerChar.ordinances && callerChar.ordinances.length > 0)
    {
      const hasOrdinance = callerChar.ordinances.some(
        o => o.toLowerCase().trim() === ordinanceName.toLowerCase().trim()
      );

      if (!hasOrdinance)
      {
        return `[Ordinance Failed] ${callerChar.name} does not have "${ordinanceName}" assigned. Attempt unsuccessful.`;
      }
    }
    // If ordinances list is empty — skip validation, assume all allowed

    // Validate target exist - only if provided
    const targetChar = targetName ? findCharacter(targetName) : null;

    // Award XP for executing an Ordinance
    awardXP(callerChar, CSMS_CONFIG.XP_PER_ORDINANCE);

    // All good - set pending state
    state.csmsOrdinancePending = 
    {
      step:             1,
      caller:           callerChar.name,
      ordinanceName:    ordCard.title,
      target:           targetChar ? targetChar.name : null,
      entry:            ordCard.entry,
      type:             null,
      notation:         null,
      rollResult:       null,
    };
    
    return `Ordinance "${ordCard.title}" — ${callerChar.name} vs ${targetChar ? targetChar.name : "no target"}. Executing...`;
  }

  // Updates Character Card Notes section by command
  function handleUpdateSheetNotes(name)
  {
    const c = name ? findCharacter(name) : getCallerCharacter();
    if (!c) return `No character named ${name} found.`;
    
    parseInventory(c);
    parseOrdinances(c);

    return `${c.name}'s sheet notes synced.`;
  }

  // handle how script process the iv_action command
  function handleInventoryCommand(ivText, originalText)
  {
    // Strip "iv_" prefix
    const raw = ivText.slice(3).trim().toLowerCase();

    // Detect action type
    let action = null;
    let matchedKeyword = null;

    for (const [actionType, keywords] of Object.entries(CSMS_IV_KEYWORDS))
    {
      for (const keyword of keywords)
      { 
        if (raw.startsWith(keyword))
        {
          action = actionType;
          matchedKeyword = keyword;

          break;
        }
      }
      if (action) break;
    }

    if (!action) return `Unknown inventory action. Use take, drop, give, or throw.`;

    // Strip keyword from front
    const restOriginal = raw.slice(matchedKeyword.length).trim();
    const rest = restOriginal.toLowerCase();

    // Get caller
    const caller = getCallerCharacter(originalText);
    if (!caller) return `No active player found.`;

    // Parse item and receiver
    // "contract to Barbara" → item: "contract", receiver: "Barbara"
    // "knife" → item: "knife", receiver: null
    const toMatch   = restOriginal.match(/^(.+?)\s+to\s+(.+)$/);
    const atMatch   = restOriginal.match(/^(.+?)\s+at\s+(.+)$/);
    const fromMatch = restOriginal.match(/^(.+?)\s+from\s+(.+)$/);

    let item     = rest;
    let receiver = null;

    if (toMatch)
    {
      const possibleReceiver = toMatch[2].trim()
        .replace(/[.,!?"]+$/, "")
        .replace(/\s+(too|also|as well|instead|as well|either|then|now)$/i, "")
        .trim();

      item = toMatch[1];
      receiver = findCharacter(possibleReceiver) ? possibleReceiver : null;
    }
    else if (atMatch)
    {
      const possibleReceiver = atMatch[2].trim()
        .replace(/[.,!?"]+$/, "")
        .replace(/\s+(too|also|as well|instead|as well|either|then|now)$/i, "")
        .trim();

      item = atMatch[1];
      receiver = findCharacter(possibleReceiver) ? possibleReceiver : null;
    }
    else if (fromMatch)
    {
      const possibleReceiver = fromMatch[2].trim()
      .replace(/[.,!?"]+$/, "")
      .replace(/\s+(too|also|as well|instead|as well|either|then|now)$/i, "")
      .trim();

      item = fromMatch[1];
      receiver = findCharacter(possibleReceiver) ? possibleReceiver : null;
    }

    // Strip articles AND possessives AND trailing punctuation
    item = item.replace(/^(the|a|an|some|my|your|his|her|their)\s+/i, "").trim();
    item = item.replace(/[.,!?"]+$/, "").trim();
    item = item.replace(/^[a-zA-Z]+'s\s+/i, "").trim();
    item = item.replace(/\s+(on|in|inside|onto|into|over|under|at|by|near|toward)\s+(the|a|an)?\s*\w+.*$/i, "").trim();

    // Route to action handler
    switch(action)
    {
      case "take": 
        if (takeItem(caller, item, receiver, originalText)) return true; break;
      case "drop": 
        if (dropItem(caller, item, originalText)) return true; break;
      case "give": 
        if (giveItem(caller, item, receiver, originalText)) return true; break;
      case "hurl": 
        if (hurlItem(caller, item, receiver, originalText)) return true; break;
    }

    return null;
  }

  function handleDP(args, originalText)
  {
    const caller = getCallerCharacter(originalText);
    if (!caller) return `No active player found.`;

    // ---- CHECK ----
    if (!args || args === "check")
    {
      // Not allocating any dp
      return (
        `${caller.name} — Development Points available: ${caller.pendingDP}\n\n` +
        `Current stats:\n` +
        `STR: ${caller.stats.str}/${CSMS_CONFIG.STAT_MAX}  DEX: ${caller.stats.dex}/${CSMS_CONFIG.STAT_MAX}  CON: ${caller.stats.con}/${CSMS_CONFIG.STAT_MAX}\n` +
        `INT: ${caller.stats.int}/${CSMS_CONFIG.STAT_MAX}  WIS: ${caller.stats.wis}/${CSMS_CONFIG.STAT_MAX}  CHA: ${caller.stats.cha}/${CSMS_CONFIG.STAT_MAX}\n\n` +
        `Allocating example: /csms dp/STR:2,INT:1,DEX:1\n\n` +
        `Delete this response before continuing with the story.`
      );
    }

    // Parse allocations - "STR: 2, INT:1, DEX:1"
    const allocations = args.split(",").map(a => a.trim());
    const changes     = {};
    const warnings    = [];
    let totalSpend    = 0;

    for (const allocation of allocations)
    {
      // Find matching words
      const match = allocation.match(/^\s*(STR|DEX|CON|INT|WIS|CHA)\s*:\s*(\d+)$/i);
      // Push any invalid to warnings[]
      if (!match)
      {
        warnings.push(`Invalid format: "${allocation}" — skipped. Use STAT:amount e.g. STR:2`);
        continue;
      }

      // Matching and convert to int or repair negative int
      const stat    = match[1].toLowerCase();
      const amount  = Math.abs(parseInt(match[2]));
      const current   = caller.stats[stat];

      // Auto-repair over cap - apply what fits, refund the rest
      const canAdd  = CSMS_CONFIG.STAT_MAX - current;
      const applied = Math.min(amount, canAdd);
      const refund  = amount - applied;

      // Nothing can applied
      if (applied === 0)
      {
        warnings.push(`${stat.toUpperCase()} already at cap (${CSMS_CONFIG.STAT_MAX}) — skipped.`);
        continue;
      }

      // Refund available
      if (refund > 0)
      {
        warnings.push(`${stat.toUpperCase()}: only +${applied} applied (cap reached). ${refund} point(s) refunded.`);
      } 

      changes[stat] = applied;
      totalSpend   += applied;
    }

    // No valid changes (changes{} has no keys stored)
    if (Object.keys(changes).length === 0)
    {
      return warnings.join("\n") + `\n\nDelete this response before continuing with the story.`;
    }

    // Overspend - first allocation get priority, stop when DP runs out
    let dpRemaining     = caller.pendingDP;
    const finalChanges  = {};

    // Apply changes
    for (const [stat, amount] of Object.entries(changes))
    {
      // Skip if not enough remaining DP
      if (dpRemaining <= 0)
      {
        warnings.push(`${stat.toUpperCase()}: skipped — not enough Development Points remaining.`);
        continue;
      }

      const canSpend       = Math.min(amount, dpRemaining);
      const unfilledAmount = amount - canSpend;

      // DP depleted and theres not enough to reach proposed amount
      if (unfilledAmount > 0)
      {
        warnings.push(`${stat.toUpperCase()}: only +${canSpend} applied — not enough DP for full amount.`);
      }

      finalChanges[stat] = canSpend;
      dpRemaining       -= canSpend;
    }

    // Apply final changes
    for (const [stat, amount] of Object.entries(finalChanges))
    {
      caller.stats[stat] += amount;
    }
    caller.pendingDP = dpRemaining;

    // Always update after changing
    updateCharacterCard(caller);

    const summary = Object.entries(finalChanges)
      .map(([stat, amount]) => `${stat.toUpperCase()} +${amount}`)
      .join(", ");

    return (
      `${caller.name} — Stats updated: ${summary}\n` +
      `Remaining Development Points: ${caller.pendingDP}\n` +
      (warnings.length > 0 ? `\nWarnings:\n${warnings.join("\n")}\n` : ``) + 
      `\nDelete this response before continuing with the story.`
    );
  }

  //--------------------------
  // FRONT-END
  //--------------------------

  // To give XP every action called
  function awardXPPerAction()
  {
    // Stop if module inactive
    if (!CSMS_CONFIG.MODULES.LEVELING) return;

    const actor = state.callerCharacter;
    if (actor) 
    {
      awardXP(actor, CSMS_CONFIG.XP_PER_ACTION);
      updateCharacterCard(actor);
    }
  }

  // To give XP on classic dice rolls
  function awardXPClassicRoll(winner, loser = null)
  {
    // Solo roll
    if (!loser)
    {
      awardXP(winner, CSMS_CONFIG.XP_PER_ROLL_SUCCESS);
      return;
    } 

    // winner xp inflicted dmg, loser xp received dmg
    awardXPDamage(winner, loser);
    
    // Roll award
    awardXP(winner, CSMS_CONFIG.XP_PER_ROLL_SUCCESS);
    awardXP(loser, CSMS_CONFIG.XP_PER_ROLL_FAIL);  
  };

  // Give XP for every damage inflicted and received
  function awardXPDamage(hitter, hitted)
  {
    awardXP(hitter, CSMS_CONFIG.XP_PER_HIT);
    awardXP(hitted, CSMS_CONFIG.XP_PER_DAMAGE_RECEIVED);
    if (hitted.hp.current <= 0) awardXP(hitter, CSMS_CONFIG.XP_PER_KILL);
  }

  //--------------------------
  //
  //--------------------------

  function parseCommand(cText)
  {
    const parts   = cText.split("/");
    const commandIndentifiers = parts[1]?.trim().split(/\s+/);
    const action  = commandIndentifiers?.[1]?.toLowerCase().replace(/[.,!?"]+$/, "") || "";
    const args1   = parts[2]?.trim().replace(/[.,!?"]+$/, "") || "";
    const args2   = parts[3]?.trim().replace(/[.,!?"]+$/, "") || "";
    const args3   = parts[4]?.trim().replace(/[.,!?"]+$/, "") || "";

    switch(action)
    {
      case "update":
      if (args1 === "notes")    return handleUpdateSheetNotes(args2);
      if (args1 === "stats")    return handleSync(args2);
      return `Unknown update target. Use "stats" or "notes"`;
      case "create":      return handleCreate(args1);
      case "check":       return handleStats(args1);
      case "reset":       return handleReset(args1);
      case "cleanup":     return handleCleanup();
      case "roll":        return handleRoll(args1, args2, args3);
      case "ordinance":   return handleOrdinance(args1,args2, args3);
      case "dp":          return handleDP(args1, cText);
      case "test":        return handleTest();
      default:            return `Unknown CSMS command. "/csms help" for list of available commands`;
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
    // Save original text
    const originalText = text;

    // Clear any stale DP output from previous action
    state.pendingDPOutput = null;

    // Save the caller in state
    state.callerCharacter = getCallerCharacter(originalText) || null;
    
    // Ensure it fires before any command
    initConfigCard();   // create card if missing
    parseConfigCard();  // read card, override config
    
    // Zeor or one command, no more
    const csmsMatch = originalText.match(/\/csms[^\n]*/i);

    if (csmsMatch)
    {
      const result = parseCommand(csmsMatch[0].trim());

      // DP command replaces AI response - dont notify
      if (CSMS_CONFIG.MODULES.LEVELING && csmsMatch[0].toLowerCase().includes("/csms dp"))
      {
        state.pendingDPOutput = result;
      }
      else 
      {
        // Anything with notification goes here
        if (result) notify(result, result);
      
        // Replace raw commands with natural prose
        processCommand(csmsMatch, result);
      }
    }

    // Inventory command
    const ivMatch = originalText.match(/iv_[^\n]*/i);
    if (ivMatch)
    { 
      const ivFailed = handleInventoryCommand(ivMatch[0].trim(), originalText);
      
      // If action success, remove the iv_ tag, unsuccessful case handled in each action
      if (!ivFailed) text = originalText.replace(/iv_/i, "");
    }
  }

  if (hook === "context")
  {
    initConfigCard();   // create card if missing
    parseConfigCard();  // read card, override config

    state.characters.forEach(c =>
    {
      parseCharacterCard(c);
      parseInventory(c);
      parseOrdinances(c);
    });
    
    injectActiveCharacters();
    syncMultiplayerCharacters();
    processTaggedCards();

    if (CSMS_CONFIG.MODULES.COMBAT) injectStatCheck();
    if (CSMS_CONFIG.MODULES.ORDINANCE) injectOrdinanceCheck();
  }

  if (hook === "output")
  {
    if (CSMS_CONFIG.MODULES.LEVELING && state.pendingDPOutput)
    {
      text = state.pendingDPOutput;
      state.pendingDPOutput = null;
      return;
    }

    generateNarrativeSheet();
    if (CSMS_CONFIG.MODULES.COMBAT) rollCheck();
    if (CSMS_CONFIG.MODULES.ORDINANCE) processOrdinanceTags();
    
    // Leveling last - after all XP sources has been fired
    if (CSMS_CONFIG.MODULES.LEVELING)
    {
      // Award XP every action
      awardXPPerAction();

      state.characters.forEach(c => 
      {
        processLevelUp(c);
        updateCharacterCard(c);
      });
    }

    // Update must last to catch all notification
    updateNotification();

    text = text || " ";
  }

}
