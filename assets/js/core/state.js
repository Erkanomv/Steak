const KEY='steak.save.v3';
const defaults=()=>({version:3,balance:5,history:[],inventory:[],favorites:[],stats:{rounds:0,wins:0,wagered:0,biggestWin:0},settings:{sound:true,lastGame:'plinko'},gameState:{},createdAt:Date.now()});
function migrate(){
  const fresh=defaults();
  try{const v3=localStorage.getItem(KEY);if(v3)return Object.assign(fresh,JSON.parse(v3))}catch{}
  try{const v2=JSON.parse(localStorage.getItem('steak.save.v2')||'null');if(v2){fresh.balance=Number(v2.balance)||5;fresh.history=v2.history||[];fresh.stats=Object.assign(fresh.stats,v2.stats||{});fresh.settings.lastGame=v2.game||'plinko';if(v2.mines)fresh.gameState.mines=v2.mines;return fresh}}catch{}
  const old=localStorage.getItem('steak.balance');if(old!==null&&isFinite(+old))fresh.balance=+old;
  try{fresh.history=JSON.parse(localStorage.getItem('steak.history')||'[]')}catch{}
  return fresh;
}
class Store{
  constructor(){this.data=migrate();this.listeners=new Set();this.save()}
  save(){localStorage.setItem(KEY,JSON.stringify(this.data));this.listeners.forEach(fn=>fn(this.data))}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  set(path,value){const p=path.split('.');let o=this.data;while(p.length>1){const k=p.shift();o[k]??={};o=o[k]}o[p[0]]=value;this.save()}
  canBet(amount){return amount>0&&amount<=this.data.balance+1e-9}
  take(amount){amount=Math.round(amount*100)/100;if(!this.canBet(amount))return false;this.data.balance=Math.max(0,this.data.balance-amount);this.data.stats.wagered+=amount;this.save();return true}
  add(amount){this.data.balance=Math.max(0,Math.round((this.data.balance+amount)*100)/100);this.save()}
  record(game,bet,payout,result){const profit=Math.round((payout-bet)*100)/100;if(payout>0)this.data.balance=Math.round((this.data.balance+payout)*100)/100;this.data.stats.rounds++;if(profit>0){this.data.stats.wins++;this.data.stats.biggestWin=Math.max(this.data.stats.biggestWin,profit)}this.data.history.unshift({game,bet,payout,profit,result,at:Date.now()});this.data.history=this.data.history.slice(0,60);this.save();return profit}
  log(game,bet,payout,result){const profit=Math.round((payout-bet)*100)/100;this.data.stats.rounds++;if(profit>0){this.data.stats.wins++;this.data.stats.biggestWin=Math.max(this.data.stats.biggestWin,profit)}this.data.history.unshift({game,bet,payout,profit,result,at:Date.now()});this.data.history=this.data.history.slice(0,60);this.save();return profit}
  game(id){return this.data.gameState[id]||null}
  setGame(id,value){if(value==null)delete this.data.gameState[id];else this.data.gameState[id]=value;this.save()}
  addInventory(item){this.data.inventory.unshift(item);this.save()}
  removeInventory(id){this.data.inventory=this.data.inventory.filter(x=>x.id!==id);this.save()}
  reset(){localStorage.removeItem(KEY);localStorage.removeItem('steak.save.v2');localStorage.removeItem('steak.balance');localStorage.removeItem('steak.history');localStorage.removeItem('steak.crash');this.data=defaults();this.save()}
}
export const state=new Store();
