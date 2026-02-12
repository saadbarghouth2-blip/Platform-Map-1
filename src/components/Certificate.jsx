import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { levelFromPoints, levelTitle } from "./levels.js";

async function ensureFontsReady() {
  if (!document?.fonts) return;
  try {
    await document.fonts.load("700 54px Cairo");
    await document.fonts.load("600 32px Cairo");
    await document.fonts.ready;
  } catch {}
}

function drawCertificateCanvas({ student, title, points }) {
  const width = 1400;
  const height = 990;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f5f7ff";
  ctx.fillRect(0, 0, width, height);

  // Frame
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Text setup
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1f2a";
  ctx.font = "700 54px Cairo, Tahoma, Arial";
  ctx.fillText("شهادة إنجاز", width / 2, 170);

  ctx.fillStyle = "#6b7280";
  ctx.font = "400 22px Cairo, Tahoma, Arial";
  ctx.fillText("تشهد منصة كنوز مصر أن الطالب/ة", width / 2, 220);

  ctx.fillStyle = "#2563eb";
  ctx.font = "700 40px Cairo, Tahoma, Arial";
  ctx.fillText(student, width / 2, 340);

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "400 24px Cairo, Tahoma, Arial";
  ctx.fillText("قد أتم بنجاح مستوى:", width / 2, 420);

  ctx.fillStyle = "#7c3aed";
  ctx.font = "700 32px Cairo, Tahoma, Arial";
  ctx.fillText(title, width / 2, 470);

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "400 24px Cairo, Tahoma, Arial";
  ctx.fillText(`إجمالي النقاط: ${points}`, width / 2, 530);

  // Footer
  const dateStr = new Date().toLocaleDateString("ar-EG");
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 18px Cairo, Tahoma, Arial";
  ctx.textAlign = "left";
  ctx.fillText(`التاريخ: ${dateStr}`, 80, height - 80);

  ctx.textAlign = "right";
  ctx.fillText("إدارة المنصة: كنوز مصر", width - 80, height - 80);

  return canvas;
}

export default function Certificate({ points = 0 }) {
  const [name, setName] = useState("");

  const level = useMemo(() => levelFromPoints(points), [points]);
  const title = useMemo(() => levelTitle(level), [level]);

  async function download() {
    const student = (name || "").trim();
    if (!student) {
      alert("من فضلك اكتب اسمك أولاً.");
      return;
    }

    await ensureFontsReady();
    const canvas = drawCertificateCanvas({ student, title, points });
    const img = canvas.toDataURL("image/png");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    doc.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    doc.save(`شهادة-كنوز-مصر-${student}.pdf`);
  }

  return (
    <div className="card">
      <div className="row">
        <b>شهادة الإنجاز (PDF)</b>
        <span className="small">اطبع شهادتك وشارك نجاحك.</span>
      </div>
      <div className="hr" />
      <div className="small" style={{ marginBottom: 8 }}>
        سجّل اسمك علشان يظهر في الشهادة.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك الكامل"
          className="kidInput"
          style={{ flex: "1 1 200px" }}
        />
        <button className="btn" onClick={download}>
          تحميل الشهادة
        </button>
      </div>
      <div className="hr" />
      <div className="small">
        لقبك الحالي: <b>{title}</b> (المستوى {level})
      </div>
    </div>
  );
}
