# VoidPS Originals Casino – Games Rebuild

This version rebuilds the six VoidPS Originals game screens using the supplied Originals HTML pages as the visual/interaction reference.

Included games:
- Mines
- Tower
- Coin Flip
- Crash
- Cases
- Case Battles

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

### Important
The game rounds in this frontend are playable browser demos. Randomness and balances are currently handled by the existing frontend `GameContext`/localStorage system. For a production casino or server-backed game, move balance changes, bets, RNG, game history, and account authentication to a trusted backend.
