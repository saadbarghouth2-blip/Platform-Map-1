export function levelFromPoints(points){
  // Level 1 starts at 0 points
  return Math.floor(points / 50) + 1;
}

export function progressToNext(points){
  const inLevel = points % 50;
  return { inLevel, need: 50, pct: Math.round((inLevel / 50) * 100) };
}

export function levelTitle(level){
  if(level >= 8) return "أسطورة الخرائط 👑";
  if(level >= 6) return "خبير كنوز مصر 🏺";
  if(level >= 4) return "مستكشف محترف 🧭";
  if(level >= 2) return "صديق الخريطة 🗺️";
  return "مستكشف صغير 🌟";
}
