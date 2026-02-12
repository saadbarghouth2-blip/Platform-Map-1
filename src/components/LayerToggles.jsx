import React from "react";
import { typeMeta } from "../data/legend.js";

export default function LayerToggles({ availableTypes = [], activeTypes, setActiveTypes }){
  function toggle(t){
    setActiveTypes(prev => ({ ...prev, [t]: !prev[t] }));
  }

  return (
    <div className="card">
      <div className="row">
        <b>الطبقات</b>
        <span className="small">إظهار/إخفاء</span>
      </div>
      <div className="hr" />
      <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
        {availableTypes.map(t => (
          <button
            key={t}
            className="btn secondary"
            style={{
              borderRadius:999,
              padding:"8px 10px",
              borderColor: activeTypes?.[t] ? "rgba(37,99,235,.45)" : undefined
            }}
            onClick={() => toggle(t)}
          >
            {activeTypes?.[t] ? "✅ " : "⬜ "}
            {typeMeta[t]?.label ?? t}
          </button>
        ))}
      </div>
      <div className="small" style={{marginTop:10}}>
        نصيحة: قلّل عدد الطبقات علشان تركّز وتكتشف أسرع.
      </div>
    </div>
  );
}
