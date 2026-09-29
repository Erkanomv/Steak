import{TOKEN_SRC}from'./ui.js';
export function shell(root,{title,subtitle='',controls,stage,info=[]}){
  root.innerHTML=`<div class="game-page">
    <div class="game-room-head">
      <div class="game-breadcrumb"><a href="#/">Casino</a><span>/</span><b>${title}</b></div>
      <div class="room-actions"><button class="room-action" title="Play money">PLAY</button><button class="room-action" title="Local session">LOCAL</button></div>
    </div>
    <div class="game-room">
      <aside class="game-controls">
        <div class="control-tabs"><button class="active">Manual</button><button disabled>Auto</button></div>
        <div class="game-control-title"><h1>${title}</h1><p>${subtitle}</p></div>
        <div class="control-stack">${controls}</div>
        <div class="game-safe-note"><img src="${TOKEN_SRC}" alt=""><div><b>Play credits only</b><span>No deposits, withdrawals or cash value.</span></div></div>
      </aside>
      <section class="game-stage">${stage}</section>
    </div>
    <div class="game-room-foot">
      <div class="room-meta"><span class="dot-live"></span><b>Steak Originals</b><span>Browser session</span></div>
      <div class="room-links"><span>Saved locally</span><span>Sound enabled</span></div>
    </div>
    ${info.length?`<div class="game-info-strip">${info.map(x=>`<div class="info-card"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>`:''}
  </div>`
}
