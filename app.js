(()=>{"use strict";
const SAVE_KEY="steak.save.v3";
const GAMES=[
{id:"dice",name:"Dice",icon:"🎲",c1:"#34205e",c2:"#7d4ddd"},
{id:"mines",name:"Mines",icon:"💎",c1:"#123f38",c2:"#1c8a71"},
{id:"crash",name:"Crash",icon:"🚀",c1:"#3c1830",c2:"#b53362"},
{id:"limbo",name:"Limbo",icon:"∞",c1:"#342414",c2:"#c88b2c"},
{id:"plinko",name:"Plinko",icon:"🔻",c1:"#21334c",c2:"#4674bd"},
{id:"roulette",name:"Roulette",icon:"🎯",c1:"#3e1821",c2:"#b53346"},
{id:"blackjack",name:"Blackjack",icon:"♠️",c1:"#163b28",c2:"#287a4c"},
{id:"coinflip",name:"Coin Flip",icon:"🪙",c1:"#4a3614",c2:"#c99b2b"},
{id:"cases",name:"Cases",icon:"📦",c1:"#173b48",c2:"#2b7e97"},
{id:"cups",name:"Cups",icon:"🥤",c1:"#34273e",c2:"#8254a3"},
{id:"slots",name:"Slots",icon:"🎰",c1:"#3c1d25",c2:"#ab4157"},
{id:"chicken",name:"Chicken",icon:"🐔",c1:"#263918",c2:"#679636"}
];
const $=id=>document.getElementById(id);
const round2=n=>Math.round((+n+Number.EPSILON)*100)/100;
const money=n=>round2(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const copy=o=>JSON.parse(JSON.stringify(o));
const defaults={version:3,balance:5,game:"dice",history:[],stats:{rounds:0,wins:0,wagered:0,biggestWin:0},bet:.25,prefs:{diceTarget:49.5,limboTarget:2,rouletteBet:"red",rouletteNumber:7,coinSide:"heads",plinkoRisk:"medium",chickenRisk:"medium",minesCount:5},active:{mines:null,blackjack:null,chicken:null},crashHistory:[1.17,2.06,1.31,4.22,1.05,7.48]};
function load(){
 try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(v)return Object.assign(copy(defaults),v,{prefs:Object.assign({},defaults.prefs,v.prefs||{}),active:Object.assign({},defaults.active,v.active||{}),stats:Object.assign({},defaults.stats,v.stats||{})})}catch(e){}
 try{const v2=JSON.parse(localStorage.getItem("steak.save.v2")||"null");if(v2){const s=copy(defaults);s.balance=(v2.balance===10000 && (!v2.stats||!v2.stats.rounds))?5:(+v2.balance||5);s.history=v2.history||[];s.stats=Object.assign({},s.stats,v2.stats||{});s.game=GAMES.some(g=>g.id===v2.game)?v2.game:"dice";s.bet=Math.max(.01,+v2.settings?.betAmount||.25);s.prefs.diceTarget=+v2.settings?.rollUnder||49.5;s.prefs.minesCount=+v2.settings?.mineCount||5;s.crashHistory=v2.crashHistory||s.crashHistory;if(v2.mines)s.active.mines=v2.mines;return s}}catch(e){}
 return copy(defaults);
}
const S=load();
function persist(render=true){localStorage.setItem(SAVE_KEY,JSON.stringify(S));if(render)renderGlobal()}
function renderGlobal(){
 $("balance").textContent=money(S.balance);$("heroBalance").textContent=money(S.balance);
 $("history").innerHTML=S.history.slice(0,10).map(x=>'<div class="history-row"><span><b>'+x.game+'</b></span><span>◎ '+money(x.bet)+'</span><span class="'+(x.profit>=0?"pos":"neg")+'">'+(x.profit>=0?"+":"")+money(x.profit)+'</span><span>'+x.result+'</span></div>').join("")||'<div class="history-row"><span>No plays yet</span><span>—</span><span>—</span><span>—</span></div>';
}
function addHistory(game,bet,profit,result){
 S.history.unshift({game,bet:round2(bet),profit:round2(profit),result,at:Date.now()});S.history=S.history.slice(0,30);S.stats.rounds++;S.stats.wagered=round2(S.stats.wagered+bet);if(profit>0){S.stats.wins++;S.stats.biggestWin=Math.max(S.stats.biggestWin,profit)}persist();
}
function msg(t,kind=""){$("message").textContent=t;$("message").className="message "+kind}
function bet(){const v=Math.max(.01,round2(+$("betAmount").value||S.bet||.25));S.bet=v;$("betAmount").value=v;persist(false);return v}
function charge(v){if(v>S.balance+.0001){msg("Not enough play credits. The hidden local admin can add more.","loss-text");return false}S.balance=round2(S.balance-v);persist();return true}
function settle(name,b,totalReturn,result){const profit=round2(totalReturn-b);S.balance=round2(S.balance+totalReturn);addHistory(name,b,profit,result);msg(profit>=0?"Won ◎ "+money(profit):"Lost ◎ "+money(Math.abs(profit)),profit>=0?"win-text":"loss-text")}
function randInt(n){return Math.floor(Math.random()*n)}
function gameById(id){return GAMES.find(g=>g.id===id)||GAMES[0]}
function renderCards(list=GAMES){
 $("gameGrid").innerHTML=list.map(g=>'<button class="game-card" data-game="'+g.id+'" style="--art1:'+g.c1+';--art2:'+g.c2+'"><div class="art">'+g.icon+'</div><div class="meta"><b>'+g.name+'</b><small>STEAK ORIGINAL</small></div></button>').join("");
 $("gameCount").textContent=list.length+" game"+(list.length===1?"":"s");
 document.querySelectorAll("[data-game]").forEach(b=>b.onclick=()=>openGame(b.dataset.game));
}
function control(html){$("gameControls").innerHTML=html}
function stage(html){$("stage").innerHTML=html}
function primary(text,fn,disabled=false){const b=$("primaryAction");b.textContent=text;b.onclick=fn;b.disabled=disabled}
function openGame(id){
 S.game=id;persist(false);const g=gameById(id);$("gameIcon").textContent=g.icon;$("gameTitle").textContent=g.name;$("betAmount").value=S.bet;$("playPanel").classList.remove("hidden");renderGame();$("playPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderGame(){
 const g=S.game;msg("Play-money round. Progress saves locally.");
 if(g==="dice")renderDice();else if(g==="mines")renderMines();else if(g==="crash")renderCrash();else if(g==="limbo")renderLimbo();else if(g==="plinko")renderPlinko();else if(g==="roulette")renderRoulette();else if(g==="blackjack")renderBlackjack();else if(g==="coinflip")renderCoin();else if(g==="cases")renderCases();else if(g==="cups")renderCups();else if(g==="slots")renderSlots();else if(g==="chicken")renderChicken();
}
function renderDice(){
 control('<div class="control-block"><label>Roll Under <span id="diceChance">'+S.prefs.diceTarget.toFixed(2)+'%</span></label><input id="diceTarget" type="range" min="5" max="95" step=".5" value="'+S.prefs.diceTarget+'"><label style="margin-top:8px">Payout <span id="dicePay">'+(99/S.prefs.diceTarget).toFixed(2)+'×</span></label></div>');
 stage('<div class="big-result" style="width:100%"><div class="value" id="diceResult">--.--</div><p>Target: under <span id="diceText">'+S.prefs.diceTarget.toFixed(2)+'</span></p><div class="dice-track"><div class="dice-fill" id="diceFill" style="width:'+S.prefs.diceTarget+'%"></div><div class="dice-pin" id="dicePin" style="left:'+S.prefs.diceTarget+'%"></div></div></div>');
 $("diceTarget").oninput=e=>{S.prefs.diceTarget=+e.target.value;$("diceChance").textContent=S.prefs.diceTarget.toFixed(2)+"%";$("dicePay").textContent=(99/S.prefs.diceTarget).toFixed(2)+"×";$("diceText").textContent=S.prefs.diceTarget.toFixed(2);$("diceFill").style.width=S.prefs.diceTarget+"%";$("dicePin").style.left=S.prefs.diceTarget+"%";persist(false)};
 primary("Bet",()=>{const b=bet();if(!charge(b))return;const r=Math.random()*100,win=r<S.prefs.diceTarget,m=99/S.prefs.diceTarget;$("diceResult").textContent=r.toFixed(2);settle("Dice",b,win?b*m:0,r.toFixed(2))});
}
function makeMines(){
 const m=S.active.mines;const grid=$("minesGrid");if(!grid)return;grid.innerHTML="";
 for(let i=0;i<25;i++){const b=document.createElement("button");b.className="mine-tile";b.textContent="◆";if(m?.revealed?.includes(i)){b.classList.add("safe");b.textContent="💎"}b.onclick=()=>revealMine(i,b);grid.appendChild(b)}
}
function renderMines(){
 control('<div class="control-block"><label>Mines <span>5 × 5</span></label><select id="minesCount"><option>3</option><option>5</option><option>7</option><option>10</option></select></div>');
 stage('<div><div class="mines-grid" id="minesGrid"></div><p style="text-align:center;color:#819aa8;font-size:11px">Find gems • cash out before a mine</p></div>');
 $("minesCount").value=String(S.prefs.minesCount);$("minesCount").onchange=e=>{S.prefs.minesCount=+e.target.value;persist(false)};makeMines();
 if(S.active.mines){primary("Cash Out",cashMines);msg("Mines round restored from this browser.","win-text")}else primary("Start Mines",startMines);
}
function startMines(){const b=bet();if(!charge(b))return;const count=S.prefs.minesCount,arr=[...Array(25).keys()];for(let i=arr.length-1;i>0;i--){const j=randInt(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}S.active.mines={bet:b,mines:arr.slice(0,count),revealed:[],count};persist();renderMines();msg("Round live — every reveal is saved.")}
function revealMine(i,el){const m=S.active.mines;if(!m||m.revealed.includes(i))return;if(m.mines.includes(i)){el.classList.add("bomb");el.textContent="💣";const b=m.bet;S.active.mines=null;addHistory("Mines",b,-b,"Mine");renderMines();msg("Mine hit.","loss-text");return}m.revealed.push(i);persist();makeMines();const mult=Math.pow(25/(25-m.count),m.revealed.length)*.97;msg("Safe • current cashout "+mult.toFixed(2)+"×","win-text")}
function cashMines(){const m=S.active.mines;if(!m)return;const mult=Math.max(1,Math.pow(25/(25-m.count),m.revealed.length)*.97),ret=m.bet*mult,b=m.bet;S.active.mines=null;S.balance=round2(S.balance+ret);addHistory("Mines",b,ret-b,mult.toFixed(2)+"×");renderMines();msg("Cashed out at "+mult.toFixed(2)+"×","win-text")}
let crashTimer=null;
function renderCrash(){control('<div class="control-block"><label>Auto Cashout <span>multiplier</span></label><input id="crashAuto" type="number" min="1.01" step=".01" value="2.00"></div>');stage('<div class="crash-box"><div class="crash-value" id="crashVal">1.00×</div><div class="crash-rocket" id="crashRocket">🚀</div></div>');primary("Bet",playCrash)}
function playCrash(){if(crashTimer)return;const b=bet(),auto=Math.max(1.01,+$("crashAuto").value||2);if(!charge(b))return;const point=Math.max(1.01,Math.min(50,.99/(1-Math.random()))),start=performance.now();primary("Round Running",()=>{},true);crashTimer=requestAnimationFrame(function tick(t){const e=(t-start)/1000,cur=Math.min(point,1+e*.55+e*e*.72);if($("crashVal")){$("crashVal").textContent=cur.toFixed(2)+"×";$("crashRocket").style.left=Math.min(83,12+e*18)+"%";$("crashRocket").style.bottom=Math.min(72,14+e*12)+"%"}if(cur>=auto&&auto<point){cancelAnimationFrame(crashTimer);crashTimer=null;S.crashHistory.unshift(point);S.crashHistory=S.crashHistory.slice(0,8);settle("Crash",b,b*auto,"Cashout "+auto.toFixed(2)+"×");renderCrash();return}if(cur>=point){cancelAnimationFrame(crashTimer);crashTimer=null;S.crashHistory.unshift(point);S.crashHistory=S.crashHistory.slice(0,8);settle("Crash",b,0,"Crashed "+point.toFixed(2)+"×");renderCrash();return}crashTimer=requestAnimationFrame(tick)})}
function renderLimbo(){control('<div class="control-block"><label>Target Multiplier <span>×</span></label><input id="limboTarget" type="number" min="1.01" max="1000" step=".01" value="'+S.prefs.limboTarget+'"></div>');stage('<div class="big-result"><div class="value" id="limboResult">1.00×</div><p>Beat your target before the limbo point</p></div>');$("limboTarget").onchange=e=>{S.prefs.limboTarget=Math.max(1.01,+e.target.value||2);persist(false)};primary("Bet",()=>{const b=bet(),t=Math.max(1.01,+$("limboTarget").value||2);if(!charge(b))return;S.prefs.limboTarget=t;const point=Math.max(1,Math.min(10000,.99/(1-Math.random())));$("limboResult").textContent=point.toFixed(2)+"×";settle("Limbo",b,point>=t?b*t:0,point.toFixed(2)+"×")})}
function renderPlinko(){
 control('<div class="control-block"><label>Risk <span>9 slots</span></label><select id="plinkoRisk"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>');
 stage('<div class="plinko-board"><div class="pins" id="pins"></div><div class="plinko-ball hidden" id="plinkoBall"></div><div class="plinko-slots" id="plinkoSlots"></div></div>');
 $("plinkoRisk").value=S.prefs.plinkoRisk;$("plinkoRisk").onchange=e=>{S.prefs.plinkoRisk=e.target.value;drawPlinko();persist(false)};drawPlinko();primary("Drop Ball",playPlinko);
}
function plinkoMults(){return S.prefs.plinkoRisk==="low"?[2,.9,.7,.5,.4,.5,.7,.9,2]:S.prefs.plinkoRisk==="high"?[14,3,1.2,.25,.1,.25,1.2,3,14]:[6,2,1,.4,.2,.4,1,2,6]}
function drawPlinko(){if(!$("pins"))return;$("pins").innerHTML=[2,3,4,5,6,7,8].map(n=>'<div class="pin-row">'+Array(n).fill('<i class="pin"></i>').join("")+'</div>').join("");$("plinkoSlots").innerHTML=plinkoMults().map(x=>'<div class="plinko-slot">'+x+'×</div>').join("")}
function playPlinko(){const b=bet();if(!charge(b))return;let bin=0;for(let i=0;i<8;i++)bin+=Math.random()<.5?0:1;const m=plinkoMults()[bin];const ball=$("plinkoBall");ball.classList.remove("hidden");ball.style.left=(6.25+bin*11.1)+"%";ball.style.top="270px";setTimeout(()=>{settle("Plinko",b,b*m,m+"×");renderPlinko()},680)}
const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function renderRoulette(){control('<div class="control-block"><label>Bet Type <span>European wheel</span></label><select id="rouletteBet"><option value="red">Red</option><option value="black">Black</option><option value="even">Even</option><option value="odd">Odd</option><option value="low">1–18</option><option value="high">19–36</option><option value="straight">Exact Number</option></select></div><div class="control-block" id="numberBlock"><label>Number <span>0–36</span></label><input id="rouletteNumber" type="number" min="0" max="36" value="'+S.prefs.rouletteNumber+'"></div>');stage('<div class="roulette-wheel"><div id="rouletteResult">?</div></div>');$("rouletteBet").value=S.prefs.rouletteBet;const sync=()=>{$("numberBlock").classList.toggle("hidden",$("rouletteBet").value!=="straight");S.prefs.rouletteBet=$("rouletteBet").value;persist(false)};$("rouletteBet").onchange=sync;sync();primary("Spin",()=>{const b=bet();if(!charge(b))return;const n=randInt(37),type=$("rouletteBet").value,num=Math.max(0,Math.min(36,Math.floor(+$("rouletteNumber").value||0)));S.prefs.rouletteNumber=num;let win=false,m=2;if(type==="red")win=reds.has(n);if(type==="black")win=n!==0&&!reds.has(n);if(type==="even")win=n!==0&&n%2===0;if(type==="odd")win=n%2===1;if(type==="low")win=n>=1&&n<=18;if(type==="high")win=n>=19;if(type==="straight"){win=n===num;m=36}$("rouletteResult").textContent=n;settle("Roulette",b,win?b*m:0,String(n))})}
function deck(){const d=[];for(const s of ["♠","♥","♦","♣"])for(const r of ["A","2","3","4","5","6","7","8","9","10","J","Q","K"])d.push({r,s});for(let i=d.length-1;i>0;i--){const j=randInt(i+1);[d[i],d[j]]=[d[j],d[i]]}return d}
function cardVal(c){if(["J","Q","K"].includes(c.r))return 10;if(c.r==="A")return 11;return +c.r}
function handVal(h){let v=h.reduce((a,c)=>a+cardVal(c),0),aces=h.filter(c=>c.r==="A").length;while(v>21&&aces--){v-=10}return v}
function cardHtml(c,back=false){if(back)return '<div class="playing-card back">X</div>';const red=["♥","♦"].includes(c.s);return '<div class="playing-card '+(red?"redcard":"")+'">'+c.r+'<br>'+c.s+'</div>'}
function renderBlackjack(){
 const a=S.active.blackjack;
 control(a?'<div class="control-block"><label>Current Hand <span>◎ '+money(a.bet)+'</span></label><div class="choice-row"><button id="hitBtn">Hit</button><button id="standBtn">Stand</button></div></div>':'<div class="control-block"><label>Classic Blackjack <span>dealer stands 17</span></label></div>');
 if(!a){stage('<div class="big-result"><div class="value">♠ ♥</div><p>Get closer to 21 than the dealer</p></div>');primary("Deal",startBlackjack);return}
 stage('<div><div class="hand-label">DEALER</div><div class="cards">'+a.dealer.map((c,i)=>cardHtml(c,!a.done&&i===1)).join("")+'</div><div class="hand-label">YOU • '+handVal(a.player)+'</div><div class="cards">'+a.player.map(c=>cardHtml(c)).join("")+'</div></div>');primary("Hand In Progress",()=>{},true);$("hitBtn").onclick=hitBlackjack;$("standBtn").onclick=standBlackjack;
}
function startBlackjack(){const b=bet();if(!charge(b))return;const d=deck(),a={bet:b,deck:d,player:[d.pop(),d.pop()],dealer:[d.pop(),d.pop()],done:false};S.active.blackjack=a;persist();if(handVal(a.player)===21){finishBlackjack("blackjack")}else renderBlackjack()}
function hitBlackjack(){const a=S.active.blackjack;if(!a)return;a.player.push(a.deck.pop());persist();if(handVal(a.player)>21)finishBlackjack("bust");else renderBlackjack()}
function standBlackjack(){const a=S.active.blackjack;if(!a)return;while(handVal(a.dealer)<17)a.dealer.push(a.deck.pop());finishBlackjack("stand")}
function finishBlackjack(reason){const a=S.active.blackjack;if(!a)return;const pv=handVal(a.player),dv=handVal(a.dealer);let ret=0,res="";if(reason==="blackjack"){ret=a.bet*2.5;res="Blackjack"}else if(pv>21){res="Bust "+pv}else if(dv>21||pv>dv){ret=a.bet*2;res=pv+" vs "+dv}else if(pv===dv){ret=a.bet;res="Push "+pv}else res=pv+" vs "+dv;const b=a.bet;S.active.blackjack=null;S.balance=round2(S.balance+ret);addHistory("Blackjack",b,ret-b,res);renderBlackjack();msg(ret>b?"Blackjack win!":ret===b?"Push.":"Dealer wins.",ret>b?"win-text":ret===b?"":"loss-text")}
function renderCoin(){control('<div class="control-block"><label>Choose Side <span>1.96×</span></label><div class="choice-row"><button data-side="heads">Heads</button><button data-side="tails">Tails</button></div></div>');stage('<div class="coin-face" id="coinFace">S</div>');document.querySelectorAll("[data-side]").forEach(b=>{b.classList.toggle("selected",b.dataset.side===S.prefs.coinSide);b.onclick=()=>{S.prefs.coinSide=b.dataset.side;persist(false);renderCoin()}});primary("Flip",()=>{const b=bet();if(!charge(b))return;const side=Math.random()<.5?"heads":"tails";$("coinFace").textContent=side==="heads"?"S":"T";settle("Coin Flip",b,side===S.prefs.coinSide?b*1.96:0,side.toUpperCase())})}
function renderCases(){control('<div class="control-block"><label>Case Drop <span>random multiplier</span></label><p style="color:#7993a2;font-size:11px">Open one of four cases. Higher multipliers are rarer.</p></div>');stage('<div class="cases" id="cases">'+[1,2,3,4].map(i=>'<button class="case" data-case="'+i+'">📦</button>').join("")+'</div>');primary("Choose a Case Above",()=>{},true);document.querySelectorAll("[data-case]").forEach(c=>c.onclick=()=>openCase(c))}
function openCase(el){const b=bet();if(!charge(b))return;const r=Math.random();let m=r<.24?0:r<.46?.5:r<.67?1:r<.83?1.5:r<.93?2:r<.98?5:r<.997?10:50;el.classList.add("open");el.textContent=m+"×";setTimeout(()=>settle("Cases",b,b*m,m+"×"),220)}
function renderCups(){control('<div class="control-block"><label>Shell Game <span>2.90×</span></label><p style="color:#7993a2;font-size:11px">Pick the cup hiding the green ball.</p></div>');stage('<div class="cups">'+[0,1,2].map(i=>'<button class="cup" data-cup="'+i+'"></button>').join("")+'</div>');primary("Pick a Cup",()=>{},true);document.querySelectorAll("[data-cup]").forEach(c=>c.onclick=()=>playCup(c))}
function playCup(el){const b=bet();if(!charge(b))return;const ball=randInt(3),pick=+el.dataset.cup;document.querySelectorAll("[data-cup]").forEach((c,i)=>{c.classList.add("reveal");if(i===ball){const x=document.createElement("i");x.className="ball";c.appendChild(x)}});setTimeout(()=>settle("Cups",b,pick===ball?b*2.9:0,"Cup "+(ball+1)),420)}
const symbols=["🍒","🍋","💎","7️⃣","⭐","🍀"];
function renderSlots(){control('<div class="control-block"><label>3-Reel Slots <span>up to 12×</span></label><p style="color:#7993a2;font-size:11px">Pair = 1.5× • triple = 5× • triple 7 = 12×</p></div>');stage('<div class="slot-machine"><div class="reel" id="r0">❔</div><div class="reel" id="r1">❔</div><div class="reel" id="r2">❔</div></div>');primary("Spin",()=>{const b=bet();if(!charge(b))return;const r=[symbols[randInt(symbols.length)],symbols[randInt(symbols.length)],symbols[randInt(symbols.length)]];r.forEach((x,i)=>$("r"+i).textContent=x);let m=0;if(r[0]===r[1]&&r[1]===r[2])m=r[0]==="7️⃣"?12:5;else if(r[0]===r[1]||r[1]===r[2]||r[0]===r[2])m=1.5;settle("Slots",b,b*m,r.join(" "))})}
function chickenOdds(){return S.prefs.chickenRisk==="easy"?.90:S.prefs.chickenRisk==="hard"?.68:.80}
function chickenMult(step){return Math.pow(1/chickenOdds(),step)*.97}
function renderChicken(){
 const a=S.active.chicken;
 control('<div class="control-block"><label>Difficulty <span>crossing risk</span></label><select id="chickenRisk" '+(a?"disabled":"")+'><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>');
 $("chickenRisk").value=S.prefs.chickenRisk;$("chickenRisk").onchange=e=>{S.prefs.chickenRisk=e.target.value;persist(false);renderChicken()};
 const step=a?.step||0;stage('<div><div class="chicken-road">'+Array.from({length:8},(_,i)=>'<div class="road-step '+(i<step?"done":"")+'">'+(i<step?"🐔":"▧")+'<small>'+(chickenMult(i+1)).toFixed(2)+'×</small></div>').join("")+'</div><p style="text-align:center;color:#819aa8;font-size:11px">Cross one lane at a time. Cash out whenever you want.</p></div>');
 if(a){primary("Cross Next Lane",crossChicken);const sec=document.createElement("button");sec.className="secondary";sec.textContent="Cash Out "+chickenMult(step).toFixed(2)+"×";sec.onclick=cashChicken;$("gameControls").appendChild(sec);msg("Chicken run restored • step "+step,"win-text")}else primary("Start Chicken",startChicken);
}
function startChicken(){const b=bet();if(!charge(b))return;S.active.chicken={bet:b,step:0,risk:S.prefs.chickenRisk};persist();renderChicken()}
function crossChicken(){const a=S.active.chicken;if(!a)return;const survive=Math.random()<chickenOdds();if(!survive){const b=a.bet;S.active.chicken=null;addHistory("Chicken",b,-b,"Hit at lane "+(a.step+1));renderChicken();msg("Chicken got caught.","loss-text");return}a.step++;persist();if(a.step>=8){cashChicken()}else renderChicken()}
function cashChicken(){const a=S.active.chicken;if(!a)return;const m=Math.max(1,chickenMult(a.step)),ret=a.bet*m,b=a.bet;S.active.chicken=null;S.balance=round2(S.balance+ret);addHistory("Chicken",b,ret-b,a.step+" lanes • "+m.toFixed(2)+"×");renderChicken();msg("Chicken cashed out at "+m.toFixed(2)+"×","win-text")}
$("betAmount").onchange=()=>bet();
document.querySelectorAll("[data-bet]").forEach(b=>b.onclick=()=>{let v=+$("betAmount").value||S.bet;if(b.dataset.bet==="half")v=Math.max(.01,v/2);else v*=2;$("betAmount").value=round2(v);bet()});
$("closeGame").onclick=()=>{$("playPanel").classList.add("hidden");window.scrollTo({top:$("originals").offsetTop-80,behavior:"smooth"})};
$("search").oninput=e=>{const q=e.target.value.trim().toLowerCase();renderCards(GAMES.filter(g=>g.name.toLowerCase().includes(q)))};
document.querySelectorAll("[data-scroll]").forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:"smooth"}));
let logoClicks=0,logoTimer=null;$("logo").onclick=()=>{logoClicks++;clearTimeout(logoTimer);logoTimer=setTimeout(()=>logoClicks=0,1800);if(logoClicks>=5){logoClicks=0;$("adminModal").classList.remove("hidden")}};
$("closeAdmin").onclick=()=>$("adminModal").classList.add("hidden");$("adminModal").onclick=e=>{if(e.target===$("adminModal"))$("adminModal").classList.add("hidden")};
$("adminAdd").onclick=()=>{const a=Math.max(0,+$("adminAmount").value||0);S.balance=round2(S.balance+a);persist();msg("Admin added ◎ "+money(a));};
$("adminSet").onclick=()=>{S.balance=round2(Math.max(0,+$("adminAmount").value||0));persist();};
$("adminFive").onclick=()=>{S.balance=5;persist();};
$("adminReset").onclick=()=>{if(confirm("Reset all local Steak progress?")){localStorage.removeItem(SAVE_KEY);localStorage.removeItem("steak.save.v2");localStorage.removeItem("steak.balance");localStorage.removeItem("steak.history");localStorage.removeItem("steak.crash");location.reload()}};
window.addEventListener("beforeunload",()=>persist(false));
renderCards();renderGlobal();$("playPanel").classList.add("hidden");
})();