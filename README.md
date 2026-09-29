# Steak

Steak is a fictional, browser-only **play-money casino simulator**. It is not affiliated with Stake or any gambling operator.

## What is included

- Dedicated animated game screens for:
  - Plinko
  - European Roulette
  - Blackjack 21
  - Mines
  - Crash
  - Dice
  - Limbo
  - Coin Flip
  - Cases + local inventory
  - Cups
  - Three slot-machine themes
  - Chicken
- Modular front-end architecture under `assets/js/` and `assets/styles/`
- Local browser progress saving with migration from older Steak saves
- Fresh browsers start with **5.00 play credits**
- Hidden local admin menu: click the Steak logo five times
- Responsive desktop/tablet/mobile navigation
- Web Audio feedback and game-specific animations
- Apple-device translucent/glass treatment using CSS backdrop filters

## Play-money only

Credits have no cash value. The project includes no deposits, withdrawals, payment processing, crypto transfers, or real-money wagering.

## Running locally

Serve the repository over HTTP so ES modules load correctly, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

GitHub Pages deployment is configured in `.github/workflows/pages.yml`.
