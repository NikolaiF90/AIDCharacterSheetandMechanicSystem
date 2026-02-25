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
  DEBUG_MODE: true    // For developer only
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
// v1.0.0 by PrinceF90
// Visit https://github.com/NikolaiF90?tab=repositories
// Include this header if you're using this script in your scenario
// ============================================

const CSMS_CONFIG =
{
  // Nothing here yet
}

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

  // ==================
  // CHARACTER
  // ==================

  function initCharacter(cName, cIsPlayer = false)
  {
    return {
      name: cName,
      isPlayer: cIsPlayer,
      level: 1,
      xp: 0,
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

  function findCharacter(name)
  {
    return state.characters.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
  }

  function getPlayer()
  {
    return state.characters.find(c => c.isPlayer === true);
  }

  // ==================
  // STORY CARD
  // ==================

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
        keys: `${c.name}, character, stats, sheet`,
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

  // ==================
  // COMMANDS
  // ==================

  function handleCreate(param)
  {
    const name = param || "Adventurer";

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
      character = getPlayer();
      if (!character)
      {
        return `No player character found. Use /csms create [name] first.`;
      }
    }

    updateCharacterCard(character);
    return `${character.name} checks their status.`;
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
      case "reset":  return handleReset(param);
      case "cleanup": return handleCleanup();
      default:       return `Unknown CSMS command. Available: /csms create [name], /csms stats [name], /csms reset [name], /csms reset`;
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
    // Phase 2+ will use this
  }

  if (hook === "output")
  {
    updateNotification();
  }

}
