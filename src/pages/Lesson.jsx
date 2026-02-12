import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, NavLink, useSearchParams } from "react-router-dom";
import { lessons } from "../data/lessons.js";
import InteractiveMap from "../components/InteractiveMap.jsx";
import { useAppState } from "../components/AppState.jsx";
import Mascot from "../components/Mascot.jsx";
import { sfx } from "../components/sfx.js";
import { motion, AnimatePresence } from "framer-motion";
import BottomToolbar from "../components/BottomToolbar.jsx";
import StoryMode from "../components/StoryMode.jsx";
import MapCompanion from "../components/MapCompanion.jsx";
import MapClickQuiz from "../components/MapClickQuiz.jsx";
import MCQQuiz from "../components/MCQQuiz.jsx";
import DragDropMinerals from "../components/DragDropMinerals.jsx";
import Certificate from "../components/Certificate.jsx";
import { typeMeta } from "../data/legend.js";
import "../styles/Lesson.css";
import "../styles/animations.css";

// صور ومقاطع فيديو للدروس من مجلد public يتم جلبها الآن من ملف البيانات lessons.js

// استخراج الأنواع الفريدة للنقاط
function uniqueTypes(points) {
  return Array.from(new Set(points.map((p) => p.type)));
}

function normalizeFilter(value = "") {
  return value
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMediaText(value = "") {
  return value
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashSeed(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildYouTubeSearchEmbed(query = "") {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
}

function buildPointStaticImage(point) {
  if (typeof point?.lat !== "number" || typeof point?.lng !== "number") return "";
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${point.lat},${point.lng}&zoom=8&size=800x420&markers=${point.lat},${point.lng},red-pushpin`;
}

function encodeMediaSrc(src = "") {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return encodeURI(String(src)).replace(/#/g, "%23");
}

function isPreferredVideoSrc(src = "") {
  const lower = String(src).toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg");
}

function pickBestImagesForPoint(point, images = [], count = 3) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const typeHints = {
    minerals: ["ذهب", "فوسفات", "حديد", "نحاس", "منجنيز", "رمال", "جرانيت", "تعدين", "منجم"],
    energy_nonrenew: ["غاز", "بترول", "نفط", "حقل"],
    energy_renew: ["شمس", "شمسي", "رياح", "كهرومائي", "بنبان", "جبل الزيت", "طاقة"],
    fresh: ["نيل", "نهر", "بحيره", "مياه", "سد", "قناطر"],
    salty: ["بحر", "بحيره", "تحليه", "مياه مالحه"],
    projects: ["مشروع", "مدينه", "قناه", "محطه", "ميناء", "قطار", "كوبري"],
  };

  const tokens = normalizeMediaText(
    `${point.name || ""} ${(point.keywords || []).join(" ")} ${point.type || ""}`
  )
    .split(" ")
    .filter((t) => t.length > 1);
  const hints = typeHints[point.type] || [];

  const ranked = images
    .map((img, idx) => {
      const hay = normalizeMediaText(img);
      let score = 0;
      for (const token of tokens) {
        if (hay.includes(token)) score += token.length > 4 ? 3 : 2;
      }
      for (const hint of hints) {
        if (hay.includes(normalizeMediaText(hint))) score += 4;
      }
      return { img, score, idx };
    })
    .sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

  const strong = ranked.filter((r) => r.score > 0).slice(0, count).map((r) => r.img);
  if (strong.length) return Array.from(new Set(strong));

  const base = hashSeed(point.id || point.name || point.type);
  const fallback = [];
  for (let i = 0; i < Math.min(count, images.length); i += 1) {
    fallback.push(images[(base + i) % images.length]);
  }
  return Array.from(new Set(fallback));
}

function pickBestVideoForPoint(point, videos = []) {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  const typeHints = {
    minerals: ["ذهب", "فوسفات", "حديد", "نحاس", "منجنيز", "رمال", "جرانيت", "تعدين", "منجم"],
    energy_nonrenew: ["غاز", "بترول", "نفط", "حقل"],
    energy_renew: ["شمس", "شمسي", "رياح", "كهرومائي", "بنبان", "جبل الزيت", "طاقة"],
    fresh: ["نيل", "نهر", "بحيره", "مياه عذبه"],
    salty: ["بحر", "مياه مالحه", "تحليه"],
    projects: ["مشروع", "مدينه", "قناه", "محطه", "مطار", "ميناء", "قطار"],
  };

  const tokens = normalizeMediaText(
    `${point.name || ""} ${(point.keywords || []).join(" ")} ${point.type || ""}`
  )
    .split(" ")
    .filter((t) => t.length > 1);
  const hints = typeHints[point.type] || [];

  let best = null;
  for (let i = 0; i < videos.length; i += 1) {
    const video = videos[i];
    const hay = normalizeMediaText(`${video?.title || ""} ${video?.src || ""}`);
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += token.length > 4 ? 3 : 2;
    }
    for (const hint of hints) {
      if (hay.includes(normalizeMediaText(hint))) score += 4;
    }
    if (isPreferredVideoSrc(video?.src)) score += 2;
    if (!best || score > best.score) {
      best = { score, video };
    }
  }

  if (best?.score > 0) return best.video;
  const preferredVideos = videos.filter((video) => isPreferredVideoSrc(video?.src));
  const sourcePool = preferredVideos.length ? preferredVideos : videos;
  const fallbackIdx = hashSeed(point.id || point.name || point.type) % sourcePool.length;
  return sourcePool[fallbackIdx];
}

const GLOBAL_IMAGE_POOL = Array.from(
  new Set(
    lessons.flatMap((lessonItem) => [
      ...(lessonItem?.media?.images || []),
      ...(lessonItem?.media?.presentationImages || []),
      ...(lessonItem?.media?.headerImage ? [lessonItem.media.headerImage] : []),
    ])
  )
);

const GLOBAL_VIDEO_POOL = Array.from(
  new Set((lessons.flatMap((lessonItem) => lessonItem?.media?.videos || [])))
);

function enrichPointsWithVideos(lesson) {
  const points = lesson?.points || [];
  const lessonVideos = lesson?.media?.videos || [];
  const videos = lessonVideos.length ? lessonVideos : GLOBAL_VIDEO_POOL;
  const imagePool = [
    ...(lesson?.media?.images || []),
    ...(lesson?.media?.presentationImages || []),
    ...(lesson?.media?.headerImage ? [lesson.media.headerImage] : []),
  ];
  const usableImagePool = imagePool.length ? imagePool : GLOBAL_IMAGE_POOL;

  return points.map((point) => {
    const fallbackQuery = [
      point.ovQuery,
      point.name,
      ...((point.keywords || []).slice(0, 2)),
      "مصر",
      "شرح مبسط للاطفال",
    ].filter(Boolean).join(" ");
    const fallbackVideoUrl = buildYouTubeSearchEmbed(fallbackQuery);

    const baseImages = [
      ...(Array.isArray(point.images) ? point.images : []),
      ...(point.image ? [point.image] : []),
    ];
    const matchedImages = pickBestImagesForPoint(point, usableImagePool, 3);
    const seededImages = Array.from(new Set([...baseImages, ...matchedImages]))
      .filter(Boolean)
      .map((img) => encodeMediaSrc(img));
    const staticMapImage = buildPointStaticImage(point);
    const finalImages = seededImages.length
      ? seededImages
      : (staticMapImage ? [staticMapImage] : []);
    const mainImage = finalImages[0];

    if (point?.videoSrc || point?.videoUrl) {
      const localVideo = point.videoSrc ? encodeMediaSrc(point.videoSrc) : null;
      return {
        ...point,
        image: point.image ? encodeMediaSrc(point.image) : mainImage,
        images: finalImages,
        videoSrc: localVideo || undefined,
        videoUrl: point.videoUrl || fallbackVideoUrl,
        preferVideoUrl: localVideo ? !isPreferredVideoSrc(localVideo) : true,
        mediaQuery: point.ovQuery || point.name,
        kidHint:
          point.kidHint || `👆 اضغط تشغيل الفيديو وشاهد شرح ${point.name} بسهولة.`,
      };
    }

    const matchedVideo = pickBestVideoForPoint(point, videos);
    if (matchedVideo?.src) {
      const localVideo = encodeMediaSrc(matchedVideo.src);
      return {
        ...point,
        image: point.image ? encodeMediaSrc(point.image) : mainImage,
        images: finalImages,
        videoSrc: localVideo,
        videoUrl: fallbackVideoUrl,
        preferVideoUrl: !isPreferredVideoSrc(localVideo),
        mediaQuery: point.ovQuery || point.name,
        videoTitle: matchedVideo.title || `فيديو شرح ${point.name}`,
        kidHint: `👆 اضغط تشغيل الفيديو وشاهد ${point.name} خطوة بخطوة.`,
      };
    }

    return {
      ...point,
      image: point.image ? encodeMediaSrc(point.image) : mainImage,
      images: finalImages,
      videoUrl: fallbackVideoUrl,
      preferVideoUrl: true,
      mediaQuery: point.ovQuery || point.name,
      videoTitle: `فيديو مبسط عن ${point.name}`,
      kidHint: `🎬 فيديو مبسط يشرح ${point.name} للأطفال.`,
    };
  });
}

function toExternalVideoUrl(videoUrl = "") {
  if (!videoUrl) return "";
  try {
    const parsed = new URL(videoUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    const isYouTube = host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
    if (!isYouTube) return videoUrl;

    const listType = parsed.searchParams.get("listType");
    const list = parsed.searchParams.get("list");
    if (listType === "search" && list) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(list)}`;
    }
  } catch {
    return videoUrl;
  }
  return videoUrl;
}

function isYouTubeSearchEmbed(videoUrl = "") {
  return /youtube\.com\/embed\?listType=search/i.test(String(videoUrl));
}

function LessonVideoCard({ item }) {
  const hasLocalVideo = Boolean(item?.videoSrc);
  const hasEmbedVideo = Boolean(item?.videoUrl);
  const [useEmbed, setUseEmbed] = useState(!hasLocalVideo && hasEmbedVideo);
  const embedAsSearch = isYouTubeSearchEmbed(item?.videoUrl || "");
  const externalVideoUrl = hasEmbedVideo ? toExternalVideoUrl(item.videoUrl) : "";

  useEffect(() => {
    setUseEmbed(!Boolean(item?.videoSrc) && Boolean(item?.videoUrl));
  }, [item?.id, item?.videoSrc, item?.videoUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      className="lesson-video-card"
    >
      <div className="lesson-video-head">
        <div className="lesson-video-title">{item?.title || "فيديو شرح"}</div>
        {item?.subtitle ? <div className="lesson-video-subtitle">{item.subtitle}</div> : null}
      </div>

      {hasLocalVideo && hasEmbedVideo ? (
        <div className="lesson-video-switch">
          <button
            type="button"
            className={!useEmbed ? "active" : ""}
            onClick={() => setUseEmbed(false)}
          >
            فيديو الدرس
          </button>
          <button
            type="button"
            className={useEmbed ? "active" : ""}
            onClick={() => setUseEmbed(true)}
          >
            شرح إضافي
          </button>
        </div>
      ) : null}

      {!useEmbed && hasLocalVideo ? (
        <div className="lesson-video-frame">
          <video
            controls
            preload="metadata"
            playsInline
            poster={item?.poster || undefined}
            onError={() => {
              if (hasEmbedVideo) setUseEmbed(true);
            }}
          >
            <source src={item.videoSrc} />
            المتصفح لا يدعم تشغيل الفيديو.
          </video>
        </div>
      ) : hasEmbedVideo ? (
        embedAsSearch ? (
          <div className="lesson-video-note">
            <p>يتم فتح هذا الفيديو من يوتيوب مباشرة.</p>
            <a href={externalVideoUrl || item.videoUrl} target="_blank" rel="noreferrer">
              فتح الشرح على يوتيوب
            </a>
          </div>
        ) : (
          <div className="lesson-video-frame">
            <iframe
              title={`lesson-video-${item?.id}`}
              src={item.videoUrl}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      ) : (
        <div className="lesson-video-note">
          <p>لا يوجد فيديو متاح لهذا الجزء حالياً.</p>
        </div>
      )}

      <div className="lesson-video-links">
        {hasLocalVideo ? (
          <a href={item.videoSrc} target="_blank" rel="noreferrer">فتح فيديو الدرس</a>
        ) : null}
        {hasEmbedVideo ? (
          <a href={externalVideoUrl || item.videoUrl} target="_blank" rel="noreferrer">فتح الشرح الإضافي</a>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lesson = lessons.find((l) => l.id === id) ?? lessons[0];
  const { state, award, setLessonProgress } = useAppState();

  const mapPoints = useMemo(() => enrichPointsWithVideos(lesson), [lesson]);
  const availableTypes = useMemo(() => uniqueTypes(mapPoints), [mapPoints]);
  const [activePointIds, setActivePointIds] = useState(() => {
    const init = {};
    mapPoints.forEach((p) => {
      if (p?.id) init[p.id] = true;
    });
    return init;
  });
  const [pointFilterQuery, setPointFilterQuery] = useState("");
  const [popupPointId, setPopupPointId] = useState(null);
  const [activeBookTab, setActiveBookTab] = useState("student"); // "student" or "selah"
  const [activeTypes, setActiveTypes] = useState(() => {
    const init = {};
    for (const t of availableTypes) init[t] = true;
    return init;
  });

  const markerClickRef = useRef(() => { });
  const [highlightPointId, setHighlightPointId] = useState(null);
  const [mode, setMode] = useState(() => searchParams.get("mode") || "explore");
  const [hubTab, setHubTab] = useState("quiz");
  const mapApiRef = useRef({ zoomIn: null, zoomOut: null, reset: null });
  const storyRef = useRef(null);
  const libraryRef = useRef(null);
  const videosRef = useRef(null);
  const audioRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const spotlightPoints = useMemo(() => mapPoints.slice(0, 4), [mapPoints]);
  const sectionTrail = useMemo(() => (lesson.sections || []).slice(0, 4), [lesson.sections]);
  const quickFacts = useMemo(
    () => (lesson.sections || []).flatMap((s) => s.bullets || []).slice(0, 4),
    [lesson.sections]
  );
  const quickQuestions = useMemo(() => (lesson.quiz?.mcq || []).slice(0, 2), [lesson.quiz?.mcq]);
  const mcqCount = lesson.quiz?.mcq?.length || 0;
  const mcqMax = mcqCount * 10;
  const mcqScore = state.progress?.[lesson.id]?.mcqScore || 0;
  const mcqPct = mcqMax ? Math.min(100, Math.round((mcqScore / mcqMax) * 100)) : 0;
  const progressPercentage = Math.min((state.points / 100) * 100, 100);
  const typeChips = useMemo(
    () =>
      availableTypes
        .map((t) => ({
          key: t,
          label: typeMeta?.[t]?.label ?? t,
          emoji: typeMeta?.[t]?.emoji ?? "📍",
        }))
        .slice(0, 6),
    [availableTypes]
  );
  const visiblePoints = useMemo(
    () => mapPoints.filter((p) => activePointIds[p?.id] !== false),
    [mapPoints, activePointIds]
  );
  const lessonVideoItems = useMemo(() => {
    const baseVideos = (lesson?.media?.videos || [])
      .filter((video) => Boolean(video?.src))
      .map((video, idx) => ({
        id: `lesson-video-${idx}`,
        title: video.title || `فيديو ${idx + 1}`,
        subtitle: "من موارد الدرس",
        videoSrc: encodeMediaSrc(video.src),
        videoUrl: null,
        poster: lesson?.media?.images?.[idx % Math.max(lesson?.media?.images?.length || 1, 1)] || lesson?.media?.headerImage || "",
      }));

    const fallbackVideos = mapPoints
      .filter((point) => Boolean(point?.videoSrc || point?.videoUrl))
      .map((point, idx) => ({
        id: `point-video-${point.id || idx}`,
        title: point.videoTitle || `شرح ${point.name}`,
        subtitle: point.name,
        videoSrc: point.videoSrc || null,
        videoUrl: point.videoUrl || null,
        poster: point.image || lesson?.media?.headerImage || "",
      }));

    const merged = [...baseVideos, ...fallbackVideos];
    const seen = new Set();
    const unique = [];

    for (const item of merged) {
      const key = `${item.videoSrc || ""}|${item.videoUrl || ""}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= 8) break;
    }
    return unique;
  }, [lesson, mapPoints]);
  const filteredLandmarks = useMemo(() => {
    const query = normalizeFilter(pointFilterQuery);
    if (!query) return mapPoints;
    return mapPoints.filter((p) => {
      const metaLabel = typeMeta?.[p.type]?.label ?? "";
      const keywords = (p.keywords || []).join(" ");
      const hay = normalizeFilter(`${p.name} ${metaLabel} ${keywords}`);
      return hay.includes(query);
    });
  }, [mapPoints, pointFilterQuery]);
  const lastAutoFocusRef = useRef({ query: "", pointId: null });

  useEffect(() => {
    const init = {};
    for (const t of availableTypes) init[t] = true;
    setActiveTypes(init);
    const initPoints = {};
    mapPoints.forEach((p) => {
      if (p?.id) initPoints[p.id] = true;
    });
    setActivePointIds(initPoints);
    setPointFilterQuery("");
    setPopupPointId(null);
    lastAutoFocusRef.current = { query: "", pointId: null };
    setHighlightPointId(lesson.quiz?.mapClick?.[0]?.targetPointId ?? null);
    setMode("explore");
    setSelectedPoint(null);
    setHubTab("quiz");
  }, [id, availableTypes, lesson.quiz?.mapClick, mapPoints]);

  useEffect(() => {
    const coords = mapPoints
      .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
      .map((p) => [p.lat, p.lng]);
    if (!coords.length) return;
    if (coords.length === 1) {
      mapApiRef.current.flyTo?.(coords[0], 8);
      return;
    }
    mapApiRef.current.fitBounds?.(coords);
  }, [id, mapPoints]);

  useEffect(() => {
    if (selectedPoint?.id && activePointIds[selectedPoint.id] === false) {
      setSelectedPoint(null);
      setHighlightPointId(null);
    }
    if (highlightPointId && activePointIds[highlightPointId] === false) {
      setHighlightPointId(null);
    }
  }, [activePointIds, selectedPoint?.id, highlightPointId]);

  // Sync mode and tab with search params
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    const urlTab = searchParams.get("tab");
    const urlPointId = searchParams.get("pointId");

    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    } else if (!urlMode && mode !== "explore") {
      setMode("explore");
    }

    if (urlTab && urlTab !== activeBookTab) {
      setActiveBookTab(urlTab);
    }

    // Deep-link to a specific landmark
    if (urlPointId) {
      const point = mapPoints.find((p) => p.id === urlPointId);
      if (point) {
        // Delay slightly for map/data initialization
        setTimeout(() => {
          focusPoint(point);
        }, 300);
      }
    }
  }, [searchParams, id, mapPoints]);

  // Update URL when mode or tab changes internally
  useEffect(() => {
    const urlMode = searchParams.get("mode") || "explore";
    const urlTab = searchParams.get("tab") || "student";

    let changed = false;
    if (mode !== urlMode) {
      if (mode === "explore") {
        searchParams.delete("mode");
      } else {
        searchParams.set("mode", mode);
      }
      changed = true;
    }

    if (activeBookTab !== urlTab) {
      if (activeBookTab === "student") {
        searchParams.delete("tab");
      } else {
        searchParams.set("tab", activeBookTab);
      }
      changed = true;
    }

    if (changed) {
      setSearchParams(searchParams, { replace: true });
    }
  }, [mode, activeBookTab]);

  // Scroll to sections based on mode
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (!urlMode) return;

    const scrollOptions = { behavior: "smooth", block: "start" };

    if (urlMode === "video" && videosRef.current) {
      videosRef.current.scrollIntoView(scrollOptions);
    } else if (urlMode === "audio" && audioRef.current) {
      audioRef.current.scrollIntoView(scrollOptions);
    } else if (searchParams.get("tab") && libraryRef.current) {
      libraryRef.current.scrollIntoView(scrollOptions);
    }
  }, [searchParams]);

  function handleAward(points) {
    award(points);
    sfx.reward();
  }

  function togglePointVisibility(pointId) {
    setActivePointIds((prev) => {
      const current = prev?.[pointId];
      const nextValue = current === false;
      return { ...prev, [pointId]: nextValue };
    });
  }

  function setAllPointsVisible(nextValue) {
    const next = {};
    mapPoints.forEach((p) => {
      if (p?.id) next[p.id] = nextValue;
    });
    setActivePointIds(next);
  }

  function focusPoint(point) {
    if (!point) return;
    setActivePointIds((prev) => ({ ...prev, [point.id]: true }));
    setActiveTypes((prev) => ({ ...prev, [point.type]: true }));
    setSelectedPoint(point);
    setHighlightPointId(point.id);
    setPopupPointId(point.id);
    mapApiRef.current.flyTo?.([point.lat, point.lng], 13);
  }

  useEffect(() => {
    const query = normalizeFilter(pointFilterQuery);
    if (!query) return;
    if (filteredLandmarks.length !== 1) return;
    const point = filteredLandmarks[0];
    if (lastAutoFocusRef.current.query === query && lastAutoFocusRef.current.pointId === point.id) return;
    lastAutoFocusRef.current = { query, pointId: point.id };
    focusPoint(point);
  }, [pointFilterQuery, filteredLandmarks]);

  function onMCQAnswered({ answers, score }) {
    const existing = state.progress?.[lesson.id] ?? {};
    setLessonProgress(lesson.id, {
      ...existing,
      mcq: answers,
      mcqScore: score,
    });
    if (score === (lesson.quiz?.mcq?.length || 0) * 10) {
      award(10); // مكافأة كاملة
      sfx.reward();
    }
  }

  // فرامير موشن للإظهار المتدرج (Staggered Children)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="lesson-container anim-fade-in"
      style={{ padding: "10px", backgroundColor: "transparent" }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="kidHero anim-pulse"
        variants={itemVariants}
        style={{
          background: `linear-gradient(135deg, rgba(var(--primary-rgb), 0.9), rgba(var(--secondary-rgb), 0.85)), url(${lesson.media?.headerImage || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: "24px",
          padding: "30px",
          boxShadow: "0 15px 35px rgba(14, 165, 163, 0.3)",
          color: "white",
          marginBottom: "30px",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="kidSparkles">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="sparkle" />
          ))}
        </div>

        <div className="pageHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}>
              {lesson.title} ✨
            </h1>
            <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>{lesson.subtitle}</p>
          </div>
          <div className="stats-badges" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <motion.span whileHover={{ scale: 1.1 }} className="badge-glow">⭐ {state.points} نقطة</motion.span>
            <span className={`badge-status ${state.progress?.[lesson.id]?.completed ? "done" : "working"}`}>
              {state.progress?.[lesson.id]?.completed ? "مكتمل ✅" : "قيد التعلّم ⏳"}
            </span>
          </div>
        </div>

        <Mascot
          title="مرحباً يا مستكشف!"
          text="ابدأ رحلتك من الخريطة، واسألها عن أي مكان أو مورد. كل إجابة صحيحة تكسبك نقاطاً جديدة!"
        />
      </motion.div>

      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px" }}>
        <div className="left-column">
          <motion.div
            variants={itemVariants}
            className="card-fancy hover-tilt"
            whileHover={{ boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
          >
            <h3 className="section-title-rainbow">🎯 أهداف الدرس</h3>
            <div className="objectives-grid">
              {lesson.objectives.map((o, i) => (
                <div key={i} className="obj-item">
                  <span className="obj-number">{i + 1}</span>
                  <p>{o}</p>
                </div>
              ))}
            </div>

            {/* معرض الوسائط - صور وفيديوهات الدرس */}
            {lesson.media && (
              <div className="media-gallery" style={{ marginTop: '24px' }}>
                <h3 className="section-title-rainbow">📸 مكتبة الموارد التعليمية</h3>

                {/* فيديوهات الدرس */}
                {lessonVideoItems.length > 0 && (
                  <div ref={videosRef} className="lesson-video-section">
                    <div className="lesson-video-section-head">
                      <h4>🎬 فيديوهات الشرح</h4>
                      <span>{lessonVideoItems.length} فيديو</span>
                    </div>
                    <div className="lesson-video-grid">
                      {lessonVideoItems.map((video) => (
                        <LessonVideoCard key={video.id} item={video} />
                      ))}
                    </div>
                  </div>
                )}

                {/* مراجع الكتب */}
                {(lesson.media.studentBook?.length > 0 || lesson.media.selahElTelmeez?.length > 0) && (
                  <div ref={libraryRef} style={{ marginBottom: '30px', background: 'var(--surface-off)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ color: 'var(--primary-dark)', margin: 0, fontSize: '1.2rem' }}>📖 المراجع الدراسية</h4>
                      <div className="tab-group" style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px' }}>
                        {lesson.media.studentBook?.length > 0 && (
                          <button
                            onClick={() => { setActiveBookTab("student"); sfx.click(); }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: activeBookTab === "student" ? "var(--primary)" : "transparent",
                              color: activeBookTab === "student" ? "white" : "var(--ink-light)",
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            الكتاب المدرسي
                          </button>
                        )}
                        {lesson.media.selahElTelmeez?.length > 0 && (
                          <button
                            onClick={() => { setActiveBookTab("selah"); sfx.click(); }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: activeBookTab === "selah" ? "var(--secondary)" : "transparent",
                              color: activeBookTab === "selah" ? "white" : "var(--ink-light)",
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            سلاح التلميذ
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeBookTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="textbook-scroller"
                        style={{
                          display: 'flex',
                          gap: '16px',
                          overflowX: 'auto',
                          padding: '10px 2px 20px 2px',
                          scrollbarWidth: 'thin'
                        }}
                      >
                        {(activeBookTab === "student" ? lesson.media.studentBook : lesson.media.selahElTelmeez || [])?.map((pg, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05, rotate: 1 }}
                            style={{
                              minWidth: '220px',
                              height: '300px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                              background: 'white',
                              border: '2px solid var(--border)',
                              cursor: 'zoom-in',
                              flexShrink: 0
                            }}
                            onClick={() => window.open(pg, '_blank')}
                          >
                            <img
                              src={pg}
                              alt={`صفحة ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px', textAlign: 'center', fontSize: '0.8rem' }}>
                              صفحة {idx + 1}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', opacity: 1, marginTop: '8px', textAlign: 'center' }}>💡 اضغط على الصفحة للتكبير والدراسة بتركيز.</p>
                  </div>
                )}

                {/* صور الدرس */}
                {lesson.media.images?.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: 'var(--primary-dark)', marginBottom: '15px', fontSize: '1.2rem' }}>🖼️ صور ومعالم</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                      {lesson.media.images.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.08, zIndex: 1 }}
                          style={{
                            borderRadius: '18px',
                            overflow: 'hidden',
                            boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
                            background: 'var(--surface)',
                            height: '180px',
                            border: '1px solid var(--border)',
                            cursor: 'pointer'
                          }}
                        >
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* بصريات العرض التقديمي - Key Highlights */}
                {lesson.media.presentationImages?.length > 0 && (
                  <div style={{ marginBottom: '30px', padding: '25px', borderRadius: '30px', background: 'linear-gradient(135deg, var(--primary-lighter), var(--surface))', border: '2px dashed var(--primary-light)' }}>
                    <h4 style={{ color: 'var(--primary-dark)', marginBottom: '15px', fontSize: '1.2rem', textAlign: 'center' }}>⭐ ملخص الدرس البصري</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {lesson.media.presentationImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          style={{
                            borderRadius: '15px',
                            overflow: 'hidden',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                            background: 'white',
                            aspectRatio: '16/10',
                            border: '4px solid white'
                          }}
                        >
                          <img
                            src={img}
                            alt={`Highlight ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* تسجيلات صوتية */}
                {lesson.media.audio?.length > 0 && (
                  <div ref={audioRef} style={{ marginTop: '20px' }}>
                    <h4 style={{ color: 'var(--primary-dark)', marginBottom: '15px', fontSize: '1.2rem' }}>🎙️ محاضرات صوتية</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                      {lesson.media.audio.map((audio, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -5 }}
                          style={{
                            borderRadius: '20px',
                            padding: '20px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                            background: 'var(--surface-off)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ fontWeight: '700', color: 'var(--primary-dark)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>🎧</span> {audio.title}
                          </div>
                          <audio controls style={{ width: '100%', height: '35px' }}>
                            <source src={audio.src} type={audio.src.endsWith('.MP3') ? 'audio/mpeg' : 'video/quicktime'} />
                            المتصفح لا يدعم تشغيل الصوت
                          </audio>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hr-dashed" />

            <div className="lesson-details">
              {lesson.sections.map((s, i) => (
                <div key={i} className="info-block" id={`section-${i}`}>
                  <h4 style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>📘</span> {s.heading}
                  </h4>
                  <ul className="fancy-list">
                    {s.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="magic-notice">
              <div className="magic-icon">🧭</div>
              <div className="magic-text">
                <strong>نصائح الخريطة الذكية:</strong>
                <ul>
                  <li>اضغط على أي علامة لرؤية المعلومة بسرعة.</li>
                  <li>كل معلم عليه فيديو شرح مبسط: اضغط تشغيل 🎬.</li>
                  <li>استخدم وضع القياس لتقدير المسافات.</li>
                  <li>جرّب وضع القصة لتتتبع رحلة ممتعة بين المواقع.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="map-container-fancy" style={{ marginTop: "30px", position: "relative" }}>
            <div className="map-labels">
              <span className="map-tag blue">🗺️ استكشاف</span>
              <span className="map-tag orange">⚡ مصادر</span>
              <span className="map-tag green">🌿 استدامة</span>
              <span className="map-tag purple">🏛️ مواقع مهمة</span>
            </div>

            <div className="map-area">
              <div className="map-side">
                <MapCompanion
                  points={visiblePoints}
                  lessonId={lesson.id}
                  selectedPoint={selectedPoint}
                  onSelectPoint={(point) => {
                    if (point?.id) {
                      setActivePointIds((prev) => ({ ...prev, [point.id]: true }));
                      setActiveTypes((prev) => ({ ...prev, [point.type]: true }));
                      setPopupPointId(point.id);
                    }
                    setSelectedPoint(point);
                  }}
                  onHighlightPoint={setHighlightPointId}
                  onFlyTo={(coords, zoom = 13) => mapApiRef.current.flyTo?.(coords, zoom)}
                  onAward={handleAward}
                  activeTypes={activeTypes}
                  setActiveTypes={(fn) => {
                    sfx.click();
                    setActiveTypes(fn);
                  }}
                  layout="side"
                  defaultTab="media"
                />

                <MapClickQuiz
                  tasks={lesson.quiz?.mapClick || []}
                  onMarkerClick={markerClickRef}
                  onAward={handleAward}
                  pointsByTask={10}
                  onTargetChange={(pid) => setHighlightPointId(pid)}
                />
              </div>

              <div className="map-frame">
                <InteractiveMap
                  points={visiblePoints}
                  activeTypes={activeTypes}
                  onMarkerClicked={(p) => {
                    setSelectedPoint(p);
                    markerClickRef.current?.(p);
                  }}
                  highlightPointId={highlightPointId}
                  height="100%"
                  enableDrawing={mode === "draw"}
                  enableMeasure={mode === "measure"}
                  onMapReady={(map) => {
                    mapApiRef.current.zoomIn = () => map.zoomIn();
                    mapApiRef.current.zoomOut = () => map.zoomOut();
                    mapApiRef.current.reset = () => map.setView([26.8, 30.8], 6);
                    mapApiRef.current.fitBounds = (coords) => map.fitBounds(coords, { padding: [60, 60] });
                    mapApiRef.current.flyTo = (coords, zoom = 13) => map.flyTo(coords, zoom, { duration: 1.2 });
                    const coords = mapPoints
                      .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
                      .map((p) => [p.lat, p.lng]);
                    if (coords.length > 1) {
                      map.fitBounds(coords, { padding: [60, 60] });
                    } else if (coords.length === 1) {
                      map.setView(coords[0], 8);
                    }
                  }}
                  autoFocusHighlight={false}
                  openPopupPointId={popupPointId}
                />
              </div>

              <div className="map-filter">
                <div className="landmark-filter-card">
                  <div className="landmark-filter-header">
                    <div>
                      <h4>فلتر المعالم</h4>
                      <p>اظهر أو اخفِ المعالم وشوفها بتتغير على الخريطة فوراً.</p>
                    </div>
                    <div className="landmark-filter-actions">
                      <button type="button" onClick={() => setAllPointsVisible(true)}>عرض الكل</button>
                      <button type="button" className="ghost" onClick={() => setAllPointsVisible(false)}>إخفاء الكل</button>
                    </div>
                  </div>

                  <div className="landmark-filter-search">
                    <input
                      value={pointFilterQuery}
                      onChange={(e) => setPointFilterQuery(e.target.value)}
                      placeholder="ابحث باسم المعلم"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && filteredLandmarks.length) {
                          event.preventDefault();
                          focusPoint(filteredLandmarks[0]);
                        }
                      }}
                    />
                    <span className="count-pill">{visiblePoints.length}/{mapPoints.length}</span>
                  </div>

                  <div className="landmark-legend">
                    {availableTypes.map((type) => {
                      const meta = typeMeta?.[type] || {};
                      return (
                        <span key={type} className="legend-pill">
                          <span className="legend-dot" style={{ background: meta.color || "var(--primary)" }} />
                          <span className="legend-emoji">{meta.emoji ?? "📍"}</span>
                          {meta.label ?? type}
                        </span>
                      );
                    })}
                  </div>

                  <div className="landmark-list">
                    {filteredLandmarks.length ? (
                      filteredLandmarks.map((point) => {
                        const meta = typeMeta?.[point.type] || {};
                        const isVisible = activePointIds[point.id] !== false;
                        return (
                          <div
                            key={point.id}
                            className={`landmark-item ${isVisible ? "on" : "off"}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => focusPoint(point)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                focusPoint(point);
                              }
                            }}
                          >
                            <span className="legend-dot" style={{ background: meta.color || "var(--primary)" }} />
                            <span className="landmark-emoji">{point.emoji ?? meta.emoji ?? "📍"}</span>
                            <span className="landmark-text">
                              <span className="landmark-name">{point.name}</span>
                              <span className="landmark-type">{meta.label ?? point.type}</span>
                            </span>
                            <button
                              type="button"
                              className="landmark-toggle"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isVisible) {
                                  togglePointVisibility(point.id);
                                } else {
                                  focusPoint(point);
                                }
                              }}
                            >
                              {isVisible ? "إخفاء" : "إظهار"}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty">لا توجد معالم مطابقة للبحث.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lesson-board hover-glow">
            <div className="board-header">
              <div>
                <h3>لوحة الدرس التفاعلية</h3>
                <p>ملخص سريع، مهام اليوم، وأبرز المعالم في خريطة الدرس.</p>
              </div>
              <span className="board-pill">جاهز للاستكشاف 🚀</span>
            </div>

            <div className="board-grid">
              <div className="board-card">
                <div className="board-card-title">📊 مؤشرات التقدم</div>
                <div className="board-metric">
                  <span>درجات الاختبار</span>
                  <b>{mcqScore}/{mcqMax || 0}</b>
                </div>
                <div className="board-meter">
                  <div className="board-meter-fill" style={{ width: `${mcqPct}%` }} />
                </div>
                <div className="board-metric">
                  <span>عدد المعالم</span>
                  <b>{mapPoints.length}</b>
                </div>
                <div className="board-metric">
                  <span>طبقات الدرس</span>
                  <b>{availableTypes.length}</b>
                </div>
              </div>

              <div className="board-card">
                <div className="board-card-title">🧩 خريطة الدرس</div>
                <div className="chip-row">
                  {typeChips.map((chip) => (
                    <span key={chip.key} className="chip-pill">
                      {chip.emoji} {chip.label}
                    </span>
                  ))}
                </div>
                <div className="board-note">فعّل طبقات أقل علشان تركّز في تفاصيل أكتر.</div>
              </div>

              <div className="board-card wide">
                <div className="board-card-title">⭐ أبرز المعالم</div>
                <div className="points-row">
                  {spotlightPoints.map((p) => (
                    <button key={p.id} type="button" className="point-pill" onClick={() => focusPoint(p)}>
                      <span className="point-emoji">{p.emoji ?? "📍"}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="board-card">
                <div className="board-card-title">🧠 ملخص سريع</div>
                <ul className="board-list">
                  {quickFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>

              <div className="board-card">
                <div className="board-card-title">⚡ سؤال خاطف</div>
                {quickQuestions.length ? (
                  quickQuestions.map((q, idx) => (
                    <details key={q.id} className="flash-q">
                      <summary>سؤال {idx + 1}: {q.q}</summary>
                      <div className="flash-body">
                        <div className="flash-answer">الإجابة الصحيحة: {q.options[q.answer]}</div>
                        <div className="flash-options">
                          {q.options.map((opt, i) => (
                            <span key={i} className={i === q.answer ? "flash-opt correct" : "flash-opt"}>{opt}</span>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="board-note">لا توجد أسئلة إضافية الآن.</div>
                )}
              </div>

              <div className="board-card wide">
                <div className="board-card-title">🧭 مسار اليوم</div>
                <div className="path-steps">
                  {sectionTrail.map((s, idx) => (
                    <div key={s.heading} className="path-step">
                      <div className="path-index">{idx + 1}</div>
                      <div>
                        <div className="path-title">{s.heading}</div>
                        <div className="path-sub">{s.bullets?.[0] ?? "ابدأ باستكشاف هذا الجزء."}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lesson-hub">
            <div className="hub-header">
              <div>
                <h3>أنشطة الدرس</h3>
                <p>اختبر معلوماتك، العب، واحصل على شهادتك.</p>
              </div>
              <div className="hub-points">
                <span>نقاطك الحالية</span>
                <strong>{state.points} ⭐</strong>
                <div className="hub-progress">
                  <div className="hub-progress-fill" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
            </div>

            <nav className="tabRow hub-tabs">
              {[
                { id: "quiz", label: "الاختبار", icon: "📝" },
                { id: "games", label: "الألعاب", icon: "🎮" },
                { id: "cert", label: "الشهادة", icon: "📜" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tabBtn ${hubTab === tab.id ? "active" : ""}`}
                  onClick={() => {
                    sfx.click();
                    setHubTab(tab.id);
                  }}
                >
                  <span className="tabIcon">{tab.icon}</span>
                  <span className="tabLabel">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="hub-body">
              {hubTab === "quiz" && (
                <div className="hub-panel anim-fade">
                  <h3 className="sectionTitle">اختبار سريع</h3>
                  <MCQQuiz
                    questions={lesson.quiz?.mcq || []}
                    onAnswered={onMCQAnswered}
                  />
                </div>
              )}

              {hubTab === "games" && (
                <div className="hub-panel anim-fade">
                  <h3 className="sectionTitle">ألعاب سريعة</h3>
                  <DragDropMinerals onAward={handleAward} />
                </div>
              )}

              {hubTab === "cert" && (
                <div className="hub-panel anim-fade">
                  <h3 className="sectionTitle">شهادتك</h3>
                  <Certificate points={state.points} />
                </div>
              )}
            </div>
          </motion.div>

          <div className="lesson-encyclopedia">
            <div className="encyclopedia-header">
              <h3>موسوعة المعالم</h3>
              <p>اضغط على أي معلم لمعرفة التفاصيل، ثم قرّب الخريطة عليه.</p>
            </div>
            <div className="encyclopedia-grid">
              {mapPoints.map((point) => (
                <details key={point.id} className="encyclopedia-card">
                  <summary>
                    <span className="encyclopedia-title">
                      <span className="encyclopedia-emoji">{point.emoji ?? "📍"}</span>
                      {point.name}
                    </span>
                    <span className="encyclopedia-type">{typeMeta?.[point.type]?.label ?? point.type}</span>
                  </summary>
                  <div className="encyclopedia-body">
                    {point.info ? <p className="encyclopedia-text">{point.info}</p> : null}
                    {point.educationalContent ? (
                      <div className="encyclopedia-box info">
                        <strong>معلومة تعليمية:</strong>
                        <span>{point.educationalContent}</span>
                      </div>
                    ) : null}
                    {point.story ? (
                      <div className="encyclopedia-box story">
                        <strong>قصة قصيرة:</strong>
                        <span>{point.story}</span>
                      </div>
                    ) : null}
                    {point.funFact ? (
                      <div className="encyclopedia-box fun">
                        <strong>هل تعلم؟</strong>
                        <span>{point.funFact}</span>
                      </div>
                    ) : null}
                    {point.quickFacts?.length ? (
                      <ul className="encyclopedia-list">
                        {point.quickFacts.map((fact, idx) => (
                          <li key={idx}>{fact}</li>
                        ))}
                      </ul>
                    ) : null}
                    {point.keywords?.length ? (
                      <div className="encyclopedia-tags">
                        {point.keywords.map((keyword) => (
                          <span key={keyword} className="tag-pill">{keyword}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="encyclopedia-actions">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          focusPoint(point);
                        }}
                      >
                        قرّبني على الخريطة
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="quick-links-card">
            <h4>روابط سريعة</h4>
            <div className="link-btns">
              <NavLink className="nav-btn game" to="/games">🎮 ألعاب تعليمية</NavLink>
              <NavLink className="nav-btn home" to="/">🏠 الرئيسية</NavLink>
            </div>
            <div className="secret-tip">
              <p>جرب وضع القصة عشان تتعلم بسرعة وتكسب نقاط أكثر!</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mode === "story" && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="story-overlay"
            ref={storyRef}
          >
            <StoryMode
              points={mapPoints}
              onFocusPoint={(p) => setHighlightPointId(p?.id ?? null)}
              onAward={(p) => handleAward(p)}
              active={true}
              autoPlay={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="creative-zone" style={{ marginTop: "40px" }}>
        <h2 style={{ textAlign: "center", color: "var(--accent)", marginBottom: "20px" }}>منطقة الإبداع</h2>
        <div className="tiles-container">
          <div className="creative-tile yellow">
            <div className="tile-icon">🎨</div>
            <h3>ارسم خريطتك</h3>
            <p>ارسم موقع كنزك المفضل على ورقة، ثم قارنها بالخريطة الرقمية.</p>
          </div>
          <div className="creative-tile blue">
            <div className="tile-icon">✍️</div>
            <h3>اكتب ملخصاً</h3>
            <p>اكتب 3 جمل عن أهم معلومة تعلمتها اليوم.</p>
          </div>
          <div className="creative-tile green">
            <div className="tile-icon">🧠</div>
            <h3>اصنع بطاقة معرفة</h3>
            <p>جهّز بطاقة صغيرة فيها اسم المورد، مكانه، وفائدته.</p>
          </div>
          <div className="creative-tile purple">
            <div className="tile-icon">👨‍👩‍👧‍👦</div>
            <h3>تحدي الأسرة</h3>
            <p>اسأل أحد أفراد الأسرة عن مورد طبيعي واكتب الإجابة.</p>
          </div>
        </div>
      </div>

      <BottomToolbar
        mode={mode}
        setMode={(m) => {
          sfx.click();
          setMode(m);
        }}
        zoomIn={() => mapApiRef.current.zoomIn?.()}
        zoomOut={() => mapApiRef.current.zoomOut?.()}
        resetView={() => mapApiRef.current.reset?.()}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .section-title-rainbow {
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 24px;
          display: inline-block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
        }
        [data-theme='dark'] .section-title-rainbow {
          background: none !important;
          -webkit-text-fill-color: currentColor !important;
          color: var(--ink) !important;
          filter: none;
        }
        .fancy-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fancy-list li {
          position: relative;
          padding-right: 32px;
          line-height: 1.8;
          font-size: 1.1rem;
          color: var(--ink);
          font-weight: 500;
        }
        .fancy-list li::before {
          content: "✦";
          position: absolute;
          right: 0;
          color: var(--text-turquoise);
          font-size: 1.2rem;
          font-weight: 900;
        }
        .info-block h4 {
          color: var(--text-royal);
          font-size: 1.4rem;
          font-weight: 900;
          margin-bottom: 16px;
        }
        .lesson-details {
          padding: 24px;
          background: var(--surface-off);
          border-radius: 24px;
          border: 1px solid var(--border);
          line-height: 1.8;
        }
        .creative-zone h2 {
           background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          font-size: 2rem;
        }
        [data-theme='dark'] .creative-zone h2 {
          background: none !important;
          -webkit-text-fill-color: currentColor !important;
          color: var(--ink) !important;
        }
        .card-fancy {
          background: var(--glass-bg);
          border-radius: 24px;
          padding: 30px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
        }
        .map-frame {
          position: relative;
          height: 100%;
          min-height: 620px;
        }
        .map-area {
          display: grid;
          grid-template-columns: minmax(320px, 440px) minmax(0, 1fr) minmax(280px, 340px);
          gap: 20px;
          align-items: stretch;
        }
        .map-side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .map-filter {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .landmark-filter-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 14px;
          box-shadow: var(--shadow-md);
        }
        .landmark-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }
        .landmark-filter-header h4 {
          margin: 0;
          font-size: 1.05rem;
          color: var(--ink);
        }
        .landmark-filter-header p {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: var(--ink-light);
        }
        .landmark-filter-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .landmark-filter-actions button {
          border: none;
          background: var(--primary);
          color: var(--text-on-primary);
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 700;
        }
        .landmark-filter-actions .ghost {
          background: var(--surface-off);
          color: var(--ink);
        }
        .landmark-filter-search {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
        }
        .landmark-filter-search input {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          font-size: 0.85rem;
        }
        .count-pill {
          background: var(--glass-bg);
          color: var(--text-turquoise);
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .landmark-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .legend-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-off);
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--ink);
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid var(--border);
        }
        .legend-emoji {
          font-size: 0.9rem;
        }
        .landmark-list {
          display: grid;
          gap: 8px;
          max-height: 260px;
          overflow: auto;
          padding-right: 2px;
        }
        .landmark-item {
          border: 1px solid var(--border);
          background: var(--glass-bg);
          border-radius: 14px;
          padding: 8px 10px;
          display: grid;
          grid-template-columns: 12px 22px 1fr auto;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-align: right;
        }
        .landmark-item:focus-visible {
          outline: 2px solid var(--primary-light);
          outline-offset: 2px;
        }
        .landmark-item.on {
          box-shadow: var(--shadow-sm);
          border-color: var(--primary);
        }
        .landmark-item.off {
          opacity: 0.82;
          background: var(--surface-off);
        }
        .landmark-emoji {
          font-size: 1rem;
        }
        .landmark-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }
        .landmark-name {
          font-weight: 700;
          color: var(--ink);
          font-size: 0.85rem;
        }
        .landmark-type {
          font-size: 0.7rem;
          color: var(--ink-light);
        }
        .landmark-toggle {
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--glass-bg);
          color: var(--text-turquoise);
          cursor: pointer;
        }
        .lesson-video-section {
          margin-bottom: 30px;
          background: var(--surface-off);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 16px;
        }
        .lesson-video-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .lesson-video-section-head h4 {
          margin: 0;
          color: var(--primary-dark);
          font-size: 1.15rem;
        }
        .lesson-video-section-head span {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink-light);
          font-size: 0.8rem;
          font-weight: 700;
        }
        .lesson-video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }
        .lesson-video-card {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .lesson-video-head {
          display: grid;
          gap: 4px;
        }
        .lesson-video-title {
          font-weight: 800;
          color: var(--ink);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .lesson-video-subtitle {
          font-size: 0.78rem;
          color: var(--ink-light);
          font-weight: 700;
        }
        .lesson-video-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .lesson-video-switch button {
          border: 1px solid var(--border);
          background: var(--surface-off);
          color: var(--ink);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 0.76rem;
          font-weight: 800;
          cursor: pointer;
        }
        .lesson-video-switch button.active {
          border-color: var(--primary);
          background: var(--primary);
          color: var(--text-on-primary);
        }
        .lesson-video-frame {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: #000;
        }
        .lesson-video-frame video,
        .lesson-video-frame iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          height: auto;
          display: block;
          border: 0;
          object-fit: contain;
          background: #000;
        }
        .lesson-video-note {
          border-radius: 12px;
          border: 1px dashed var(--border-strong);
          background: var(--surface-off);
          padding: 10px;
        }
        .lesson-video-note p {
          margin: 0;
          color: var(--ink-light);
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .lesson-video-note a {
          display: inline-block;
          margin-top: 8px;
          color: var(--text-turquoise);
          font-size: 0.8rem;
          font-weight: 800;
        }
        .lesson-video-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .lesson-video-links a {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-turquoise);
        }
        .obj-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: var(--surface-off);
          padding: 12px;
          border-radius: 15px;
          margin-bottom: 10px;
          border-right: 5px solid var(--primary);
        }
        .obj-number {
          background: var(--primary);
          color: var(--text-on-primary);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
        }
        .magic-notice {
          background: var(--glass-bg);
          border: 2px dashed var(--secondary);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          gap: 15px;
          margin-top: 25px;
        }
        .magic-icon { font-size: 2.5rem; }
        .map-tag {
          padding: 8px 15px;
          border-radius: 20px;
          color: var(--text-on-primary);
          font-weight: bold;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .blue { background: var(--accent); }
        .orange { background: var(--primary2); }
        .green { background: #22c55e; }
        .purple { background: #fb7185; }

        .hr-dashed {
          height: 1px;
          border-top: 1px dashed rgba(14,165,163,.35);
          margin: 18px 0;
        }

        .lesson-board {
          margin-top: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 22px;
          box-shadow: var(--shadow-lg);
        }
        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .board-header h3 {
          margin: 0;
          font-size: 1.4rem;
          color: var(--ink);
        }
        .board-header p {
          margin: 4px 0 0;
          color: var(--ink-light);
          font-size: 0.9rem;
        }
        .board-pill {
          background: var(--glass-bg);
          color: var(--text-turquoise);
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .board-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .board-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
          box-shadow: var(--shadow-sm);
        }
        .board-card.wide {
          grid-column: span 2;
        }
        .board-card-title {
          font-weight: 800;
          margin-bottom: 10px;
          color: var(--ink);
        }
        .board-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          margin-bottom: 8px;
          color: var(--ink-light);
        }
        .board-meter {
          height: 10px;
          background: rgba(15, 23, 42, 0.08);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .board-meter-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary2));
        }
        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip-pill {
          background: var(--glass-bg);
          color: var(--text-turquoise);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .board-note {
          margin-top: 8px;
          font-size: 0.8rem;
          color: var(--ink-light);
        }
        .points-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .point-pill {
          border: 1px solid var(--border);
          background: var(--surface-off);
          color: var(--ink);
          border-radius: 14px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.85rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .point-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(14,165,163,.18);
        }
        .point-emoji { font-size: 1.1rem; }
        .board-list {
          margin: 0;
          padding-right: 16px;
          color: var(--ink-light);
          line-height: 1.7;
        }
        .flash-q {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 12px;
          background: var(--surface-off);
          margin-bottom: 10px;
        }
        .flash-q summary {
          cursor: pointer;
          font-weight: 700;
          color: var(--ink);
        }
        .flash-body { margin-top: 10px; }
        .flash-answer {
          font-size: 0.85rem;
          color: var(--text-turquoise);
          margin-bottom: 6px;
          font-weight: 700;
        }
        .flash-options {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .flash-opt {
          padding: 4px 8px;
          border-radius: 999px;
          background: var(--surface-off);
          color: var(--ink-light);
          font-size: 0.75rem;
        }
        .flash-opt.correct {
          background: rgba(22,163,74,.18);
          color: var(--success-text);
        }
        .path-steps {
          display: grid;
          gap: 10px;
        }
        .path-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: var(--glass-bg);
          border: 1px dashed var(--border);
          border-radius: 16px;
          padding: 10px 12px;
        }
        .path-index {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: var(--text-on-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }
        .path-title {
          font-weight: 800;
          color: var(--ink);
        }
        .path-sub {
          font-size: 0.85rem;
          color: var(--ink-light);
          margin-top: 4px;
        }
        @media (max-width: 900px) {
          .board-grid { grid-template-columns: 1fr; }
          .board-card.wide { grid-column: span 1; }
          .board-header { flex-direction: column; align-items: flex-start; }
          .map-area { grid-template-columns: 1fr; }
          .map-frame { order: 1; }
          .map-filter { order: 2; }
          .map-side { order: 3; }
          .lesson-video-grid { grid-template-columns: 1fr; }
          .lesson-video-frame video,
          .lesson-video-frame iframe { aspect-ratio: 16 / 9; height: auto; }
        }

        .map-knowledge-card {
          background: var(--surface);
          border-radius: 24px;
          padding: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }
        .map-knowledge-header h3 {
          margin: 0 0 6px;
          color: var(--ink);
        }
        .map-knowledge-header p {
          margin: 0 0 16px;
          color: var(--ink-light);
          font-size: 0.95rem;
        }
        .map-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .map-search-row input {
          flex: 1;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          font-size: 1rem;
        }
        .map-search-row button {
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: var(--primary);
          color: var(--text-on-primary);
          font-weight: 700;
          cursor: pointer;
        }
        .map-results {
          display: grid;
          gap: 10px;
          margin-bottom: 16px;
        }
        .map-result {
          text-align: right;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
          transition: 0.2s;
        }
        .map-result.active,
        .map-result:hover {
          border-color: var(--primary);
          box-shadow: 0 6px 16px rgba(14, 165, 163, 0.18);
          transform: translateY(-1px);
        }
        .map-result-title {
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .map-result-snippet {
          font-size: 0.85rem;
          color: var(--ink-light);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .map-hint,
        .map-empty {
          background: var(--surface-off);
          border-radius: 14px;
          padding: 12px;
          color: var(--ink-light);
          font-size: 0.9rem;
          margin-bottom: 16px;
        }
        .map-answer {
          background: var(--glass-bg);
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 16px;
        }
        .map-answer-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .map-type-tag {
          background: var(--glass-bg);
          color: var(--text-turquoise);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
        }
        .map-answer-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          border-radius: 12px;
          margin-top: 12px;
        }
        .map-answer-box.info {
          background: var(--surface-off);
          border: 1px solid var(--border);
          color: var(--ink);
        }
        .map-answer-box.fun {
          background: var(--warning-bg);
          border: 1px dashed var(--warning);
          color: var(--warning-text);
        }
        .map-quick-facts {
          margin-top: 12px;
          padding-right: 18px;
          color: var(--ink-light);
        }
        .map-quick-facts li {
          margin-bottom: 6px;
        }
        .map-answer-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .map-answer-actions button {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
          background: var(--accent);
          color: var(--text-on-primary);
        }
        .map-answer-actions button.secondary {
          background: var(--surface-off);
          color: var(--ink);
        }
        @media (max-width: 900px) {
          .map-search-row,
          .map-answer-actions {
            flex-direction: column;
          }
        }

        .tiles-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .creative-tile {
          padding: 20px;
          border-radius: 20px;
          text-align: center;
          transition: transform 0.3s;
          cursor: pointer;
        }
        .creative-tile:hover { transform: translateY(-10px); }
        .yellow { background: var(--surface-off); border: 2px solid var(--secondary); }
        .tile-icon { font-size: 3rem; margin-bottom: 10px; }
        .nav-btn {
          display: block;
          text-align: center;
          padding: 12px;
          border-radius: 12px;
          text-decoration: none;
          color: var(--text-on-primary);
          font-weight: bold;
          margin-bottom: 10px;
        }
        .game { background: #ec4899; }
        .home { background: var(--primary-gradient); }

        .lesson-hub {
          margin-top: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 20px;
          box-shadow: var(--shadow-lg);
        }
        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .hub-header h3 {
          margin: 0;
          font-size: 1.4rem;
          color: var(--ink);
        }
        .hub-header p {
          margin: 6px 0 0;
          color: var(--ink-light);
          font-size: 0.9rem;
        }
        .hub-points {
          background: var(--surface-off);
          border: 1px solid rgba(14,165,163,.18);
          border-radius: 16px;
          padding: 10px 12px;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-weight: 700;
          color: var(--text-turquoise);
        }
        .hub-progress {
          height: 8px;
          border-radius: 999px;
          background: var(--surface-off);
          overflow: hidden;
        }
        .hub-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary2));
        }
        .hub-tabs {
          margin-bottom: 12px;
        }
        .hub-body {
          display: grid;
          gap: 12px;
        }
        .hub-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
        }

        .lesson-encyclopedia {
          margin-top: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 22px;
          box-shadow: var(--shadow-lg);
        }
        .encyclopedia-header h3 {
          margin: 0 0 6px;
          color: var(--ink);
          font-size: 1.3rem;
        }
        .encyclopedia-header p {
          margin: 0 0 16px;
          color: var(--ink-light);
          font-size: 0.9rem;
        }
        .encyclopedia-grid {
          display: grid;
          gap: 12px;
        }
        .encyclopedia-card {
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 10px 12px;
          background: var(--surface);
        }
        .encyclopedia-card[open] {
          border-color: rgba(14,165,163,.35);
          box-shadow: 0 12px 24px rgba(14,165,163,.12);
        }
        .encyclopedia-card summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          color: var(--ink);
        }
        .encyclopedia-card summary::-webkit-details-marker {
          display: none;
        }
        .encyclopedia-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .encyclopedia-emoji {
          font-size: 1.2rem;
        }
        .encyclopedia-type {
          background: var(--glass-bg);
          color: var(--text-turquoise);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
        }
        .encyclopedia-body {
          margin-top: 10px;
          display: grid;
          gap: 10px;
          color: var(--ink-light);
        }
        .encyclopedia-text {
          margin: 0;
        }
        .encyclopedia-box {
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .encyclopedia-box.info {
          background: var(--surface-off);
          border: 1px solid var(--border);
          color: var(--text-turquoise);
        }
        .encyclopedia-box.story {
          background: var(--surface-off);
          border: 1px solid var(--border);
          color: var(--accent);
        }
        .encyclopedia-box.fun {
          background: var(--glass-bg);
          border: 1px dashed var(--secondary);
          color: var(--ink);
        }
        .encyclopedia-list {
          margin: 0;
          padding-right: 18px;
        }
        .encyclopedia-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .encyclopedia-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .encyclopedia-actions button {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
          background: var(--primary);
          color: var(--text-on-primary);
        }
        .tag-pill {
          border: none;
          background: var(--glass-bg);
          color: var(--text-turquoise);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .quick-links-card {
          margin-top: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 18px;
          box-shadow: var(--shadow-lg);
        }
        .quick-links-card h4 {
          margin: 0 0 10px;
          text-align: center;
          color: var(--accent);
          font-size: 1.1rem;
        }
        .link-btns {
          display: grid;
          gap: 10px;
        }
        .secret-tip {
          margin-top: 10px;
          background: var(--surface-off);
          border-radius: 14px;
          padding: 12px;
          color: var(--ink);
          font-size: 0.85rem;
        }
      `,
        }}
      />
    </motion.div>
  );
}
