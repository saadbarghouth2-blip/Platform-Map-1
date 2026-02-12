import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "./sfx.js";

// نظام المهام داخل الخريطة
export default function QuestSystem({ onComplete }) {
  const [quests, setQuests] = useState([
    { id: 1, text: "حدد موقع السد العالي على الخريطة", target: "sadd", done: false, points: 10 },
    { id: 2, text: "ارسم منطقة محطة بنبان للطاقة الشمسية", target: "benban", done: false, points: 15 },
    { id: 3, text: "ابحث عن حقل ظهر للغاز الطبيعي", target: "zohr", done: false, points: 20 },
  ]);

  const [showBlast, setShowBlast] = useState(false);

  // تحديث المهام عند تنفيذ الهدف
  const checkQuest = (locationId) => {
    setQuests(prev => prev.map(q => {
      if (q.target === locationId && !q.done) {
        sfx?.success?.();
        setShowBlast(true);
        setTimeout(() => setShowBlast(false), 2000);
        onComplete(q.points);
        return { ...q, done: true };
      }
      return q;
    }));
  };

  return (
    <div className="quest-container" style={{
      position: "absolute", bottom: "30px", left: "30px", zIndex: 2000,
      width: "300px", pointerEvents: "auto"
    }}>
      <style>{`
        .quest-card { background: var(--surface-off); backdrop-filter: blur(10px); color: var(--ink); padding: 20px; border-radius: 25px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
        .quest-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.9rem; transition: 0.3s; }
        .quest-item.done { opacity: 0.5; text-decoration: line-through; color: var(--success); }
        .check-box { width: 20px; height: 20px; border: 2px solid var(--primary); border-radius: 5px; display: flex; align-items: center; justify-content: center; }
        .blast { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 5rem; z-index: 9999; }
      `}</style>

      {/* تأثير الاحتفال */}
      <AnimatePresence>
        {showBlast && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="blast">
            🎉✨
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="quest-card">
        <h4 style={{ margin: "0 0 15px 0", color: "var(--text-turquoise)", display: "flex", justifyContent: "space-between" }}>
          🧩 مهام الخريطة
          <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>{quests.filter(q => q.done).length}/3</span>
        </h4>

        {quests.map(q => (
          <div key={q.id} className={`quest-item ${q.done ? 'done' : ''}`}>
            <div className="check-box" style={{ borderColor: q.done ? "var(--success)" : "var(--primary)" }}>
              {q.done && "✓"}
            </div>
            {q.text}
          </div>
        ))}

        <div style={{ marginTop: "15px", fontSize: "0.75rem", color: "var(--ink-lighter)", background: "var(--glass-bg)", padding: "10px", borderRadius: "10px" }}>
          💡 تلميح: اسأل الخريطة لو محتاج مساعدة إضافية.
        </div>
      </motion.div>
    </div>
  );
}
