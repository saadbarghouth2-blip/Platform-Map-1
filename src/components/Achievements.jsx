import React, { useMemo } from "react";
import { levelFromPoints, levelTitle } from "./levels.js";

const badgeDefs = [
  { id: "b1", name: "مستكشف صغير", need: 20, icon: "🌟" },
  { id: "b2", name: "رحّالة نشيط", need: 50, icon: "🧭" },
  { id: "b3", name: "جامع الكنوز", need: 90, icon: "🏺" },
  { id: "b4", name: "خبير الخريطة", need: 140, icon: "🗺️" },
];

export default function Achievements({ points=0 }){
  const unlocked = useMemo(() => badgeDefs.map(b => ({...b, ok: points >= b.need})), [points]);
  const lvl = useMemo(() => levelFromPoints(points), [points]);
  const ttl = useMemo(() => levelTitle(lvl), [lvl]);

  return (
    <div className="card">
      <div className="row">
        <b>شارات الإنجاز</b>
        <span className="small">كل ما تجمع نقاط أكتر، تفتح شارات جديدة</span>
      </div>
      <div className="hr" />
      <div className="notice" style={{ marginBottom: 10 }}>
        مستواك الحالي: <b>{lvl}</b> · {ttl}
      </div>
      <div className="badgeGrid">
        {unlocked.map(b => (
          <div key={b.id} className={"kidBadge " + (b.ok ? "on" : "off")}>
            <div className="kidBadgeIcon">{b.icon}</div>
            <div className="kidBadgeName">{b.name}</div>
            <div className="kidBadgeNeed">{b.ok ? "مفتوحة!" : `عند ${b.need} نقطة`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
