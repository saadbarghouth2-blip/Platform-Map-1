import React, { useEffect, useMemo, useState } from "react";
import { lessons } from "../data/lessons.js";
import { typeMeta } from "../data/legend.js";
import MediaPanel from "./MediaPanel.jsx";

const STOP_WORDS = new Set([
  "من",
  "في",
  "على",
  "عن",
  "الى",
  "إلى",
  "ما",
  "ماذا",
  "ايه",
  "اي",
  "هو",
  "هي",
  "ال",
  "اللي",
  "ليه",
  "ازاي",
  "كم",
  "أين",
  "فين",
  "ده",
  "دي",
]);

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "") {
  const norm = normalizeText(value);
  if (!norm) return [];
  return norm
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function scoreText(text, tokens, rawQuery) {
  if (!text) return 0;
  const hay = normalizeText(text);
  if (!hay) return 0;

  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  if (rawQuery && hay.includes(rawQuery)) score += 4;
  return score;
}

function hashString(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function pickOptions(correctKey, keys, seed) {
  const list = keys.filter((k) => k !== correctKey);
  if (!list.length) return [correctKey];

  const picked = [correctKey, list[seed % list.length], list[(seed * 7 + 3) % list.length]];
  const unique = Array.from(new Set(picked));

  while (unique.length < Math.min(3, keys.length)) {
    const next = list[(seed + unique.length * 11) % list.length];
    if (!unique.includes(next)) unique.push(next);
  }

  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 13) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildKnowledge(lessonsData) {
  const items = [];
  lessonsData.forEach((lesson) => {
    (lesson.objectives || []).forEach((objective, idx) => {
      items.push({
        id: `obj-${lesson.id}-${idx}`,
        kind: "هدف تعليمي",
        title: lesson.title,
        text: objective,
        lessonTitle: lesson.title,
        searchText: normalizeText(`${objective} ${lesson.title}`),
      });
    });

    (lesson.sections || []).forEach((section, sIdx) => {
      (section.bullets || []).forEach((bullet, bIdx) => {
        items.push({
          id: `sec-${lesson.id}-${sIdx}-${bIdx}`,
          kind: section.heading,
          title: lesson.title,
          text: bullet,
          lessonTitle: lesson.title,
          searchText: normalizeText(`${section.heading} ${bullet} ${lesson.title}`),
        });
      });
    });

    (lesson.points || []).forEach((point) => {
      const typeLabel = typeMeta?.[point.type]?.label ?? point.type;
      const tags = [point.name, typeLabel, ...(point.keywords || [])].filter(Boolean).join(" ");
      const base = `${point.name} ${point.info || ""} ${point.story || ""} ${point.educationalContent || ""} ${point.funFact || ""} ${tags}`;

      items.push({
        id: `point-${point.id}`,
        kind: "نقطة على الخريطة",
        title: point.name,
        text: point.info || point.story || point.educationalContent || "",
        lessonTitle: lesson.title,
        point,
        searchText: normalizeText(base),
      });

      (point.quickFacts || []).forEach((fact, fIdx) => {
        items.push({
          id: `fact-${point.id}-${fIdx}`,
          kind: "معلومة سريعة",
          title: point.name,
          text: fact,
          lessonTitle: lesson.title,
          point,
          searchText: normalizeText(`${fact} ${point.name} ${tags}`),
        });
      });

      if (point.funFact) {
        items.push({
          id: `fun-${point.id}`,
          kind: "حقيقة ممتعة",
          title: point.name,
          text: point.funFact,
          lessonTitle: lesson.title,
          point,
          searchText: normalizeText(`${point.funFact} ${point.name} ${tags}`),
        });
      }
    });
  });

  return items;
}

function buildMissions(points = []) {
  const counts = points.reduce((acc, point) => {
    acc[point.type] = (acc[point.type] || 0) + 1;
    return acc;
  }, {});

  const templates = [
    {
      id: "m-energy",
      type: "energy_renew",
      target: 3,
      reward: 15,
      label: (count) => (count === 1 ? "اكتشف موقع طاقة متجددة" : `اكتشف ${count} مواقع طاقة متجددة`),
    },
    {
      id: "m-water",
      type: "fresh",
      target: 2,
      reward: 10,
      label: (count) => (count === 1 ? "زور موقع مياه عذبة" : `زور ${count} مواقع مياه عذبة`),
    },
    {
      id: "m-projects",
      type: "projects",
      target: 1,
      reward: 10,
      label: (count) => (count === 1 ? "اعرف مكان مشروع قومي واحد" : `اعرف ${count} مشروعات قومية`),
    },
    {
      id: "m-minerals",
      type: "minerals",
      target: 2,
      reward: 10,
      label: (count) => (count === 1 ? "اكتشف معدن مهم" : `اكتشف ${count} معادن مهمة`),
    },
  ];

  return templates
    .map((template) => {
      const available = counts[template.type] || 0;
      if (!available) return null;
      const count = Math.min(template.target, available);
      return {
        id: template.id,
        type: template.type,
        count,
        reward: template.reward,
        label: template.label(count),
      };
    })
    .filter(Boolean);
}

export default function MapCompanion({
  points = [],
  lessonId,
  selectedPoint,
  onSelectPoint,
  onHighlightPoint,
  onFlyTo,
  onAward,
  activeTypes,
  setActiveTypes,
  layout = "float",
  defaultTab = "ask",
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [tab, setTab] = useState(defaultTab);
  const [askQuery, setAskQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pointQuizState, setPointQuizState] = useState({});

  const [visited, setVisited] = useState([]);
  const [doneMissions, setDoneMissions] = useState({});

  const scopedLessons = useMemo(() => {
    if (!lessonId) return lessons;
    return lessons.filter((lesson) => lesson.id === lessonId);
  }, [lessonId]);

  const knowledgeItems = useMemo(() => buildKnowledge(scopedLessons), [scopedLessons]);
  const missions = useMemo(() => buildMissions(points), [points]);
  const typeKeys = useMemo(() => Object.keys(typeMeta || {}), []);
  const layerKeys = useMemo(() => Object.keys(activeTypes || {}), [activeTypes]);

  const pointById = useMemo(() => {
    const map = new Map();
    (points || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [points]);

  useEffect(() => {
    setVisited([]);
    setDoneMissions({});
    setPointQuizState({});
    setAnswer(null);
    setSearchQuery("");
    setAskQuery("");
    setTab(defaultTab);
  }, [lessonId, defaultTab]);

  useEffect(() => {
    if (!selectedPoint?.id) return;
    setVisited((prev) => (prev.includes(selectedPoint.id) ? prev : [...prev, selectedPoint.id]));
  }, [selectedPoint?.id]);

  useEffect(() => {
    missions.forEach((mission) => {
      if (doneMissions[mission.id]) return;
      const count = visited.reduce((acc, id) => {
        const point = pointById.get(id);
        if (!point) return acc;
        if (point.type === mission.type) return acc + 1;
        return acc;
      }, 0);

      if (count >= mission.count) {
        setDoneMissions((prev) => ({ ...prev, [mission.id]: true }));
        onAward?.(mission.reward);
      }
    });
  }, [visited, missions, doneMissions, pointById, onAward]);

  const searchResults = useMemo(() => {
    const tokens = tokenize(searchQuery);
    if (!tokens.length) return [];

    return points
      .map((p) => {
        const text = [p.name, p.info, p.story, p.educationalContent, p.funFact, ...(p.keywords || [])]
          .filter(Boolean)
          .join(" ");
        const score = scoreText(text, tokens, normalizeText(searchQuery));
        return score > 0 ? { point: p, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [searchQuery, points]);

  function handleAsk(nextQuery) {
    const query = typeof nextQuery === "string" ? nextQuery : askQuery;
    const tokens = tokenize(query);
    if (!tokens.length) return;
    const raw = normalizeText(query);

    const ranked = knowledgeItems
      .map((item) => {
        const score = scoreText(item.searchText, tokens, raw);
        return score > 0 ? { ...item, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const relatedPoints = points
      .map((p) => {
        const text = [p.name, p.info, p.story, p.educationalContent, p.funFact, ...(p.keywords || [])]
          .filter(Boolean)
          .join(" ");
        const score = scoreText(text, tokens, raw);
        return score > 0 ? { point: p, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.point);

    setAnswer({
      query,
      facts: ranked,
      relatedPoints,
    });
  }

  function selectPoint(point) {
    if (!point) return;
    onSelectPoint?.(point);
    onHighlightPoint?.(point.id);
    onFlyTo?.([point.lat, point.lng], 13);
  }

  function randomFact() {
    const list = knowledgeItems;
    if (!list.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    setAnswer({ query: "معلومة عشوائية", facts: [pick], relatedPoints: pick.point ? [pick.point] : [] });
  }

  const totalPoints = points.length;
  const visitedCount = visited.length;

  const quickQuiz = useMemo(() => {
    if (!selectedPoint || !typeKeys.length) return null;
    const seed = hashString(selectedPoint.id || selectedPoint.name || selectedPoint.type);
    return {
      correctKey: selectedPoint.type,
      options: pickOptions(selectedPoint.type, typeKeys, seed),
    };
  }, [selectedPoint?.id, selectedPoint?.name, selectedPoint?.type, typeKeys]);

  const quizState = selectedPoint ? pointQuizState[selectedPoint.id] : null;

  function answerPointQuiz(optionKey) {
    if (!selectedPoint) return;
    if (pointQuizState[selectedPoint.id]?.answered) return;
    const correct = optionKey === selectedPoint.type;
    setPointQuizState((prev) => ({
      ...prev,
      [selectedPoint.id]: { answered: true, correct, choice: optionKey },
    }));
    if (correct) onAward?.(5);
  }

  return (
    <div className={`map-companion ${panelOpen ? "open" : "closed"} ${layout === "side" ? "side" : "float"}`}>
      <div className="map-companion-header">
        <div>
          <div className="map-companion-title">مركز الخريطة الذكي</div>
          <div className="map-companion-sub">اسأل، اكتشف، نفّذ مهام</div>
        </div>
        <button type="button" className="map-companion-toggle" onClick={() => setPanelOpen((v) => !v)}>
          {panelOpen ? "تصغير" : "فتح"}
        </button>
      </div>

      {panelOpen ? (
        <>
          <div className="map-companion-chips">
            <span className="chip muted">خريطة الدرس</span>
            <span className="chip muted">النقاط: {totalPoints}</span>
            <span className="chip muted">المُزار: {visitedCount}</span>
          </div>

          {selectedPoint ? (
            <div className="selected-card">
              <div className="selected-title">{selectedPoint.name}</div>
              <div className="selected-meta">
                {typeMeta?.[selectedPoint.type]?.label ?? selectedPoint.type}
              </div>
              <div className="selected-actions">
                <button type="button" onClick={() => selectPoint(selectedPoint)}>انتقال</button>
                <button type="button" className="ghost" onClick={() => setTab("media")}>الوسائط</button>
              </div>
            </div>
          ) : null}

          <div className="map-companion-tabs">
            <button className={tab === "ask" ? "active" : ""} onClick={() => setTab("ask")}>اسأل الخريطة</button>
            <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>بحث سريع</button>
            <button className={tab === "missions" ? "active" : ""} onClick={() => setTab("missions")}>مهام</button>
            <button className={tab === "media" ? "active" : ""} onClick={() => setTab("media")}>وسائط</button>
            <button className={tab === "layers" ? "active" : ""} onClick={() => setTab("layers")}>طبقات</button>
          </div>

          <div className="map-companion-body">
            {tab === "ask" ? (
              <div className="tab-block">
                <label>اسأل عن أي مكان أو فكرة</label>
                <div className="input-row">
                  <input
                    value={askQuery}
                    onChange={(e) => setAskQuery(e.target.value)}
                    placeholder="مثال: ما هي الطاقة المتجددة؟"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAsk();
                    }}
                  />
                  <button type="button" onClick={handleAsk}>اسأل</button>
                </div>
                <div className="suggestions">
                  {[
                    "أين منجم السكري؟",
                    "ما هي الرمال السوداء؟",
                    "أين نهر النيل؟",
                    "اشرح الطاقة الشمسية",
                    "ما الفرق بين المتجددة وغير المتجددة؟",
                    "أين تقع محطة بحر البقر؟",
                  ].map((s) => (
                    <button key={s} type="button" onClick={() => { setAskQuery(s); handleAsk(s); }}>
                      {s}
                    </button>
                  ))}
                  <button type="button" className="ghost" onClick={randomFact}>معلومة عشوائية</button>
                </div>

                {selectedPoint && quickQuiz ? (
                  <div className="quick-quiz">
                    <div className="quick-quiz-title">سؤال سريع عن {selectedPoint.name}</div>
                    <div className="quick-quiz-sub">ما نوع هذا المورد؟</div>
                    <div className="quick-quiz-options">
                      {quickQuiz.options.map((opt) => {
                        const isCorrect = opt === quickQuiz.correctKey;
                        const isChosen = quizState?.choice === opt;
                        const answered = Boolean(quizState?.answered);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => answerPointQuiz(opt)}
                            className={[
                              "quiz-option",
                              answered && isCorrect ? "correct" : "",
                              answered && isChosen && !isCorrect ? "wrong" : "",
                            ].join(" ")}
                            disabled={answered}
                          >
                            {typeMeta?.[opt]?.label ?? opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizState?.answered ? (
                      <div className={`quiz-feedback ${quizState.correct ? "correct" : "wrong"}`}>
                        {quizState.correct ? "إجابة صحيحة! +5 نقاط" : "قريبة! جرّب سؤال تاني."}
                      </div>
                    ) : (
                      <div className="quiz-hint">اختر الإجابة الصحيحة لتحصل على نقاط إضافية.</div>
                    )}
                  </div>
                ) : null}

                {answer ? (
                  <div className="answer-card">
                    <div className="answer-title">نتيجة: {answer.query}</div>
                    {answer.facts?.length ? (
                      <ul className="answer-list">
                        {answer.facts.map((fact) => (
                          <li key={fact.id}>
                            <div className="fact-kind">{fact.kind}</div>
                            <div className="fact-text">{fact.text}</div>
                            {fact.lessonTitle ? <div className="fact-source">المصدر: {fact.lessonTitle}</div> : null}
                            {fact.point ? (
                              <button type="button" className="link-btn" onClick={() => selectPoint(fact.point)}>
                                اعرض على الخريطة
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty">لا توجد إجابة مباشرة، جرّب صياغة أخرى.</div>
                    )}

                    {answer.relatedPoints?.length ? (
                      <div className="related">
                        <div className="related-title">أماكن مرتبطة</div>
                        <div className="related-list">
                          {answer.relatedPoints.map((p) => (
                            <button key={p.id} type="button" onClick={() => selectPoint(p)}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="empty">اكتب سؤالك وسيتم البحث في محتوى الدروس والخريطة.</div>
                )}
              </div>
            ) : null}

            {tab === "search" ? (
              <div className="tab-block">
                <label>ابحث عن موقع أو مورد</label>
                <div className="input-row">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="مثال: الغاز، محطة، بحيرة"
                  />
                </div>

                {searchQuery.trim() ? (
                  <div className="search-results">
                    {searchResults.length ? (
                      searchResults.map((result) => (
                        <button key={result.point.id} type="button" className="result-card" onClick={() => selectPoint(result.point)}>
                          <div className="result-title">{result.point.name}</div>
                          <div className="result-sub">{result.point.info || result.point.story}</div>
                        </button>
                      ))
                    ) : (
                      <div className="empty">لا توجد نتائج مطابقة.</div>
                    )}
                  </div>
                ) : (
                  <div className="empty">ابدأ بالبحث لترى النتائج هنا.</div>
                )}
              </div>
            ) : null}

            {tab === "missions" ? (
              <div className="tab-block">
                <div className="missions-header">
                  <span>مهام الاستكشاف</span>
                  <span>{Object.keys(doneMissions).length}/{missions.length}</span>
                </div>
                <div className="missions-list">
                  {missions.map((mission) => {
                    const done = doneMissions[mission.id];
                    const progress = visited.reduce((acc, id) => {
                      const point = pointById.get(id);
                      if (!point) return acc;
                      if (point.type === mission.type) return acc + 1;
                      return acc;
                    }, 0);

                    return (
                      <div key={mission.id} className={`mission ${done ? "done" : ""}`}>
                        <div>
                          <div className="mission-title">{mission.label}</div>
                          <div className="mission-sub">{Math.min(progress, mission.count)}/{mission.count} · +{mission.reward} نقطة</div>
                        </div>
                        <span className="mission-status">{done ? "✅" : "⏳"}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="empty">اختر نقاطاً من الخريطة لتكمل المهام.</div>
              </div>
            ) : null}

            {tab === "media" ? (
              <div className="tab-block media-tab">
                {selectedPoint ? (
                  <MediaPanel point={selectedPoint} />
                ) : (
                  <div className="empty">اختر نقطة من الخريطة لعرض الوسائط.</div>
                )}
              </div>
            ) : null}

            {tab === "layers" ? (
              <div className="tab-block">
                <label>تحكم في الطبقات</label>
                {layerKeys.length ? (
                  <div className="layers-grid">
                    {layerKeys.map((key) => {
                      const meta = typeMeta[key] || {};
                      return (
                        <button
                          key={key}
                          type="button"
                          className={activeTypes?.[key] === false ? "layer-btn off" : "layer-btn"}
                          onClick={() =>
                            setActiveTypes?.((prev) => {
                              const current = prev?.[key];
                              const next = current === false ? true : false;
                              return { ...prev, [key]: next };
                            })
                          }
                        >
                          <span>{meta.emoji}</span>
                          {meta.label || key}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty">لا توجد طبقات متاحة لهذه الخريطة.</div>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <style>{`
        .map-companion {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 360px;
          max-height: calc(100% - 32px);
          background: var(--glass-bg);
          border-radius: 18px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 900;
          direction: rtl;
        }
        .map-companion.side {
          position: relative;
          top: auto;
          right: auto;
          width: 100%;
          max-height: 650px;
          z-index: 2;
        }
        .map-companion-header {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface-off);
          color: var(--ink);
        }
        .map-companion-title {
          font-weight: 700;
          font-size: 1rem;
        }
        .map-companion-sub {
          font-size: 0.75rem;
          color: var(--ink-light);
        }
        .map-companion-toggle {
          border: none;
          background: var(--primary);
          color: var(--text-on-primary);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
        }
        .map-companion-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px 12px;
        }
        .selected-card {
          margin: 0 12px 10px;
          background: var(--surface-off);
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid var(--border);
        }
        .selected-title {
          font-weight: 700;
          color: var(--ink);
        }
        .selected-meta {
          font-size: 0.75rem;
          color: var(--text-turquoise);
          margin-top: 4px;
        }
        .selected-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .selected-actions button {
          border: none;
          background: var(--primary);
          color: var(--text-on-primary);
          padding: 6px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .selected-actions .ghost {
          background: var(--glass-bg);
          color: var(--ink);
          border: 1px solid var(--border);
        }
        .chip {
          border: none;
          background: var(--surface-off);
          color: var(--ink);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .chip.muted {
          background: var(--surface-off);
          color: var(--ink-light);
          cursor: default;
        }
        .map-companion-tabs {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          padding: 0 12px 10px;
        }
        .map-companion-tabs button {
          border: none;
          background: var(--surface-off);
          color: var(--ink);
          border-radius: 10px;
          padding: 6px 4px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .map-companion-tabs button.active {
          background: var(--primary);
          color: var(--text-on-primary);
        }
        .map-companion-body {
          padding: 0 12px 12px;
          overflow: auto;
        }
        .tab-block label {
          font-weight: 700;
          font-size: 0.85rem;
          display: block;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .input-row input {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
        }
        .input-row button {
          background: var(--primary);
          color: var(--text-on-primary);
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          cursor: pointer;
        }
        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .suggestions button {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .suggestions .ghost {
          background: var(--surface-off);
          border-color: var(--border);
          color: var(--text-turquoise);
        }
        .answer-card {
          background: var(--surface-off);
          border-radius: 14px;
          padding: 12px;
          border: 1px solid var(--border);
          color: var(--ink);
        }
        .quick-quiz {
          background: var(--glass-bg);
          border-radius: 14px;
          padding: 12px;
          border: 1px solid var(--border);
          margin-bottom: 12px;
        }
        .quick-quiz-title {
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .quick-quiz-sub {
          font-size: 0.8rem;
          color: var(--ink-light);
          margin-bottom: 8px;
        }
        .quick-quiz-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .quiz-option {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          border-radius: 10px;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .quiz-option.correct {
          background: var(--success);
          color: var(--text-on-success);
          border-color: var(--success);
        }
        .quiz-option.wrong {
          background: var(--error);
          color: var(--text-on-primary);
          border-color: var(--error);
        }
        .quiz-feedback {
          margin-top: 8px;
          font-size: 0.75rem;
          padding: 6px 8px;
          border-radius: 8px;
        }
        .quiz-feedback.correct {
          background: var(--success);
          color: var(--text-on-success);
        }
        .quiz-feedback.wrong {
          background: var(--error);
          color: var(--text-on-primary);
        }
        .quiz-hint {
          margin-top: 8px;
          font-size: 0.75rem;
          color: var(--ink-light);
        }
        .answer-title {
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--ink);
        }
        .answer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
        }
        .answer-list li {
          background: var(--surface);
          border-radius: 12px;
          padding: 8px 10px;
          border: 1px solid var(--border);
        }
        .fact-kind {
          font-size: 0.7rem;
          color: var(--text-turquoise);
          font-weight: bold;
        }
        .fact-text {
          font-size: 0.85rem;
          margin: 4px 0;
          color: var(--ink);
        }
        .fact-source {
          font-size: 0.7rem;
          color: var(--ink-light);
        }
        .link-btn {
          border: none;
          background: var(--primary);
          color: var(--text-on-primary);
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 6px;
          font-size: 0.75rem;
        }
        .related {
          margin-top: 10px;
        }
        .related-title {
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .related-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .related-list button {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .search-results {
          display: grid;
          gap: 8px;
        }
        .result-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          text-align: right;
          background: var(--surface-off);
          color: var(--ink);
          cursor: pointer;
        }
        .result-title {
          font-weight: 700;
          margin-bottom: 4px;
        }
        .result-sub {
          font-size: 0.75rem;
          color: var(--ink-light);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .missions-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--ink);
        }
        .missions-list {
          display: grid;
          gap: 8px;
        }
        .mission {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface-off);
          border-radius: 12px;
          padding: 10px;
          border: 1px solid var(--border);
          color: var(--ink);
        }
        .mission.done {
          background: var(--success);
          color: var(--text-on-success);
          border-color: var(--success);
        }
        .mission-title {
          font-weight: 700;
        }
        .mission-sub {
          font-size: 0.75rem;
          color: var(--ink-light);
        }
        .mission.done .mission-sub {
          color: var(--text-on-success);
          opacity: 1;
        }
        .layers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .layer-btn {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px;
          background: var(--surface-off);
          color: var(--ink);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
        }
        .layer-btn.off {
          background: var(--surface-off);
          opacity: 0.9;
        }
        .media-tab .card {
          box-shadow: none;
        }
        .empty {
          font-size: 0.8rem;
          color: var(--ink-light);
          background: var(--surface-off);
          padding: 10px;
          border-radius: 10px;
          text-align: center;
        }
        @media (max-width: 900px) {
          .map-companion {
            position: static;
            width: 100%;
            max-height: none;
            margin-top: 12px;
          }
          .map-companion-tabs {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
