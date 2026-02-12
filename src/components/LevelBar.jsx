import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function LevelBar({ points = 0 }) {
  // حسابات المستوى والتقدم
  const { level, progress, title, nextGoal } = useMemo(() => {
    const lvl = Math.floor(points / 50) + 1;
    const prog = (points % 50) * 2; // النسبة المئوية (لأن كل 50 نقطة بمستوى)

    // ألقاب المستويات لتشجيع الطفل
    const titles = [
      "مستكشف مبتدئ 🌱",
      "باحث جغرافيا 🔍",
      "صديق الخريطة 🗺️",
      "صائد الكنوز 🏺",
      "خبير الأطلس 🎓",
      "بطل مصر القومي 👑"
    ];

    return {
      level: lvl,
      progress: prog,
      title: titles[Math.min(lvl - 1, titles.length - 1)],
      nextGoal: 50 - (points % 50)
    };
  }, [points]);

  return (
    <div className="card level-card" style={{
      background: "var(--glass-bg)",
      border: "1px solid var(--border)",
      padding: "20px",
      borderRadius: "25px",
      boxShadow: "var(--shadow-lg)"
    }}>
      <style>{`
        .progress-container {
          background: var(--surface-off);
          height: 16px;
          border-radius: 20px;
          margin: 12px 0;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary-light));
          border-radius: 20px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .level-badge {
          background: var(--primary);
          color: var(--text-on-primary);
          padding: 4px 12px;
          border-radius: 50px;
          font-weight: 900;
          font-size: 1.1rem;
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-light)", fontWeight: "bold" }}>رتبتك الحالية:</span>
          <h3 style={{ margin: "4px 0", color: "var(--ink)", fontSize: "1.3rem" }}>{title}</h3>
        </div>
        <div className="level-badge">المستوى {level}</div>
      </div>

      <div className="progress-container">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-turquoise)", fontWeight: "bold" }}>
          {points} نقطة إجمالية
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--ink-light)" }}>
          باقي <strong>{nextGoal}</strong> نقطة للمستوى {level + 1} 🚀
        </div>
      </div>

      {/* رسالة تشجيعية تظهر عند اقتراب المستوى */}
      {progress > 80 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-turquoise)",
            background: "var(--glass-bg)",
            border: "1px solid var(--border)",
            padding: "5px",
            borderRadius: "8px"
          }}
        >
          أنت قريب جداً! استمر في استكشاف المواقع! ✨
        </motion.div>
      )}
    </div>
  );
}
