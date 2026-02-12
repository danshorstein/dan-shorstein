# LIBRARIAN STRIKE FORCE: The Overdue Reckoning

A turn-based tactical strategy game inspired by X-COM: UFO Defense (1994).

## The Story

The library is under attack! Overdue books have gained sentience and are trying to escape. Command an elite team of librarians to neutralize the threat and enforce silence... permanently.

## Features

- **Turn-based tactical combat** with cover system, overwatch, and special abilities
- **Strategic layer** with base management, squad customization, and mission selection
- **Multiple unit classes**: Head Librarian, Archivist, Cataloguer, and Conservator
- **Diverse enemy types**: Romance Novels, Horror Books, Textbooks, Comic Books, Encyclopedias, and more
- **Procedurally generated maps** across multiple library locations
- **Full campaign** with ~8 missions to achieve victory
- **Save/Load system** for persistent progress
- **Procedural audio** for retro sound effects
- **Fog of war** and line-of-sight mechanics

## How to Play

### Controls

- **Left Click**: Select unit / Move / Attack
- **Right Click**: Cancel action / Deselect
- **1-4 Keys**: Quick select abilities
- **Space**: End turn
- **Tab**: Cycle through units
- **Escape**: Open menu

### Combat Basics

1. Each unit has **Action Points (AP)** per turn
2. Moving costs 1 AP per tile
3. Attacking costs 2 AP
4. Use **COVER** (bookshelves) to reduce incoming damage
5. Set **OVERWATCH** to react to enemy movement
6. Different books have different weaknesses!

### Your Team

- **Head Librarian**: Balanced fighter, can rally allies
- **Archivist**: Long range, high accuracy
- **Cataloguer**: Fast scout, can mark enemies
- **Conservator**: Healer, can restore HP

### The Enemy

- **Romance Novels**: Charm and confuse
- **Horror Books**: Cause fear, high damage
- **Textbooks**: Tough, slow, heavy hitters
- **Comic Books**: Fast and evasive
- **Encyclopedias**: Boss enemies, very dangerous

## Deployment

### Netlify

1. Fork or clone this repository
2. Connect to Netlify
3. Set publish directory to `game/` (or deploy the `game` folder directly)
4. Deploy!

No build step required - it's pure HTML, CSS, and JavaScript.

### Local Development

Simply open `index.html` in a modern web browser. No server required!

For local development with live reload, you can use any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

## Technical Details

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- Web Audio API for procedural sound
- LocalStorage for save/load
- Responsive design
- Works in all modern browsers

## Credits

Created as a loving parody of X-COM: UFO Defense (1994) by MicroProse.

*"In the grim darkness of the far future library, there is only overdue fees."*

## License

MIT License - Feel free to use, modify, and distribute.
