import React, { useMemo, useState, useEffect } from "react";
import { sfx } from "./sfx.js";

export default function MapClickQuiz({
  tasks = [],
  onMarkerClick,
  onAward,
  pointsByTask = 10,
  onTargetChange
}){
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState(null); // "correct" | "wrong" | null
  const [doneIds, setDoneIds] = useState({}); // taskId: true

  const current = tasks[idx] ?? null;
  const remaining = useMemo(() => tasks.filter(t => !doneIds[t.id]).length, [tasks, doneIds]);

  useEffect(() => {
    if(current?.targetPointId){
      onTargetChange?.(current.targetPointId);
    }
  }, [idx, current?.targetPointId]);

  function handleMarker(p){
    if(!current) return;
    const ok = p?.id === current.targetPointId;
    setStatus(ok ? "correct" : "wrong");

    if(ok){
      sfx.correct();
      if(!doneIds[current.id]){
        setDoneIds(prev => ({...prev, [current.id]: true}));
        onAward?.(pointsByTask);
      }
    }else{
      sfx.wrong();
    }
  }

  function next(){
    if(!current) return;
    // go to next not done
    for(let i = 1; i <= tasks.length; i++){
      const ni = (idx + i) % tasks.length;
      if(!doneIds[tasks[ni].id]){
        setIdx(ni);
        setStatus(null);
        return;
      }
    }
    // all done
    setStatus(null);
  }

  function resetTry(){
    sfx.click();
    setStatus(null);
  }

  // expose hook to parent map
  onMarkerClick.current = handleMarker;

  return (
    <div className="card">
      <div className="row">
        <b>تحدي الخريطة: حدد المكان الصحيح</b>
        <span className="small">المتبقي: {remaining}</span>
      </div>
      <div className="hr" />
      {current ? (
        <>
          <div className="notice" style={{marginBottom:10}}>
            {current.prompt}
          </div>

          {status === "correct" ? (
            <div className="notice" style={{borderColor:"var(--success)", background:"var(--success-bg)", color:"var(--success-text)"}}>
              صح! كسبت {pointsByTask} نقطة 🎉
            </div>
          ) : status === "wrong" ? (
            <div className="notice" style={{borderColor:"var(--danger)", background:"var(--danger-bg)", color:"var(--danger-text)"}}>
              قربت! جرب تاني وحدد المكان الصحيح.
            </div>
          ) : (
            <div className="small">اضغط على العلامة (Marker) على الخريطة للإجابة.</div>
          )}

          <div className="btnRow" style={{marginTop:10}}>
            <button className="btn secondary" onClick={resetTry}>أعد المحاولة</button>
            <button className="btn" onClick={()=>{ sfx.click(); next(); }} disabled={remaining===0}>التالي</button>
          </div>

          {remaining === 0 ? (
            <div className="notice" style={{marginTop:10}}>
              أحسنت! خلصت التحدي كله.
            </div>
          ) : null}
        </>
      ) : (
        <div className="small">لا توجد مهام حالياً.</div>
      )}
    </div>
  );
}
