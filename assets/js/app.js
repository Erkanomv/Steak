import{state}from'./core/state.js';
import{money,modal,toast,TOKEN_SRC,amount}from'./core/ui.js';
import{sounds,setSoundEnabled}from'./core/audio.js';
import*as dice from'./games/dice.js';import*as mines from'./games/mines.js';import*as crash from'./games/crash.js';import*as limbo from'./games/limbo.js';import*as plinko from'./games/plinko.js';import*as roulette from'./games/roulette.js';import*as blackjack from'./games/blackjack.js';import*as coinflip from'./games/coinflip.js';import*as cases from'./games/cases.js';import*as cups from'./games/cups.js';import*as slots from'./games/slots.js';import*as chicken from'./games/chicken.js';

const modules=[plinko,dice,mines,crash,limbo,chicken,roulette,blackjack,coinflip,cases,cups,slots];
const byId=Object.fromEntries(modules.map(m=>[m.meta.id,m]));
const COVER={
  roulette:'https://images.unsplash.com/photo-1627831389670-d20f5a01c536?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=74&w=1200',
  slots:'https://images.unsplash.com/photo-1771775606196-70dccc0d9bde?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=74&w=1200',
  cards:'https://images.unsplash.com/photo-1780091891244-8e6d48ce53a4?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=74&w=1200',
  chips:'https://images.unsplash.com/photo-1719228159189-148c8c45e634?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=74&w=1200'
};
const gameArt={
  plinko:{img:COVER.chips,pos:'58% 50%',tag:'ORIGINAL'},
  dice:{img:COVER.cards,pos:'50% 58%',tag:'ORIGINAL'},
  mines:{img:COVER.chips,pos:'44% 46%',tag:'ORIGINAL'},
  crash:{img:COVER.slots,pos:'72% 44%',tag:'ORIGINAL'},
  limbo:{img:COVER.roulette,pos:'64% 54%',tag:'ORIGINAL'},
  chicken:{img:COVER.cards,pos:'74% 40%',tag:'ORIGINAL'},
  roulette:{img:COVER.roulette,pos:'50% 50%',tag:'TABLE'},
  blackjack:{img:COVER.cards,pos:'45% 48%',tag:'TABLE'},
  coinflip:{img:COVER.chips,pos:'64% 58%',tag:'ARCADE'},
  cases:{img:COVER.chips,pos:'34% 52%',tag:'ARCADE'},
  cups:{img:COVER.cards,pos:'62% 48%',tag:'ARCADE'},
  slots:{img:COVER.slots,pos:'50% 52%',tag:'SLOTS'}
};

let cleanup=null,brandClicks=0,brandTimer=0;
const app=document.getElementById('app');
const isApple=/Macintosh|iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isApple)document.documentElement.classList.add('apple-liquid');
setSoundEnabled(state.data.settings.sound!==false);

const icons={
  home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  original:'<svg viewBox="0 0 24 24"><path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>',
  table:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10M7 13h4M14 13h3"/></svg>',
  slots:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7v6M12 7v6M16 7v6M8 17h8"/></svg>',
  arcade:'<svg viewBox="0 0 24 24"><path d="M7 9h10l3 9h-5l-1.5-2h-3L9 18H4z"/><path d="M9 12h4M11 10v4M16 12h.01"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
  sound:'<svg viewBox="0 0 24 24"><path d="M5 9v6h4l5 4V5L9 9z"/><path d="M17 9c1 .8 1.5 1.8 1.5 3S18 14.2 17 15"/></svg>'
};
const ico=name=>icons[name]||'';

function shell(){
  app.innerHTML=`<div class="app-shell">
    <aside class="sidebar">
      <button class="brand" id="brandSecret" aria-label="Steak home">
        <img src="assets/brand/steak-mark.svg" alt="">
        <span class="brand-word">Steak</span>
        <span class="mode-chip">PLAY</span>
      </button>
      <nav class="side-nav">
        <button data-route="#/" class="active">${ico('home')}<span>Casino home</span></button>
        <button data-section="Originals">${ico('original')}<span>Steak Originals</span></button>
        <button data-section="Table Games">${ico('table')}<span>Table games</span></button>
        <button data-section="Slots">${ico('slots')}<span>Slots</span></button>
        <button data-section="Arcade">${ico('arcade')}<span>Arcade</span></button>
      </nav>
      <div class="side-divider"></div>
      <div class="quick-games">
        <div class="side-label">Quick play</div>
        ${['plinko','roulette','blackjack','chicken'].map(id=>`<button data-game="${id}"><span class="quick-dot"></span><span>${byId[id].meta.title}</span></button>`).join('')}
      </div>
      <div class="side-card">
        <div><span class="status-dot"></span><b>Private play mode</b></div>
        <p>Local browser credits. No deposits or withdrawals.</p>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="top-section"><b>Casino</b><span>Private play session</span></div>
        <div class="searchbox">${ico('search')}<input id="search" placeholder="Search games" autocomplete="off"></div>
        <div class="top-actions">
          <button id="soundBtn" class="top-icon" aria-label="Toggle sound">${ico('sound')}</button>
          <div class="wallet">
            <img src="${TOKEN_SRC}" alt="Steak token">
            <div><small>STEAK CREDIT</small><strong id="balance">${money(state.data.balance)}</strong></div>
            <span>STK</span>
          </div>
        </div>
      </header>
      <div class="content" id="content"></div>
    </main>

    <nav class="mobile-nav">
      <button data-route="#/" class="active">${ico('home')}<span>Home</span></button>
      <button data-game="plinko">${ico('original')}<span>Originals</span></button>
      <button data-game="roulette">${ico('table')}<span>Roulette</span></button>
      <button data-game="slots">${ico('slots')}<span>Slots</span></button>
    </nav>
  </div>`;
  bindShell();
}

function bindShell(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>location.hash=b.dataset.route);
  document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>location.hash='#/game/'+b.dataset.game);
  document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{
    location.hash='#/';
    setTimeout(()=>document.querySelector(`[data-row="${b.dataset.section}"]`)?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  });
  const brand=document.getElementById('brandSecret');
  brand.onclick=()=>{
    if(location.hash!=='#/'&&location.hash!=='')location.hash='#/';
    brandClicks++;clearTimeout(brandTimer);brandTimer=setTimeout(()=>brandClicks=0,1800);
    if(brandClicks>=5){brandClicks=0;openAdmin();}
  };
  document.getElementById('soundBtn').onclick=()=>{
    state.data.settings.sound=!state.data.settings.sound;setSoundEnabled(state.data.settings.sound);state.save();
    toast(state.data.settings.sound?'Sound enabled':'Sound muted');
  };
  document.getElementById('search').oninput=e=>filterCards(e.target.value);
}

function gameCard(m){
  const art=gameArt[m.meta.id]||gameArt.plinko;
  return`<article class="game-card" data-open-game="${m.meta.id}">
    <button class="card-hit" aria-label="Play ${m.meta.title}"></button>
    <div class="cover" style="--cover:url('${art.img}');--pos:${art.pos}">
      <span class="cover-tag">${art.tag}</span>
      <div class="cover-vignette"></div>
      <div class="cover-title"><strong>${m.meta.title}</strong><span>${m.meta.sub}</span></div>
      <div class="play-orb">▶</div>
    </div>
    <div class="card-meta"><span>Steak</span><span class="meta-live"><i></i> local</span></div>
  </article>`;
}

function shelf(title,subtitle,mods,key){
  return`<section class="shelf" data-row="${key}">
    <div class="shelf-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="shelf-more">View all</button></div>
    <div class="shelf-track">${mods.map(gameCard).join('')}</div>
  </section>`;
}

function renderLobby(){
  const content=document.getElementById('content');
  const originals=modules.filter(m=>m.meta.category==='Originals');
  const tables=modules.filter(m=>m.meta.category==='Table Games');
  const arcade=modules.filter(m=>m.meta.category==='Arcade');
  const slotMods=modules.filter(m=>m.meta.category==='Slots');
  content.innerHTML=`
    <section class="premium-hero" style="--hero:url('${COVER.cards}')">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-kicker">STEAK PRIVATE CASINO</span>
        <h1>Play the table.<br><em>Keep it fictional.</em></h1>
        <p>Animated casino games with local play credits, saved progress, and no real-money rails.</p>
        <div class="hero-actions"><button data-hero="blackjack" class="hero-primary">Play Blackjack</button><button data-hero="roulette" class="hero-secondary">Open Roulette</button></div>
      </div>
      <div class="hero-wallet">
        <span>Your balance</span>
        ${amount(state.data.balance)}
        <small>Saved in this browser</small>
      </div>
    </section>

    <div class="category-bar">
      <button data-scroll="Originals" class="active">Originals</button>
      <button data-scroll="Table Games">Table games</button>
      <button data-scroll="Slots">Slots</button>
      <button data-scroll="Arcade">Arcade</button>
    </div>

    ${shelf('Steak Originals','Fast games built for short play-money rounds.',originals,'Originals')}
    ${shelf('Table games','Classic casino formats with dedicated game rooms.',tables,'Table Games')}

    <section class="promo-grid">
      <button class="promo-card roulette-promo" data-hero="roulette" style="--promo:url('${COVER.roulette}')">
        <span>TABLE FEATURE</span><strong>European Roulette</strong><small>Single zero • animated wheel</small>
      </button>
      <button class="promo-card slot-promo" data-hero="slots" style="--promo:url('${COVER.slots}')">
        <span>SLOT FLOOR</span><strong>Three machines</strong><small>Neon • Vault • Galaxy</small>
      </button>
    </section>

    ${shelf('Slots','Three original machines with different visual themes.',slotMods,'Slots')}
    ${shelf('Arcade','Quick animated games and case opening.',arcade,'Arcade')}

    <section class="dashboard-row">
      <div class="activity-card">
        <div class="panel-title"><div><h3>Your recent bets</h3><span>Local session history</span></div><span class="live-pill"><i></i> LIVE</span></div>
        <div class="recent-head"><div>Game</div><div>Bet</div><div>Profit</div><div>Result</div></div>
        <div id="recentRows"></div>
      </div>
      <div class="session-card" style="--session:url('${COVER.chips}')">
        <div class="session-shade"></div>
        <div class="session-content"><span>SESSION</span><strong id="sessionRounds">${state.data.stats.rounds||0}</strong><small>rounds played</small><div class="session-stat"><b>${state.data.stats.wins||0}</b><span>wins</span></div><div class="session-stat"><b>STK ${money(state.data.stats.biggestWin||0)}</b><span>biggest profit</span></div></div>
      </div>
    </section>

    <footer class="footer">
      <div><img src="assets/brand/steak-mark.svg" alt=""><strong>Steak</strong><span>Play-money casino sandbox</span></div>
      <p>Independent fictional simulator. Credits have no cash value and cannot be purchased or withdrawn. Photo backgrounds are from Unsplash.</p>
    </footer>`;

  content.querySelectorAll('[data-open-game],[data-hero]').forEach(b=>b.onclick=()=>location.hash='#/game/'+(b.dataset.openGame||b.dataset.hero));
  content.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.querySelector(`[data-row="${b.dataset.scroll}"]`)?.scrollIntoView({behavior:'smooth',block:'start'}));
  renderRecent();
}

function renderRecent(){
  const r=document.getElementById('recentRows');if(!r)return;
  r.innerHTML=state.data.history.slice(0,8).map(x=>`<div class="recent-row"><strong>${x.game}</strong><div class="token-cell"><img src="${TOKEN_SRC}" alt="">${money(x.bet)}</div><div class="${x.profit>=0?'green':'red'}">${x.profit>=0?'+':''}${money(x.profit)} STK</div><div>${x.result}</div></div>`).join('')||'<div class="empty-state">No rounds yet. Pick a game above.</div>';
}

function filterCards(q){
  q=q.trim().toLowerCase();
  document.querySelectorAll('.game-card').forEach(c=>c.style.display=!q||c.textContent.toLowerCase().includes(q)?'block':'none');
}

function route(){
  cleanup?.();cleanup=null;
  const hash=location.hash||'#/';
  document.querySelectorAll('.side-nav button,.mobile-nav button').forEach(b=>b.classList.remove('active'));
  if(hash.startsWith('#/game/')){
    const id=hash.split('/')[2],m=byId[id];if(!m){location.hash='#/';return}
    state.data.settings.lastGame=id;state.save();
    document.querySelectorAll(`[data-game="${id}"]`).forEach(b=>b.classList.add('active'));
    const content=document.getElementById('content');content.innerHTML='';
    cleanup=m.mount(content,{state})||null;window.scrollTo({top:0,behavior:'instant'});
  }else{
    document.querySelectorAll('[data-route="#/"]').forEach(b=>b.classList.add('active'));
    renderLobby();window.scrollTo({top:0,behavior:'instant'});
  }
}

function openAdmin(){
  sounds.click();
  modal('Steak admin',`<div class="admin-grid">
    <div class="admin-balance"><img src="${TOKEN_SRC}" alt=""><div><span>Current balance</span><strong id="adminBal">${money(state.data.balance)} STK</strong></div></div>
    <div class="field"><label><span>Amount</span><span>STK</span></label><input id="adminAmount" class="input mono" type="number" min="0" step="1" value="1000"></div>
    <div class="field-grid"><button id="addCredits" class="primary-btn">Add credits</button><button id="setCredits" class="soft-btn">Set balance</button></div>
    <div class="field-grid"><button id="clearInventory" class="soft-btn">Clear inventory</button><button id="resetSave" class="danger-btn">Reset browser save</button></div>
    <p class="control-note">Local browser admin only. No payments, deposits, withdrawals or crypto transfers.</p>
  </div>`,(el,close)=>{
    const input=el.querySelector('#adminAmount');
    el.querySelector('#addCredits').onclick=()=>{state.add(Math.max(0,+input.value||0));el.querySelector('#adminBal').textContent=money(state.data.balance)+' STK';toast('Credits added','win')};
    el.querySelector('#setCredits').onclick=()=>{state.data.balance=Math.max(0,+input.value||0);state.save();el.querySelector('#adminBal').textContent=money(state.data.balance)+' STK';toast('Balance updated')};
    el.querySelector('#clearInventory').onclick=()=>{state.data.inventory=[];state.save();toast('Inventory cleared')};
    el.querySelector('#resetSave').onclick=()=>{if(confirm('Reset all Steak browser progress? New balance will be 5.00 STK.')){state.reset();close();location.hash='#/';route();toast('Save reset to 5.00 STK')}};
  });
}

state.subscribe(data=>{const bal=document.getElementById('balance');if(bal)bal.textContent=money(data.balance);const rounds=document.getElementById('sessionRounds');if(rounds)rounds.textContent=data.stats.rounds||0;renderRecent()});
window.addEventListener('hashchange',route);
shell();route();
