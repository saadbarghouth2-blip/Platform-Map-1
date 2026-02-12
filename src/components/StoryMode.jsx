import React, { useEffect, useMemo, useState } from "react";
import { sfx } from "./sfx.js";

export default function StoryMode({
  points = [],
  onFocusPoint,
  onAward,
  active = false,
  autoPlay = false
}){
  const steps = useMemo(() => points.slice(0, 10), [points]); // first 10 points as story
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if(!steps.length) return;
    onFocusPoint?.(steps[i]);
  }, [i, steps.length]);

  useEffect(() => {
    if(!playing) return;
    const t = setInterval(() => {
      setI(prev => (prev + 1) % steps.length);
    }, 2200);
    return () => clearInterval(t);
  }, [playing, steps.length]);

  useEffect(() => {
    if(!active){
      setPlaying(false);
      return;
    }
    setI(0);
    if(autoPlay) setPlaying(true);
  }, [active, autoPlay]);

  function next(){ sfx.click(); setI((i+1) % steps.length); }
  function prev(){ sfx.click(); setI((i-1+steps.length) % steps.length); }
  function toggle(){ sfx.click(); setPlaying(!playing); }
  function reward(){
    onAward?.(5);
    sfx.reward();
  }

  if(!steps.length) return (
    <div className="card">
      <b>وضع الحكاية</b>
      <div className="small">لا توجد نقاط كافية لعرض القصة.</div>
    </div>
  );

  const cur = steps[i];

  return (
    <div className="card">
      <div className="row">
        <b>وضع الحكاية (رحلة عبر المواقع)</b>
        <span className="small">استمع وشاهد الأماكن</span>
      </div>
      <div className="hr" />

      <div className="notice" style={{marginBottom:10}}>
        <b>{cur.name}</b>
        <div className="small" style={{marginTop:4}}>{cur.info}</div>
      </div>

      <div className="btnRow">
        <button className="btn secondary" onClick={prev}>السابق</button>
        <button className="btn" onClick={toggle}>{playing ? "إيقاف" : "تشغيل"}</button>
        <button className="btn secondary" onClick={next}>التالي</button>
      </div>

      <div className="hr" />
      <div className="row">
        <div className="small">عايز مكافأة على الرحلة؟</div>
        <button className="btn" onClick={reward}>احصل عليها</button>
      </div>

      <div className="hr" />
      <div className="small">الخطوة {i+1} من {steps.length}</div>
      <div className="progressWrap" style={{marginTop:8}}>
        <div className="progressBar" style={{width: `${Math.round(((i+1)/steps.length)*100)}%`}} />
      </div>
    </div>
  );
}
