import { mountGame } from "./games.js";
const KEY = "steak.rebuild.v1";
const fresh = () => ({
  balance: 1000,
  history: [],
  sound: true,
  instant: false,
});
let saved;
try {
  saved = JSON.parse(localStorage.getItem(KEY));
} catch {}
export const data = { ...fresh(), ...saved };
if (!Number.isFinite(data.balance) || data.balance < 0) data.balance = 1000;
if (!Array.isArray(data.history)) data.history = [];
export const money = (n) =>
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export const random = () => {
  const v = new Uint32Array(1);
  crypto.getRandomValues(v);
  return v[0] / 4294967296;
};
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
  const b = document.querySelector("#balance");
  if (b) b.textContent = money(data.balance);
  renderHistory();
}
export function take(n) {
  if (!Number.isFinite(n) || n < 0.01 || n > data.balance) {
    toast("Enter a valid bet within your play balance.");
    return false;
  }
  data.balance = Math.round((data.balance - n) * 100) / 100;
  save();
  return true;
}
export function settle(game, bet, payout, result) {
  data.balance = Math.round((data.balance + payout) * 100) / 100;
  data.history.unshift({ game, bet, payout, result, at: Date.now() });
  data.history = data.history.slice(0, 100);
  save();
  sound(payout >= bet ? 650 : 160);
  return payout - bet;
}
let toastTimer, audio;
export function toast(t) {
  const e = document.querySelector("#toast");
  e.textContent = t;
  e.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (e.style.display = "none"), 3000);
}
export function sound(freq = 400) {
  if (!data.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.connect(g);
    g.connect(audio.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
    o.start();
    o.stop(audio.currentTime + 0.13);
  } catch {}
}
export function dialog(title, html, bind) {
  const e = document.querySelector("#dialog");
  e.innerHTML = `<button class="close" aria-label="Close dialog">×</button><h2>${title}</h2>${html}`;
  e.querySelector(".close").onclick = () => e.close();
  e.showModal();
  bind?.(e);
}
const games = [
  {
    id: "dice",
    name: "Dice",
    symbol: "⚄",
    color: "#195cc1",
    category: "originals",
    description:
      "Choose your win chance and roll under or over the target. The payout is 99 divided by the win chance.",
  },
  {
    id: "mines",
    name: "Mines",
    symbol: "◆",
    color: "#238f71",
    category: "originals",
    description:
      "Reveal gems on a 5 × 5 board. Cash out your growing multiplier before you uncover a mine.",
  },
  {
    id: "plinko",
    name: "Plinko",
    symbol: "⠿",
    color: "#da3860",
    category: "originals",
    description:
      "Choose rows and risk, then drop balls through the peg pyramid. Every ball lands in a multiplier bucket.",
  },
  {
    id: "limbo",
    name: "Limbo",
    symbol: "∞",
    color: "#7152c6",
    category: "originals",
    description:
      "Set a target multiplier and bet. Win when the random multiplier meets or exceeds your target.",
  },
  {
    id: "crash",
    name: "Crash",
    symbol: "↗",
    color: "#a54dbe",
    category: "originals",
    description:
      "Cash out while the multiplier rises. If it crashes first, the play bet is lost.",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    symbol: "♠",
    color: "#db6537",
    category: "table",
    description:
      "Beat the dealer without exceeding 21. Hit, stand, or double. Blackjack pays 3:2; the dealer stands on 17.",
  },
  {
    id: "roulette",
    name: "Roulette",
    symbol: "◉",
    color: "#369692",
    category: "table",
    description:
      "European roulette with a single zero. Bet on red, black, green, or a specific number.",
  },
  {
    id: "slots",
    name: "Slots",
    symbol: "777",
    color: "#a03686",
    category: "slots",
    description:
      "Spin three reels. Matching symbols pay multipliers; three diamonds return 50× your bet.",
  },
];
let dispose = () => {},
  filter = "all";
const nav = (icon, text, attrs) =>
  `<button ${attrs}><span class="nav-icon">${icon}</span>${text}</button>`;
const app = document.querySelector("#app");
app.innerHTML = `<header><div class="head-left"><button class="menu" id="menu" aria-label="Toggle navigation">☰</button><a class="brand" href="#/">Stake</a></div><div class="balance"><span id="balance">${money(data.balance)}</span><span title="Simulated currency">◉ STK</span><button class="wallet" id="wallet">Wallet</button></div><div class="head-right"><span class="tag">UNOFFICIAL · PLAY MONEY</span><button class="menu" id="settings" aria-label="Settings">⚙</button></div></header><aside class="sidebar"><div class="nav-pills"><button class="active" data-home="all">Casino</button></div><div class="nav-group">${nav("⌂", "Lobby", 'data-home="all"')}${nav("◆", "Stake Originals", 'data-home="originals"')}${nav("♠", "Table Games", 'data-home="table"')}${nav("▥", "Slots", 'data-home="slots"')}</div><div class="nav-group">${nav("↗", "Crash", 'data-game="crash"')}${nav("⚄", "Dice", 'data-game="dice"')}${nav("⠿", "Plinko", 'data-game="plinko"')}${nav("◆", "Mines", 'data-game="mines"')}</div><div class="nav-group">${nav("◷", "My Bets", 'id="mybets"')}${nav("▣", "Wallet", 'id="sidewallet"')}${nav("ⓘ", "About this simulator", 'id="about"')}</div><p class="sidebar-note">Play credits have no cash value.<br>Independent fan simulation.<br>Not affiliated with Stake.com.</p></aside><main id="main"></main><nav class="mobile-nav"><button id="browse"><b>☰</b>Browse</button><button data-home="all"><b>⌂</b>Casino</button><button data-home="originals"><b>◆</b>Originals</button><button id="mobileWallet"><b>▣</b>Wallet</button></nav>`;
function openWallet() {
  dialog(
    "Wallet",
    `<span class="tag">SIMULATED STK</span><p>Your balance</p><div class="stage-result" style="font-size:38px">${money(data.balance)}</div><p>Top up for free. Credits cannot be bought, transferred, or withdrawn.</p><button class="bet" id="claim">Claim 1,000 play credits</button>`,
    (e) =>
      (e.querySelector("#claim").onclick = () => {
        data.balance = Math.round((data.balance + 1000) * 100) / 100;
        save();
        e.close();
        toast("1,000 play credits added");
      }),
  );
}
for (const id of ["wallet", "sidewallet", "mobileWallet"])
  document.getElementById(id).onclick = openWallet;
document.querySelector("#about").onclick = () =>
  dialog(
    "About this simulator",
    "<p>An independent browser-only fan simulation using the Stake name as a reference. Not an official Stake service.</p><p>No accounts, real deposits, crypto transfers, cash prizes, or withdrawals. Progress is saved in this browser. Games use browser-generated randomness and are not Stake’s proprietary implementations.</p>",
  );
document.querySelector("#settings").onclick = () =>
  dialog(
    "Settings",
    `<label class="switch"><input type="checkbox" id="sound" ${data.sound ? "checked" : ""}>Sound effects</label><p></p><label class="switch"><input type="checkbox" id="instant" ${data.instant ? "checked" : ""}>Instant Dice and Limbo results</label>`,
    (e) => {
      e.querySelector("#sound").onchange = (x) => {
        data.sound = x.target.checked;
        save();
      };
      e.querySelector("#instant").onchange = (x) => {
        data.instant = x.target.checked;
        save();
      };
    },
  );
document.querySelector("#menu").onclick = () => {
  document.body.classList.toggle(
    innerWidth <= 650 ? "mobile-sidebar" : "collapsed",
  );
};
document.querySelector("#browse").onclick = () =>
  document.body.classList.toggle("mobile-sidebar");
function goHome(v) {
  filter = v;
  location.hash = "#/";
  if (location.hash === "#/") route();
}
document
  .querySelectorAll("[data-home]")
  .forEach((e) => (e.onclick = () => goHome(e.dataset.home)));
document
  .querySelectorAll("[data-game]")
  .forEach(
    (e) => (e.onclick = () => (location.hash = "#/game/" + e.dataset.game)),
  );
document.querySelector("#mybets").onclick = () => {
  goHome("all");
  document.querySelector(".history").scrollIntoView({ behavior: "smooth" });
};
function card(g) {
  return `<button class="card" data-open="${g.id}" data-name="${g.name.toLowerCase()}" aria-label="Play ${g.name}"><div class="cover" style="--color:${g.color}"><strong>${g.name.toUpperCase()}</strong><span class="symbol">${g.symbol}</span><small>${g.category === "originals" ? "STAKE ORIGINALS" : "CASINO CLASSICS"}</small></div><div class="card-meta"><span>Play-money simulation</span><i>●</i></div></button>`;
}
function history() {
  return `<section class="history"><div class="history-tabs"><button class="active">My Bets</button><span class="muted" style="align-self:center;font-size:12px">Your browser’s bet history</span></div><div class="table-wrap"><table><thead><tr><th>Game</th><th>Time</th><th>Bet Amount</th><th>Multiplier</th><th>Payout</th></tr></thead><tbody id="history"></tbody></table></div></section>`;
}
function renderHistory() {
  const el = document.querySelector("#history");
  if (!el) return;
  el.innerHTML =
    data.history
      .slice(0, 12)
      .map(
        (h) =>
          `<tr><td>${h.game}</td><td class="muted">${new Date(h.at).toLocaleTimeString("en-GB")}</td><td>${money(h.bet)} ◉</td><td>${(h.bet ? h.payout / h.bet : 0).toFixed(2)}×</td><td class="${h.payout > h.bet ? "win" : h.payout < h.bet ? "loss" : ""}">${money(h.payout)} ◉</td></tr>`,
      )
      .join("") ||
    '<tr><td class="empty" colspan="5">Your bets will appear here. Choose a game to begin.</td></tr>';
}
function lobby() {
  const main = document.querySelector("#main");
  main.innerHTML = `<div class="page-title"><h1>♠ Casino</h1><span class="tag">PLAY MONEY SIMULATOR</span></div><section class="promos"><button class="promo" data-open="plinko"><small>STAKE ORIGINALS</small><h2>Play your<br>favourites.</h2><p>Drop into a world of Originals.</p><b>Play now</b><span class="promo-symbol">⠿</span></button><button class="promo" data-open="blackjack"><small>THE CLASSICS</small><h2>Your seat<br>at the table.</h2><p>Blackjack & European Roulette.</p><b>Explore games</b><span class="promo-symbol">♠</span></button><button class="promo" data-open="mines"><small>PLAY WITHOUT LIMITS</small><h2>All the thrill.<br>Play credits.</h2><p>Find gems. Build your multiplier.</p><b>Play Mines</b><span class="promo-symbol">◆</span></button></section><label class="search"><span>⌕</span><input id="search" placeholder="Search your game" aria-label="Search games" autocomplete="off"></label><nav class="categories">${[
    ["all", "⌂ Lobby"],
    ["originals", "◆ Stake Originals"],
    ["table", "♠ Table Games"],
    ["slots", "▥ Slots"],
  ]
    .map(
      ([k, n]) =>
        `<button data-filter="${k}" class="${filter === k ? "active" : ""}">${n}</button>`,
    )
    .join(
      "",
    )}</nav><div id="shelves"></div>${history()}<footer><span class="brand">Stake</span><p>Unofficial play-money simulator · Repository: Steak</p><p>Not affiliated with Stake.com. Simulated STK credits have no cash value.</p></footer>`;
  function shelves(query = "") {
    const shown = games.filter(
      (g) =>
        (filter === "all" || g.category === filter) &&
        g.name.toLowerCase().includes(query.toLowerCase()),
    );
    document.querySelector("#shelves").innerHTML =
      ["originals", "table", "slots"]
        .map((cat) => {
          const group = shown.filter((g) => g.category === cat);
          return group.length
            ? `<section><div class="section-heading"><h2>${cat === "originals" ? "◆ Stake Originals" : cat === "table" ? "♠ Table Games" : "▥ Slots"}</h2><span>${group.length} games</span></div><div class="cards">${group.map(card).join("")}</div></section>`
            : "";
        })
        .join("") || '<p class="empty">No games match your search.</p>';
    bindOpen();
  }
  function bindOpen() {
    main
      .querySelectorAll("[data-open]")
      .forEach(
        (e) => (e.onclick = () => (location.hash = "#/game/" + e.dataset.open)),
      );
  }
  main.querySelectorAll("[data-filter]").forEach(
    (e) =>
      (e.onclick = () => {
        filter = e.dataset.filter;
        main
          .querySelectorAll("[data-filter]")
          .forEach((b) => b.classList.toggle("active", b === e));
        shelves(main.querySelector("#search").value);
      }),
  );
  main.querySelector("#search").oninput = (e) => shelves(e.target.value);
  shelves();
  renderHistory();
  bindOpen();
}
function route() {
  dispose();
  dispose = () => {};
  document.body.classList.remove("mobile-sidebar");
  const id = location.hash.split("/")[2],
    g = games.find((g) => g.id === id);
  document
    .querySelectorAll(".nav-group button")
    .forEach((e) => e.classList.toggle("active", e.dataset.game === id));
  if (g) {
    const main = document.querySelector("#main");
    dispose =
      mountGame(main, g, {
        data,
        money,
        random,
        take,
        settle,
        toast,
        sound,
        dialog,
      }) || (() => {});
    main.insertAdjacentHTML(
      "beforeend",
      `<section class="game-description"><h2>${g.name}</h2><p>${g.description}</p><p style="margin-top:10px">Independent simulation • Play credits only • No cash value</p></section>${history()}`,
    );
    renderHistory();
  } else lobby();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();
