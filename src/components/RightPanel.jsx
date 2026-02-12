import React, { useMemo, useState } from "react";
import LayerToggles from "./LayerToggles.jsx";
import MapClickQuiz from "./MapClickQuiz.jsx";
import MCQQuiz from "./MCQQuiz.jsx";
import DragDropMinerals from "./DragDropMinerals.jsx";
import Certificate from "./Certificate.jsx";

// زر تبويب
const TabBtn = ({ active, icon, label, onClick }) => (
  <button className={`tabBtn ${active ? "active" : ""}`} onClick={onClick}>
    <span className="tabIcon">{icon}</span>
    <span className="tabLabel">{label}</span>
  </button>
);

export default function RightPanel({
  open,
  setOpen,
  lesson,
  availableTypes,
  activeTypes,
  setActiveTypes,
  markerClickRef,
  onAward,
  onMCQAnswered,
  onTargetChange,
  points
}) {
  const [tab, setTab] = useState("layers");

  const tabs = useMemo(() => ([
    { id: "layers", label: "الطبقات", icon: "🗺️" },
    { id: "ex", label: "التحديات", icon: "🎯" },
    { id: "games", label: "الألعاب", icon: "🎮" },
    { id: "cert", label: "الشهادة", icon: "📜" }
  ]), []);

  if (!open) return null;

  // نسبة التقدم التقريبية
  const progressPercentage = Math.min((points / 100) * 100, 100);

  return (
    <aside className="rightPanel">
      {/* رأس اللوحة */}
      <div className="rightPanelHeader">
        <div className="headerTop">
          <div className="brand">
            <span className="dot"></span>
            <b>لوحة الدرس</b>
          </div>
          <button className="closeBtn" onClick={() => setOpen(false)} title="إغلاق">×</button>
        </div>
        
        {/* ملخص النقاط */}
        <div className="statsBox">
          <div className="pointsInfo">
            <span>نقاطك الحالية</span>
            <span className="pointsValue">{points} ⭐</span>
          </div>
          <div className="progressBar">
            <div className="progressFill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <nav className="tabRow">
        {tabs.map(t => (
          <TabBtn 
            key={t.id} 
            active={tab === t.id} 
            icon={t.icon} 
            label={t.label} 
            onClick={() => setTab(t.id)} 
          />
        ))}
      </nav>

      {/* محتوى التبويب */}
      <div className="rightPanelBody">
        <div className="contentWrapper">
          {tab === "layers" && (
            <div className="tabContent anim-fade">
              <h3 className="sectionTitle">تحكم في الطبقات</h3>
              <LayerToggles
                availableTypes={availableTypes}
                activeTypes={activeTypes}
                setActiveTypes={setActiveTypes}
              />
            </div>
          )}

          {tab === "ex" && (
            <div className="tabContent anim-fade">
              <h3 className="sectionTitle">تحديات الخريطة</h3>
              <MapClickQuiz
                tasks={lesson.quiz?.mapClick || []}
                onMarkerClick={markerClickRef}
                onAward={onAward}
                pointsByTask={10}
                onTargetChange={onTargetChange}
              />
              <hr className="divider" />
              <MCQQuiz
                questions={lesson.quiz?.mcq || []}
                onAnswered={onMCQAnswered}
              />
            </div>
          )}

          {tab === "games" && (
            <div className="tabContent anim-fade">
              <h3 className="sectionTitle">ألعاب سريعة</h3>
              <DragDropMinerals onAward={onAward} />
            </div>
          )}

          {tab === "cert" && (
            <div className="tabContent anim-fade">
              <Certificate points={points} />
            </div>
          )}
        </div>
      </div>
      
      {/* الدرس الحالي */}
      <div className="rightPanelFooter">
        الدرس الحالي: {lesson.title || "درس تفاعلي"}
      </div>
    </aside>
  );
}
