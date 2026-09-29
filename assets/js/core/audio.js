let ctx=null,enabled=true;
export function setSoundEnabled(v){enabled=!!v}
function context(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();return ctx}
export function tone(freq=440,duration=.06,type='sine',gain=.035){
  if(!enabled)return;
  try{const c=context();const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(c.destination);const t=c.currentTime;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.start(t);o.stop(t+duration)}catch{}
}
export const sounds={tick:()=>tone(720,.035,'square',.018),hit:()=>tone(260,.07,'triangle',.03),win:()=>{tone(640,.08,'sine',.035);setTimeout(()=>tone(880,.1,'sine',.035),80)},lose:()=>tone(150,.16,'sawtooth',.025),card:()=>tone(310,.035,'triangle',.018),coin:()=>tone(980,.06,'square',.025),click:()=>tone(520,.025,'square',.014)};
