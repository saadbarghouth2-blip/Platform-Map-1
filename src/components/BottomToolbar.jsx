import React from "react";
import { sfx } from "./sfx.js";

const Btn = ({active, label, onClick}) => (
  <button
    className={"toolBtn " + (active ? "active" : "")}
    onMouseDown={()=>sfx.click()}
    onClick={onClick}
    title={label}
  >
    {label}
  </button>
);

export default function BottomToolbar({
  mode,
  setMode,
  zoomIn,
  zoomOut,
  resetView,
  toggleRightPanel,
  rightPanelOpen
}){
  const showPanelToggle = typeof toggleRightPanel === "function";
  return (
    <div className="bottomBar" role="toolbar" aria-label="شريط الأدوات">
      <div className="toolGroup">
        <Btn active={mode==="explore"} label="استكشاف" onClick={()=>setMode("explore")} />
        <Btn active={mode==="draw"} label="رسم" onClick={()=>setMode("draw")} />
        <Btn active={mode==="measure"} label="قياس" onClick={()=>setMode("measure")} />
        <Btn active={mode==="story"} label="قصة" onClick={()=>setMode("story")} />
      </div>

      <div className="toolGroup">
        <button className="toolBtn" onMouseDown={()=>sfx.click()} onClick={zoomIn} title="تكبير">+</button>
        <button className="toolBtn" onMouseDown={()=>sfx.click()} onClick={zoomOut} title="تصغير">−</button>
        <button className="toolBtn" onMouseDown={()=>sfx.click()} onClick={resetView} title="إعادة الضبط">⟲</button>
      </div>

      {showPanelToggle ? (
        <div className="toolGroup">
          <button
            className={"toolBtn " + (rightPanelOpen ? "active" : "")}
            onMouseDown={()=>sfx.click()}
            onClick={toggleRightPanel}
            title="لوحة الدرس"
          >
            لوحة الدرس
          </button>
        </div>
      ) : null}
    </div>
  );
}
