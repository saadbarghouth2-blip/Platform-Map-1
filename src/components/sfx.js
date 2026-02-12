/**
 * Tiny sound effects using WebAudio (no mp3 files needed).
 * Works after first user interaction in most browsers.
 */
let ctx = null;
function getCtx(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
function beep({freq=660, duration=0.08, type="sine", gain=0.06}={}){
  try{
    const ac = getCtx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + duration);
  }catch{}
}
export const sfx = {
  click(){ beep({freq:520, duration:0.05, gain:0.04}); },
  correct(){ beep({freq:880, duration:0.08, gain:0.07}); setTimeout(()=>beep({freq:1100, duration:0.07, gain:0.06}), 90); },
  wrong(){ beep({freq:180, duration:0.12, type:"square", gain:0.03}); },
  reward(){ beep({freq:740, duration:0.06, gain:0.07}); setTimeout(()=>beep({freq:990, duration:0.08, gain:0.06}), 70); setTimeout(()=>beep({freq:1320, duration:0.09, gain:0.05}), 150); }
};
