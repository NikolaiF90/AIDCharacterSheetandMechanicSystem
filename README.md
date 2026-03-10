# [AID] Character Sheet and Mechanics System (CSMS)
### by PrinceF90

> *"The AI handles judgment. The script handles consistency."*

![Cover Art](assets/images/CSMS_CoverArt.png)

---

CSMS is a mechanics and character system for AI Dungeon. Ordinances, dice, inventory, combat, and progression — all in one script.

For full documentation, guides, and examples — visit **[the website](https://nikolaif90.github.io/AIDCharacterSheet/)**.

---

## Installation

1. Copy [library.js](src/library.js) contents into your scenario's **Library** tab
2. Add to **Input** tab:
```js
CSMS("input");
const modifier = (text) => { return { text } };
modifier(text)
```
3. Add to **Context** tab:
```js
CSMS("context");
const modifier = (text) => { return { text, stop } };
modifier(text)
```
4. Add to **Output** tab:
```js
CSMS("output");
const modifier = (text) => { return { text } };
modifier(text)
```

---

*CC0-1.0 — free to use, modify, and share. Credit appreciated but not required.*
