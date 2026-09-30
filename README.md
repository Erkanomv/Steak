# Steak

A new, browser-only Stake-style casino simulation built from scratch. The interface uses the Stake name as a fan reference and visibly identifies itself as unofficial. It is not affiliated with Stake.com.

## Games

- Dice: editable multiplier, roll under/over, chance slider, 99% theoretical return; automatic bets with win/loss increases and profit/loss stops.
- Mines: 5 × 5 board, 1–24 mines, combinatorial cashout multipliers and random tile selection.
- Plinko: 8–16 rows, three risk levels, multiple simultaneous balls and animated peg paths.
- Limbo: target multiplier, instant mode, automated bets and 99% theoretical return before display rounding.
- Crash: animated multiplier graph, manual and automatic cashout.
- Blackjack: hit, stand, double, 3:2 blackjack and dealer stands on 17.
- European Roulette: red, black, single zero and straight number bets.
- Slots: three reels with a visible paytable.

Fresh saves start with 1,000 simulated STK. The Wallet grants free refills. Balances, history and settings are saved locally under `steak.rebuild.v1`, separate from previous versions. Leaving a game refunds any unresolved bets. No external fonts or image services are required.

## Run

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. No package installation or build step is required. GitHub Pages deployment uses the existing workflow.

## Scope

All credits have no monetary value. There are no payment systems, crypto transfers, deposits, withdrawals or real-money wagers. This independent implementation does not reproduce Stake's proprietary source, hosted games, accounts, multiplayer services or provably-fair seed protocol. Random values come from `crypto.getRandomValues` in the browser.
