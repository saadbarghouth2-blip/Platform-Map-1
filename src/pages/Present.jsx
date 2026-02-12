import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaPanel({ point }) {
  const [activeTab, setActiveTab] = useState("media"); // media, info, stats

  if (!point) {
    return (
      <div className="card empty-panel" style={emptyPanelStyle}>
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🗺️</div>
          <p>اختر نقطة من الخريطة لعرض التفاصيل هنا...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card media-panel-pro"
      style={panelStyle}
    >
      <div className="tabs-nav" style={tabsStyle}>
        <button className={activeTab === "media" ? "tab active" : "tab"} onClick={() => setActiveTab("media")}>
          الوسائط
        </button>
        <button className={activeTab === "info" ? "tab active" : "tab"} onClick={() => setActiveTab("info")}>
          معلومات
        </button>
        <button className={activeTab === "stats" ? "tab active" : "tab"} onClick={() => setActiveTab("stats")}>
          إحصائيات
        </button>
      </div>

      <div className="panel-content" style={{ padding: "20px", position: "relative" }}>
        <AnimatePresence mode="wait">
          {activeTab === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="media-container" style={mediaContainerStyle}>
                <img
                  src={point.image || `https://source.unsplash.com/featured/?egypt,${point.type}`}
                  alt={point.name}
                  style={imageStyle}
                />
                <div className="media-overlay">
                  <span className="badge">صورة HD</span>
                </div>
              </div>
              <h3 style={{ marginTop: "15px", color: "var(--text-turquoise)" }}>{point.name}</h3>
            </motion.div>
          )}

          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={infoContentStyle}
            >
              <div className="info-grid">
                <div className="info-item">
                  <strong>الموقع:</strong>
                  <span>{point.location || "غير محدد"}</span>
                </div>
                <div className="info-item">
                  <strong>الفئة:</strong>
                  <span>{point.category || point.type || "غير محدد"}</span>
                </div>
              </div>
              <p style={{ lineHeight: "1.8", color: "var(--ink-light)" }}>{point.description || point.info}</p>
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stats-bars">
                <StatBar label="الأهمية الجغرافية" value={95} color="#10b981" />
                <StatBar label="القيمة الاقتصادية" value={70} color="#38bdf8" />
                <StatBar label="الأثر البيئي" value={85} color="#fbbf24" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .media-panel-pro { background: var(--glass-bg); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; height: 500px; }
        .tabs-nav { display: flex; background: var(--surface-off); padding: 5px; gap: 5px; }
        .tab { flex: 1; padding: 12px; border: none; background: transparent; color: var(--ink-light); cursor: pointer; border-radius: 12px; transition: 0.3s; font-weight: bold; }
        .tab.active { background: var(--primary-gradient); color: var(--text-on-primary); box-shadow: var(--shadow-md); }
        .media-container { position: relative; border-radius: 15px; overflow: hidden; height: 250px; box-shadow: 0 10px 30px rgba(15,23,42,0.12); }
        .media-overlay { position: absolute; top: 10px; right: 10px; }
        .badge { background: var(--secondary); color: var(--text-on-warm); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; animation: blink 1s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: var(--surface-off); padding: 15px; border-radius: 12px; }
        .stats-bars { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
      `}</style>
    </motion.div>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div style={{ width: "100%", height: "8px", background: "var(--surface-off)", borderRadius: "10px" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: "10px", boxShadow: `0 6px 14px ${color}40` }}
        />
      </div>
    </div>
  );
}

const panelStyle = { display: "flex", flexDirection: "column" };
const emptyPanelStyle = { height: "500px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--ink-light)", border: "2px dashed var(--border)" };
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };
const infoContentStyle = { textAlign: "right" };
const tabsStyle = { display: "flex" };
const mediaContainerStyle = { position: "relative" };
