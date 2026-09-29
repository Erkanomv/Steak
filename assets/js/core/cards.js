import{shuffle}from'./random.js';
const suits=['♠','♥','♦','♣'],ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
export function makeShoe(decks=6){let d=[];for(let n=0;n<decks;n++)for(const s of suits)for(const r of ranks)d.push({r,s});return shuffle(d)}
export function value(card){if(card.r==='A')return 11;if(['K','Q','J'].includes(card.r))return 10;return +card.r}
export function score(hand){let s=hand.reduce((a,c)=>a+value(c),0),aces=hand.filter(c=>c.r==='A').length;while(s>21&&aces--){s-=10}return s}
export function cardHtml(c,hidden=false){if(hidden)return'<div class="playing-card back"></div>';const red=c.s==='♥'||c.s==='♦';return`<div class="playing-card ${red?'redcard':''}"><div class="corner">${c.r}${c.s}</div><div class="suit">${c.s}</div><div class="corner" style="transform:rotate(180deg)">${c.r}${c.s}</div></div>`}
