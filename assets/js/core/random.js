export function rand(){
  const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;
}
export function randInt(min,max){return Math.floor(rand()*(max-min+1))+min}
export function pick(arr){return arr[Math.floor(rand()*arr.length)]}
export function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function chance(p){return rand()<p}
