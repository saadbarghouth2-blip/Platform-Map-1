import React, { useState } from "react";
import { sfx } from "./sfx.js";
import { motion, AnimatePresence } from "framer-motion";

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="#e5e7eb"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em"
      font-family="Tajawal, Arial, sans-serif" font-size="32" fill="#64748b"
      direction="rtl">الصورة غير متاحة</text>
  </svg>
`)}`;

export default function ImageGallery({ images = [] }) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 20, color: "var(--ink-lighter)" }}>
        لا توجد صور متاحة حالياً.
      </div>
    );
  }

  const safeIndex = Math.max(0, Math.min(index, images.length - 1));
  const current = images[safeIndex];

  function prev() {
    sfx?.click?.();
    setIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }

  function next() {
    sfx?.click?.();
    setIndex((prevIndex) => (prevIndex + 1) % images.length);
  }

  return (
    <div className="gallery-container" style={{ position: "relative" }}>
      {/* الصورة الرئيسية */}
      <div
        className="galleryFrame"
        style={{
          position: "relative",
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid var(--border)",
          height: 250,
          background: "var(--surface-off)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            alt={`صورة ${safeIndex + 1}`}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              cursor: "pointer",
            }}
            onError={(e) => {
              if (e.currentTarget.dataset.fallback) return;
              e.currentTarget.dataset.fallback = "1";
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </AnimatePresence>

        {/* مؤشر الصور */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            backdropFilter: "blur(4px)",
          }}
        >
          {safeIndex + 1} من {images.length}
        </div>
      </div>

      {/* أزرار التنقل */}
      <div
        style={{
          display: "flex",
          marginTop: 16,
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          className="btn"
          onClick={prev}
          aria-label="الصورة السابقة"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--primary)",
            color: "var(--ink)",
            borderRadius: "50%",
            width: 45,
            height: 45,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ??
        </button>

        {/* نقاط التنقل */}
        <div style={{ display: "flex", gap: 6 }}>
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === safeIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === safeIndex ? "var(--primary)" : "var(--border-strong)",
                transition: "0.3s",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        <button
          className="btn"
          onClick={next}
          aria-label="الصورة التالية"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--primary)",
            color: "var(--ink)",
            borderRadius: "50%",
            width: 45,
            height: 45,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ??
        </button>
      </div>

      <style>{`
        .galleryFrame:hover img { transform: scale(1.05); transition: 0.5s; }
      `}</style>
    </div>
  );
}
