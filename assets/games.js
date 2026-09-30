const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function mountGame(root, game, api) {
  const { data, money, random, take, settle, toast, sound, dialog } = api;
  let alive = true,
    busy = false,
    auto = false,
    raf = 0,
    stopRequested = false;
  const pending = new Map();
  let wagerId = 0;
  const $ = (s) => root.querySelector(s),
    $$ = (s) => root.querySelectorAll(s);
  function wager(b) {
    b = Math.round(b * 100) / 100;
    if (!take(b)) return null;
    const id = ++wagerId;
    pending.set(id, b);
    return id;
  }
  function finish(id, payout, result) {
    if (!pending.has(id)) return;
    const b = pending.get(id);
    pending.delete(id);
    return settle(game.name, b, payout, result);
  }
  const autoSupported = ["dice", "limbo"].includes(game.id);
  root.innerHTML = `<div class="breadcrumb"><span><a href="#/">Casino</a> / <b>${game.name}</b></span><span>Play money</span></div><div class="game-room"><section class="controls"><div class="tabs"><button class="active" data-tab="manual">Manual</button>${autoSupported ? '<button data-tab="auto">Auto</button>' : ""}</div><div class="field"><label>Bet Amount <span>STK</span></label><div class="bet-row"><input id="betAmount" type="number" min="0.01" step=".01" value="1.00" aria-label="Bet amount"><button id="half" aria-label="Half bet">½</button><button id="double" aria-label="Double bet">2×</button></div></div><div id="gameControls"></div><div class="auto-options" hidden><div class="field"><label>Number of Bets <span>0 = continuous</span></label><input id="autoCount" type="number" min="0" max="10000" step="1" value="10"></div><div class="field"><label>On Win <span>Increase by %</span></label><input id="onWin" type="number" min="0" max="100" value="0"></div><div class="field"><label>On Loss <span>Increase by %</span></label><input id="onLoss" type="number" min="0" max="100" value="0"></div><div class="field"><label>Stop on Profit <span>0 = disabled</span></label><input id="stopProfit" type="number" min="0" value="0"></div><div class="field"><label>Stop on Loss <span>0 = disabled</span></label><input id="stopLoss" type="number" min="0" value="0"></div></div><button class="bet" id="bet">Bet</button><p class="hint">Simulated STK. No deposits or withdrawals.<br>Progress saved in this browser.</p></section><section class="stage" id="stage"></section></div><div class="game-toolbar"><span class="brand" style="font-size:26px">Stake</span><button id="soundToggle">${data.sound ? "♫ Sound on" : "♫ Sound off"}</button><button id="fairness">Fairness ⓘ</button></div>`;
  $("#soundToggle").onclick = (e) => {
    data.sound = !data.sound;
    try {
      localStorage.setItem("steak.rebuild.v1", JSON.stringify(data));
    } catch {}
    e.target.textContent = data.sound ? "♫ Sound on" : "♫ Sound off";
  };
  $("#fairness").onclick = () =>
    dialog(
      "Randomness & game rules",
      "<p>This independent simulator uses crypto.getRandomValues in your browser. Results are generated locally.</p><p>This is not Stake’s provably-fair system. There are no server seeds, blockchain transactions, or externally verifiable wagers.</p><p>Unfinished bets are refunded if you leave a game. Simulated credits have no cash value.</p>",
    );
  const amount = () => Number($("#betAmount").value);
  $("#half").onclick = () => {
    if (!busy && !auto)
      $("#betAmount").value = Math.max(
        0.01,
        Math.floor(amount() * 50) / 100,
      ).toFixed(2);
  };
  $("#double").onclick = () => {
    if (!busy && !auto)
      $("#betAmount").value = Math.min(data.balance, amount() * 2).toFixed(2);
  };
  const field = (label, id, val, min, max, step = ".01") =>
    `<div class="field"><label>${label}</label><input id="${id}" type="number" value="${val}" min="${min}" max="${max}" step="${step}"></div>`;
  function lock(on) {
    busy = on;
    $("#betAmount").disabled = on || auto;
    $$(
      "#gameControls input,#gameControls select,#stage input,#direction,#half,#double,[data-tab]",
    ).forEach((e) => (e.disabled = on || auto));
  }
  function pills(value, win) {
    const e = $("#pills");
    if (!e) return;
    const p = document.createElement("span");
    p.textContent = value;
    p.className = win ? "win" : "";
    e.prepend(p);
    while (e.children.length > 6) e.lastChild.remove();
  }
  function result(txt, win) {
    const s = $("#status");
    if (s) {
      s.textContent = txt;
      s.className =
        "round-status " + (win === true ? "win" : win === false ? "loss" : "");
    }
  }
  let play;
  if (game.id === "dice") {
    $("#gameControls").innerHTML =
      `<div class="field"><label>Profit on Win <span>STK</span></label><input id="profit" readonly value="1.00"></div>`;
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><div class="dice-area"><div class="dice-labels"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div><div class="dice-bar" id="dicebar" style="--point:49.5%"><span class="dice-result" id="roll">50.00</span><input id="slider" aria-label="Roll target" type="range" min="2" max="98" step=".01" value="49.5"></div></div><div class="metrics"><div class="metric"><label>Multiplier</label><input id="multiplier" type="number" min="1.0102" max="49.5" step=".0001" value="2.0000"></div><div class="metric"><label><button id="direction" style="padding:0;background:transparent">Roll Under ⇄</button></label><input id="target" type="number" min="2" max="98" step=".01" value="49.50"></div><div class="metric"><label>Win Chance</label><input id="chance" type="number" min="2" max="98" step=".01" value="49.50"></div></div><p class="round-status" id="status">Set your chance. Place your bet.</p>`;
    let over = false,
      chance = 49.5;
    function sync(c) {
      if (busy || auto) return;
      chance = Math.min(98, Math.max(2, Number(c) || 49.5));
      const t = over ? 100 - chance : chance;
      $("#slider").value = t;
      $("#target").value = t.toFixed(2);
      $("#chance").value = chance.toFixed(2);
      $("#multiplier").value = (99 / chance).toFixed(4);
      $("#profit").value = money(amount() * (99 / chance - 1));
      $("#dicebar").style.setProperty("--point", t + "%");
      $("#dicebar").classList.toggle("over", over);
    }
    $("#slider").oninput = (e) =>
      sync(over ? 100 - +e.target.value : +e.target.value);
    $("#target").onchange = (e) =>
      sync(over ? 100 - +e.target.value : +e.target.value);
    $("#chance").onchange = (e) => sync(e.target.value);
    $("#multiplier").onchange = (e) => sync(99 / +e.target.value);
    $("#direction").onclick = () => {
      if (busy || auto) return;
      over = !over;
      $("#direction").textContent = over ? "Roll Over ⇄" : "Roll Under ⇄";
      sync(chance);
    };
    $("#betAmount").oninput = () => sync(chance);
    sync(chance);
    play = async () => {
      if (busy) return null;
      const a = amount(),
        id = wager(a);
      if (id === null) return null;
      const target = over ? 100 - chance : chance,
        mode = over,
        m = 99 / chance;
      lock(true);
      $("#bet").disabled = !auto;
      await sleep(data.instant ? 0 : 180);
      if (!alive) return null;
      const roll = Math.floor(random() * 10000) / 100,
        win = mode ? roll > target : roll < target;
      $("#roll").textContent = roll.toFixed(2);
      $("#roll").style.left = Math.max(3, Math.min(97, roll)) + "%";
      $("#roll").style.color = win ? "#109c34" : "#d73150";
      const profit = finish(id, win ? a * m : 0, roll.toFixed(2));
      result(win ? `Profit ${money(profit)} STK` : `Lost ${money(a)} STK`, win);
      pills(roll.toFixed(2), win);
      lock(false);
      $("#bet").disabled = false;
      return win;
    };
  }
  if (game.id === "limbo") {
    $("#gameControls").innerHTML =
      field("Target Multiplier", "target", 2, 1.01, 1000000) +
      `<div class="field" style="margin-top:16px"><label>Profit on Win</label><input id="profit" readonly value="1.00"></div>`;
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><div class="stage-result" id="limbo">1.00×</div><p class="round-status" id="status">Beat your target multiplier.</p><div class="metrics" style="grid-template-columns:1fr 1fr"><div class="metric"><label>Target Multiplier</label><input id="displayTarget" readonly value="2.00×"></div><div class="metric"><label>Win Chance</label><input id="displayChance" readonly value="49.50%"></div></div>`;
    const sync = () => {
      let t = Math.min(1000000, Math.max(1.01, +$("#target").value || 2));
      $("#target").value = t;
      $("#displayTarget").value = t.toFixed(2) + "×";
      $("#displayChance").value = (99 / t).toFixed(6) + "%";
      $("#profit").value = money(amount() * (t - 1));
    };
    $("#target").onchange = sync;
    $("#betAmount").oninput = sync;
    play = async () => {
      if (busy) return null;
      sync();
      const a = amount(),
        t = +$("#target").value,
        id = wager(a);
      if (id === null) return null;
      lock(true);
      $("#bet").disabled = !auto;
      const outcome = Math.max(
        1,
        Math.floor((0.99 / (1 - random())) * 100) / 100,
      );
      if (!data.instant) {
        for (let i = 1; i <= 12; i++) {
          if (!alive) return null;
          $("#limbo").textContent =
            (1 + ((outcome - 1) * i) / 12).toFixed(2) + "×";
          await sleep(20);
        }
      }
      if (!alive) return null;
      $("#limbo").textContent = outcome.toFixed(2) + "×";
      const win = outcome >= t,
        p = finish(id, win ? a * t : 0, outcome.toFixed(2) + "×");
      $("#limbo").className = "stage-result " + (win ? "win" : "loss");
      result(win ? `Profit ${money(p)} STK` : "Target missed", win);
      pills(outcome.toFixed(2) + "×", win);
      lock(false);
      $("#bet").disabled = false;
      return win;
    };
  }
  if (game.id === "mines") {
    $("#gameControls").innerHTML =
      `<div class="field"><label>Mines <span>25 tiles</span></label><select id="mineCount">${Array.from({ length: 24 }, (_, i) => `<option ${i === 2 ? "selected" : ""}>${i + 1}</option>`).join("")}</select></div><div class="field" style="margin-top:16px"><label>Total Profit <span id="minemult">1.00×</span></label><input id="profit" readonly value="0.00"></div><button class="blue" style="width:100%;margin-top:16px" id="randomTile">Pick random tile</button>`;
    $("#stage").innerHTML =
      `<div class="mines-grid">${Array.from({ length: 25 }, (_, i) => `<button class="tile" data-tile="${i}" aria-label="Reveal tile ${i + 1}"></button>`).join("")}</div><p class="round-status" id="status">Select your mines and place a bet.</p>`;
    let round = null;
    function multiplier() {
      if (!round || !round.revealed.size) return 1;
      let prob = 1;
      for (let i = 0; i < round.revealed.size; i++)
        prob *= (25 - round.count - i) / (25 - i);
      return 0.99 / prob;
    }
    function revealAll() {
      for (const b of $$("[data-tile]")) {
        const mine = round.mines.has(+b.dataset.tile);
        b.textContent = mine ? "✹" : "◆";
        b.classList.add(mine ? "bomb" : "safe");
        if (!round.revealed.has(+b.dataset.tile)) b.classList.add("faded");
      }
    }
    function end(win) {
      const m = multiplier(),
        a = round.bet;
      revealAll();
      finish(round.id, win ? a * m : 0, win ? m.toFixed(2) + "×" : "Mine hit");
      result(
        win
          ? `Cashed out ${money(a * m)} STK · ${m.toFixed(2)}×`
          : "Mine hit. Better luck next round.",
        win,
      );
      round = null;
      lock(false);
      $("#bet").textContent = "Bet";
      $("#bet").disabled = false;
    }
    function reveal(index) {
      if (!round || round.revealed.has(index)) return;
      const b = $(`[data-tile="${index}"]`);
      round.revealed.add(index);
      if (round.mines.has(index)) {
        end(false);
        return;
      }
      b.textContent = "◆";
      b.classList.add("safe");
      sound(500);
      const m = multiplier();
      $("#minemult").textContent = m.toFixed(2) + "×";
      $("#profit").value = money(round.bet * (m - 1));
      $("#bet").disabled = false;
      if (round.revealed.size === 25 - round.count) end(true);
    }
    $$("[data-tile]").forEach(
      (b) => (b.onclick = () => reveal(+b.dataset.tile)),
    );
    $("#randomTile").onclick = () => {
      if (!round) return;
      const tiles = Array.from({ length: 25 }, (_, i) => i).filter(
        (i) => !round.revealed.has(i),
      );
      reveal(tiles[Math.floor(random() * tiles.length)]);
    };
    play = () => {
      if (round) {
        end(true);
        return;
      }
      const a = amount(),
        id = wager(a);
      if (id === null) return;
      const count = +$("#mineCount").value,
        mines = new Set();
      while (mines.size < count) mines.add(Math.floor(random() * 25));
      round = { id, bet: a, count, mines, revealed: new Set() };
      $$("[data-tile]").forEach((b) => {
        b.textContent = "";
        b.className = "tile";
      });
      lock(true);
      $("#bet").textContent = "Cashout";
      $("#bet").disabled = true;
      $("#profit").value = "0.00";
      $("#minemult").textContent = "1.00×";
      result("Pick a tile to reveal a gem.");
    };
  }
  if (game.id === "plinko") {
    $("#gameControls").innerHTML =
      `<div class="field"><label>Risk</label><select id="risk"><option>Low</option><option>Medium</option><option selected>High</option></select></div><div class="field" style="margin-top:16px"><label>Rows</label><select id="rows">${Array.from({ length: 9 }, (_, i) => `<option ${i === 8 ? "selected" : ""}>${i + 8}</option>`).join("")}</select></div>`;
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><canvas class="canvas" id="canvas" width="800" height="580" aria-label="Animated Plinko peg board"></canvas><p class="round-status" id="status">Drop a ball through the pyramid.</p>`;
    const ctx = $("#canvas").getContext("2d"),
      balls = [];
    let rows = 16,
      table = [];
    const high = {
      8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      9: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
      10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
      11: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
      12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
      13: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
      14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
      15: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
      16: [
        1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000,
      ],
    };
    function binomial(n, k) {
      let v = 1;
      for (let i = 1; i <= k; i++) v = (v * (n - i + 1)) / i;
      return v / 2 ** n;
    }
    function settings() {
      rows = +$("#rows").value;
      const risk = $("#risk").value;
      if (risk === "High") table = high[rows];
      else {
        const edge = risk === "Low" ? 5 : 35,
          center = risk === "Low" ? 0.5 : 0.3;
        const raw = Array.from(
          { length: rows + 1 },
          (_, i) =>
            center +
            (edge - center) *
              Math.abs((i - rows / 2) / (rows / 2)) ** (risk === "Low" ? 3 : 5),
        );
        const expected = raw.reduce((s, v, i) => s + v * binomial(rows, i), 0);
        table = raw.map((v) => (v * 0.99) / expected);
      }
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, 800, 580);
      const gap = 36,
        top = 38;
      for (let r = 0; r < rows; r++)
        for (let j = 0; j < r + 3; j++) {
          ctx.beginPath();
          ctx.arc(
            400 + (j - (r + 2) / 2) * gap,
            top + r * 28,
            3.5,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = "#dce5ee";
          ctx.fill();
        }
      const y = top + rows * 28 + 5;
      table.forEach((v, i) => {
        const d = Math.abs(i - rows / 2) / (rows / 2),
          x = 400 + (i - rows / 2) * gap;
        ctx.fillStyle = `hsl(${42 * (1 - d)} 95% 54%)`;
        ctx.beginPath();
        ctx.roundRect(x - 16, y, 32, 30, 5);
        ctx.fill();
        ctx.fillStyle = "#361407";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          (v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(".0", "")) + "×",
          x,
          y + 19,
        );
      });
      for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff315a";
        ctx.fill();
      }
    }
    function tick(now) {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i],
          t = Math.min(1, (now - b.started) / 1500),
          segment = Math.min(rows - 1, Math.floor(t * rows)),
          local = t * rows - segment;
        let rights = 0;
        for (let j = 0; j < segment; j++) rights += b.path[j];
        b.x =
          400 + (rights - segment / 2 + (b.path[segment] - 0.5) * local) * 36;
        b.y = 38 + (segment + local) * 28 - Math.sin(local * Math.PI) * 6;
        if (t === 1) {
          const bucket = b.path.reduce((s, x) => s + x, 0),
            m = b.table[bucket];
          finish(b.id, b.bet * m, m.toFixed(2) + "×");
          pills(m.toFixed(2) + "×", m > 1);
          result(`${m.toFixed(2)}× · ${money(b.bet * m)} STK`, m > 1);
          balls.splice(i, 1);
        }
      }
      draw();
      if (balls.length) raf = requestAnimationFrame(tick);
      else {
        lock(false);
        $("#bet").textContent = "Bet";
      }
    }
    $("#rows").onchange = settings;
    $("#risk").onchange = settings;
    settings();
    play = () => {
      if (balls.length >= 30) {
        toast("Wait for a ball to land.");
        return;
      }
      const a = amount(),
        id = wager(a);
      if (id === null) return;
      balls.push({
        id,
        bet: a,
        table: [...table],
        path: Array.from({ length: rows }, () => (random() < 0.5 ? 0 : 1)),
        started: performance.now(),
        x: 400,
        y: 10,
      });
      if (balls.length === 1) {
        lock(true);
        raf = requestAnimationFrame(tick);
      }
      $("#bet").textContent = `Bet · ${balls.length} balls`;
    };
  }
  if (game.id === "crash") {
    $("#gameControls").innerHTML = field(
      "Auto Cashout",
      "cashout",
      2,
      1.01,
      1000,
    );
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><canvas class="canvas" id="canvas" width="800" height="560"></canvas><div class="stage-result" id="crashValue" style="position:absolute;top:38%">1.00×</div><p class="round-status" id="status">Cash out before the multiplier crashes.</p>`;
    const ctx = $("#canvas").getContext("2d");
    let round = null;
    function draw(t, m) {
      ctx.clearRect(0, 0, 800, 560);
      ctx.strokeStyle = "#213743";
      ctx.lineWidth = 1;
      for (let y = 80; y < 560; y += 80) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(780, y);
        ctx.stroke();
      }
      ctx.font = "12px Arial";
      ctx.fillStyle = "#b1bad3";
      ctx.fillText("0s", 35, 545);
      ctx.fillText(t.toFixed(1) + "s", 710, 545);
      if (!t) return;
      ctx.beginPath();
      ctx.moveTo(35, 520);
      for (let i = 0; i <= 100; i++) {
        const x = i / 100,
          s = t * x,
          mv = Math.exp(s * 0.14);
        ctx.lineTo(35 + x * 700, 520 - ((mv - 1) / (m - 1 || 1)) * 410);
      }
      ctx.strokeStyle = "#00e701";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.lineTo(735, 520);
      ctx.closePath();
      ctx.fillStyle = "#00e70118";
      ctx.fill();
    }
    function end(win, m) {
      const a = round.bet;
      finish(round.id, win ? a * m : 0, m.toFixed(2) + "×");
      $("#crashValue").textContent = m.toFixed(2) + "×";
      $("#crashValue").className = "stage-result " + (win ? "win" : "loss");
      pills(m.toFixed(2) + "×", win);
      result(
        win ? `Cashed out ${money(a * m)} STK` : `Crashed at ${m.toFixed(2)}×`,
        win,
      );
      round = null;
      cancelAnimationFrame(raf);
      lock(false);
      $("#bet").textContent = "Bet";
    }
    function tick() {
      if (!round || !alive) return;
      const t = (performance.now() - round.started) / 1000,
        m = Math.exp(t * 0.14);
      if (m >= round.point) {
        draw(t, round.point);
        end(false, round.point);
        return;
      }
      if (round.auto > 1 && m >= round.auto) {
        draw(t, round.auto);
        end(true, round.auto);
        return;
      }
      draw(t, m);
      $("#crashValue").textContent = m.toFixed(2) + "×";
      raf = requestAnimationFrame(tick);
    }
    play = () => {
      if (round) {
        const m = Math.exp(((performance.now() - round.started) / 1000) * 0.14);
        end(m < round.point, Math.min(m, round.point));
        return;
      }
      const a = amount(),
        id = wager(a);
      if (id === null) return;
      round = {
        id,
        bet: a,
        point: Math.max(1, Math.floor((0.99 / (1 - random())) * 100) / 100),
        auto: +$("#cashout").value,
        started: performance.now(),
      };
      lock(true);
      $("#bet").textContent = "Cashout";
      $("#crashValue").className = "stage-result";
      tick();
    };
    draw(0, 1);
  }
  if (game.id === "roulette") {
    $("#gameControls").innerHTML =
      `<div class="field"><label>Bet Type</label><select id="betType"><option value="red">Red · 2×</option><option value="black">Black · 2×</option><option value="green">Zero · 36×</option><option value="number">Number · 36×</option></select></div><div style="margin-top:16px" id="numberField" hidden>${field("Number", "number", 0, 0, 36, "1")}</div>`;
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><span class="roulette-pointer">▼</span><div class="roulette-wheel" id="wheel"><span class="roulette-center" id="numberResult">0</span></div><div class="selection"><button data-color="red" class="active">Red</button><button data-color="black">Black</button><button data-color="green">Zero</button></div><p class="round-status" id="status">Place your bet and spin.</p>`;
    let rotation = 0;
    const reds = new Set([
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ]);
    $("#betType").onchange = () => {
      $("#numberField").hidden = $("#betType").value !== "number";
      $$("[data-color]").forEach((b) =>
        b.classList.toggle("active", b.dataset.color === $("#betType").value),
      );
    };
    $$("[data-color]").forEach(
      (b) =>
        (b.onclick = () => {
          if (busy) return;
          $("#betType").value = b.dataset.color;
          $("#betType").onchange();
        }),
    );
    play = async () => {
      if (busy) return;
      const a = amount(),
        type = $("#betType").value,
        n = +$("#number").value;
      if (type === "number" && (!Number.isInteger(n) || n < 0 || n > 36)) {
        toast("Pick a number from 0 to 36");
        return;
      }
      const id = wager(a);
      if (id === null) return;
      lock(true);
      $("#bet").disabled = true;
      const num = Math.floor(random() * 37),
        color = num === 0 ? "green" : reds.has(num) ? "red" : "black";
      rotation += 1440 + random() * 360;
      $("#wheel").style.transform = `rotate(${rotation}deg)`;
      $("#numberResult").style.transform = `rotate(${-rotation}deg)`;
      await sleep(1850);
      if (!alive) return;
      $("#numberResult").textContent = num;
      $("#numberResult").style.color =
        color === "red" ? "#ff5479" : color === "green" ? "#00e701" : "#fff";
      const win = type === "number" ? num === n : color === type,
        m = type === "number" || type === "green" ? 36 : 2;
      finish(id, win ? a * m : 0, String(num));
      pills(String(num), win);
      result(
        `${num} · ${color} · ${win ? "Won " + money(a * m) + " STK" : "No win"}`,
        win,
      );
      lock(false);
      $("#bet").disabled = false;
    };
  }
  if (game.id === "blackjack") {
    $("#gameControls").innerHTML =
      `<div class="selection"><button id="hit" disabled>Hit</button><button id="stand" disabled>Stand</button></div><button id="doubleDown" class="blue" style="width:100%;margin-top:12px" disabled>Double</button>`;
    $("#stage").innerHTML =
      `<div class="hand-label">Dealer <b id="dealerScore"></b></div><div class="card-hand" id="dealer"></div><p class="round-status" id="status">Place a bet to deal.</p><div class="card-hand" id="player"></div><div class="hand-label">Your hand <b id="playerScore"></b></div>`;
    let round = null;
    function card() {
      const rank = Math.floor(random() * 13) + 1,
        suit = ["♠", "♥", "♦", "♣"][Math.floor(random() * 4)];
      return { rank, suit };
    }
    function score(cards) {
      let sum = 0,
        aces = 0;
      for (const c of cards) {
        sum += c.rank === 1 ? 11 : Math.min(10, c.rank);
        if (c.rank === 1) aces++;
      }
      while (sum > 21 && aces-- > 0) sum -= 10;
      return sum;
    }
    function renderHand(cards, hide = false) {
      return cards
        .map((c, i) =>
          hide && i === 1
            ? '<div class="playing-card back"> </div>'
            : `<div class="playing-card ${c.suit === "♥" || c.suit === "♦" ? "red" : ""}">${{ 1: "A", 11: "J", 12: "Q", 13: "K" }[c.rank] || c.rank}${c.suit}</div>`,
        )
        .join("");
    }
    function paint(hide) {
      $("#dealer").innerHTML = renderHand(round.dealer, hide);
      $("#player").innerHTML = renderHand(round.player);
      $("#dealerScore").textContent = hide
        ? score([round.dealer[0]])
        : score(round.dealer);
      $("#playerScore").textContent = score(round.player);
    }
    function buttons(on) {
      $("#hit").disabled = !on;
      $("#stand").disabled = !on;
      $("#doubleDown").disabled =
        !on || round?.player.length !== 2 || data.balance < (round?.bet || 0);
      $("#bet").disabled = on;
    }
    function end() {
      paint(false);
      const p = score(round.player),
        d = score(round.dealer),
        pj = p === 21 && round.player.length === 2,
        dj = d === 21 && round.dealer.length === 2;
      let m = 0,
        txt = "Dealer wins";
      if (p > 21) txt = "Bust";
      else if (dj && pj) {
        m = 1;
        txt = "Push";
      } else if (dj) txt = "Dealer blackjack";
      else if (pj) {
        m = 2.5;
        txt = "Blackjack";
      } else if (d > 21 || p > d) {
        m = 2;
        txt = "You win";
      } else if (p === d) {
        m = 1;
        txt = "Push";
      }
      const pay = round.bet * m;
      for (const id of round.ids) finish(id, pending.get(id) * m, txt);
      result(
        `${txt} · ${money(pay)} STK`,
        m > 1 ? true : m === 0 ? false : undefined,
      );
      round = null;
      lock(false);
      buttons(false);
      $("#bet").disabled = false;
    }
    async function stand() {
      if (!round) return;
      buttons(false);
      while (score(round.dealer) < 17) {
        round.dealer.push(card());
        paint(false);
        await sleep(220);
        if (!alive) return;
      }
      end();
    }
    $("#hit").onclick = () => {
      if (!round) return;
      round.player.push(card());
      paint(true);
      $("#doubleDown").disabled = true;
      if (score(round.player) >= 21) stand();
    };
    $("#stand").onclick = stand;
    $("#doubleDown").onclick = () => {
      if (!round || round.player.length !== 2) return;
      const id = wager(round.bet);
      if (id === null) return;
      round.ids.push(id);
      round.bet *= 2;
      round.player.push(card());
      paint(true);
      stand();
    };
    play = () => {
      if (round || busy) return;
      const a = amount(),
        id = wager(a);
      if (id === null) return;
      round = {
        ids: [id],
        bet: a,
        player: [card(), card()],
        dealer: [card(), card()],
      };
      lock(true);
      paint(true);
      buttons(true);
      result("Hit, stand, or double.");
      if (score(round.player) === 21 || score(round.dealer) === 21) end();
    };
  }
  if (game.id === "slots") {
    $("#gameControls").innerHTML =
      `<p class="muted" style="font-size:12px">Three matching symbols win.<br>◆ 50× · 7 20× · ★ 10×<br>♠ 5× · ● 3× · 🍒 2×<br>Any two cherries: 1×</p>`;
    $("#stage").innerHTML =
      `<div class="recent-pills" id="pills"></div><div class="slots-reels"><div class="reel">🍒</div><div class="reel">7</div><div class="reel">◆</div></div><p class="round-status" id="status">Spin the reels.</p>`;
    const symbols = ["🍒", "●", "♠", "★", "7", "◆"],
      pay = [2, 3, 5, 10, 20, 50];
    play = async () => {
      if (busy) return;
      const a = amount(),
        id = wager(a);
      if (id === null) return;
      lock(true);
      $("#bet").disabled = true;
      const outcome = Array.from({ length: 3 }, () => Math.floor(random() * 6));
      for (let frame = 0; frame < 16; frame++) {
        if (!alive) return;
        $$(".reel").forEach(
          (e, i) =>
            (e.textContent =
              symbols[
                frame > 9 + i * 2 ? outcome[i] : Math.floor(random() * 6)
              ]),
        );
        await sleep(60);
      }
      if (!alive) return;
      $$(".reel").forEach((e, i) => (e.textContent = symbols[outcome[i]]));
      const same = outcome.every((x) => x === outcome[0]),
        m = same
          ? pay[outcome[0]]
          : outcome.filter((x) => x === 0).length === 2
            ? 1
            : 0;
      finish(id, a * m, outcome.map((i) => symbols[i]).join(""));
      result(
        m ? `${m}× · ${money(a * m)} STK` : "No match. Spin again.",
        m > 1,
      );
      pills(m + "×", m > 1);
      lock(false);
      $("#bet").disabled = false;
    };
  }
  $$("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (busy || auto) return;
        const selected = b.dataset.tab === "auto";
        $(".auto-options").hidden = !selected;
        $$("[data-tab]").forEach((e) => e.classList.toggle("active", e === b));
        $("#bet").textContent = selected ? "Start Autobet" : "Bet";
      }),
  );
  async function autobet() {
    if (auto) {
      stopRequested = true;
      $("#bet").textContent = "Stopping…";
      return;
    }
    auto = true;
    stopRequested = false;
    const initial = data.balance,
      startBet = amount(),
      count = Math.max(
        0,
        Math.min(10000, Math.floor(+$("#autoCount").value || 0)),
      ),
      onWin = Math.max(0, Math.min(100, +$("#onWin").value || 0)),
      onLoss = Math.max(0, Math.min(100, +$("#onLoss").value || 0)),
      profitLimit = Math.max(0, +$("#stopProfit").value || 0),
      lossLimit = Math.max(0, +$("#stopLoss").value || 0);
    $("#bet").textContent = "Stop Autobet";
    $$(".auto-options input").forEach((e) => (e.disabled = true));
    let n = 0;
    while (alive && !stopRequested && (count === 0 || n < count)) {
      const win = await play();
      if (win === null) break;
      n++;
      const net = data.balance - initial;
      if (
        (profitLimit && net >= profitLimit) ||
        (lossLimit && -net >= lossLimit)
      )
        break;
      const increase = win ? onWin : onLoss;
      $("#betAmount").value = (
        increase ? amount() * (1 + increase / 100) : startBet
      ).toFixed(2);
      await sleep(data.instant ? 70 : 220);
    }
    auto = false;
    if (alive) {
      lock(false);
      $$(".auto-options input").forEach((e) => (e.disabled = false));
      $("#bet").disabled = false;
      $("#bet").textContent = "Start Autobet";
      toast(`Autobet stopped after ${n} bets.`);
    }
  }
  $("#bet").onclick = () => {
    if (autoSupported && !$(".auto-options").hidden) autobet();
    else play?.();
  };
  return () => {
    alive = false;
    stopRequested = true;
    cancelAnimationFrame(raf);
    for (const [id, bet] of pending) finish(id, bet, "Cancelled · refunded");
  };
}
