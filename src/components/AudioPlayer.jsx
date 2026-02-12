import React, { useEffect, useRef, useState } from "react";
import { sfx } from "./sfx.js";

export default function AudioPlayer({ src, title = "مقطع صوتي" }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // إعادة الضبط عند تغيير المصدر
  useEffect(() => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, [src]);

  // تحديث شريط التقدم
  const handleTimeUpdate = () => {
    if (ref.current) {
      const per = (ref.current.currentTime / ref.current.duration) * 100;
      setProgress(per);
    }
  };

  function toggle() {
    if (!ref.current || !src) return;
    sfx?.click?.();
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play();
      setPlaying(true);
    }
  }

  if (!src) {
    return <div className="small text-muted">لا يوجد ملف صوتي متاح حالياً.</div>;
  }

  return (
    <div className="audio-player-card" style={{
      background: "var(--surface-off)",
      padding: "15px",
      borderRadius: "20px",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      marginTop: "10px"
    }}>
      <style>{`
        .audio-wave { display: flex; gap: 3px; align-items: center; height: 15px; }
        .bar { width: 3px; height: 100%; background: var(--primary); border-radius: 2px; }
        .playing .bar { animation: wave 0.6s infinite ease-in-out alternate; }
        @keyframes wave { from { height: 5px; } to { height: 15px; } }
        .bar:nth-child(2) { animation-delay: 0.2s; }
        .bar:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{title}</b>
          {playing && (
            <div className="audio-wave playing">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          )}
        </div>
        
        <button 
          className={`btn ${playing ? 'danger' : 'primary'}`} 
          onClick={toggle}
          style={{
            borderRadius: "50px",
            padding: "6px 16px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
            border: playing ? "1px solid var(--danger)" : "1px solid transparent",
            backgroundColor: playing ? "var(--danger-bg)" : "var(--primary)",
            color: playing ? "var(--danger-text)" : "var(--text-on-primary)",
            fontWeight: "bold",
            transition: "0.3s"
          }}
        >
          {playing ? "إيقاف" : "تشغيل"}
        </button>
      </div>

      {/* شريط التقدم */}
      <div style={{ 
        width: "100%", 
        height: "6px", 
        background: "var(--border)", 
        borderRadius: "10px", 
        overflow: "hidden",
        position: "relative"
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: "100%", 
          background: "var(--primary)", 
          transition: "0.1s linear" 
        }}></div>
      </div>

      <audio 
        ref={ref} 
        src={src} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setPlaying(false); setProgress(0); }} 
      />
    </div>
  );
}
