import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { lessons } from "../data/lessons.js";
import { levelFromPoints, levelTitle, progressToNext } from "./levels.js";
import { useAppState } from "./AppState.jsx";
import { sfx } from "./sfx.js";
import "../styles/Sidebar.css";

// Helper function to calculate completion percentage
const calculateCompletionPercentage = (progress) => {
  const ids = Object.keys(progress || {});
  if (ids.length === 0) return 0;
  const completedCount = ids.filter((id) => progress[id]?.completed).length;
  return Math.round((completedCount / ids.length) * 100);
};

// Helper function to filter lessons by search query
const filterLessonsByQuery = (lessons, query) => {
  if (!query) return lessons;

  const lowerQuery = query.toLowerCase();
  return lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(lowerQuery) ||
    lesson.subtitle.toLowerCase().includes(lowerQuery) ||
    lesson.sections.some(section => section.heading.toLowerCase().includes(lowerQuery)) ||
    lesson.points.some(point => point.name.toLowerCase().includes(lowerQuery))
  );
};

// Helper function to calculate total resources
const calculateTotalResources = (lessons) => {
  return lessons.reduce((totals, lesson) => ({
    books: totals.books + (lesson.media?.studentBook?.length || 0) + (lesson.media?.selahElTelmeez?.length || 0),
    videos: totals.videos + (lesson.media?.videos?.length || 0),
    audio: totals.audio + (lesson.media?.audio?.length || 0),
    images: totals.images + (lesson.media?.presentationImages?.length || 0)
  }), { books: 0, videos: 0, audio: 0, images: 0 });
};

// Get lesson icon based on index
const getLessonIcon = (index) => {
  const icons = ['💎', '💧', '🏗️'];
  return icons[index] || '📍';
};

// Logo Component
const Logo = () => (
  <motion.div
    className="brand"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    style={{ position: 'relative' }}
  >
    <div className="logo" style={{ overflow: 'hidden', position: 'relative' }}>
      <motion.img
        src="/اشكال للروبوتات والشات جى بى تى/pngtree-friendly-red-robot-waving-clip-art-3d-illustrati.png"
        alt="كنوز مصر"
        style={{
          width: '140%',
          height: '140%',
          objectFit: 'contain',
          position: 'absolute',
          top: '-10%',
          left: '-20%'
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
    </div>
    <div className="title">
      <b>كنوز مصر</b>
      <span>منصة الاستكشاف الجغرافي</span>
    </div>
  </motion.div>
);

// Stats Card Component
const StatsCard = ({ points, completionPercentage, level, levelName, levelProgress }) => (
  <div className="card">
    <div className="row">
      <div>
        <div className="small">نقاطك</div>
        <div className="val-large">{points} ⭐</div>
      </div>
      <div style={{ textAlign: "left" }}>
        <div className="small">التقدم</div>
        <div className="val-med">{completionPercentage}%</div>
      </div>
    </div>

    <div className="hr" />

    <div className="row">
      <div className="small">المستوى: <b>{level}</b></div>
      <div className="small">{levelName}</div>
    </div>

    <div className="prog-wrap">
      <div className="prog-bar" style={{ width: `${completionPercentage}%` }} />
    </div>

    <div className="small" style={{ marginTop: 12, marginBottom: 4 }}>
      التقدم في المستوى: {levelProgress.inLevel}/50
    </div>
    <div className="prog-wrap">
      <div className="prog-bar" style={{ width: `${levelProgress.pct}%` }} />
    </div>

    <div className="btn-row">
      <button className="btn-sec" onMouseDown={() => sfx.click()} onClick={() => { }}>
        إعادة الكل
      </button>
      <NavLink className="btn-sec" to="/" onMouseDown={() => sfx.click()}>
        الرئيسية
      </NavLink>
    </div>
  </div>
);

// Quick Switcher Component
const QuickSwitcher = ({ lessons }) => (
  <div className="lesson-switcher">
    <div className="switcher-header">
      <b>🚀 محطة الاستكشاف</b>
      <span className="small">التنقل السريع</span>
    </div>
    <div className="switcher-grid">
      {lessons.map((lesson, idx) => (
        <NavLink
          key={lesson.id}
          to={`/lesson/${lesson.id}`}
          className={({ isActive }) => `switcher-card ${isActive ? 'active' : ''}`}
          onMouseDown={() => sfx.click()}
        >
          <div className="card-idx">{idx + 1}</div>
          <div className="card-icon">{getLessonIcon(idx)}</div>
          <div className="card-label">
            {lesson.title.includes(":") ? lesson.title.split(":")[1].trim() : lesson.title}
          </div>
        </NavLink>
      ))}
    </div>
  </div>
);

// Lesson Navigation Item Component
const LessonNavItem = ({ lesson, isExpanded, searchQuery, isCompleted }) => (
  <div className={`nav-group ${isExpanded ? 'expanded' : ''}`}>
    <NavLink
      to={`/lesson/${lesson.id}`}
      onMouseDown={() => sfx.click()}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <div className="nav-header-row">
        <div className="nav-title">{lesson.title}</div>
        {/* Always expanded, no chevron needed */}
      </div>
      <div className="nav-sub">{lesson.subtitle}</div>
      {isCompleted ? (
        <div className="nav-status">مكتمل ✅</div>
      ) : (
        <div className="small" style={{ fontSize: '0.7rem', marginTop: 4 }}>
          قيد التعلم...
        </div>
      )}
    </NavLink>

    {isExpanded && (
      <div className="nav-nested">
        {/* Landmarks Section */}
        <div className="nav-category-label">📍 الوجهات والمعالم</div>
        <div className="nav-landmarks-grid">
          {lesson.points.slice(0, 4).map(point => (
            <NavLink
              key={point.id}
              to={`/lesson/${lesson.id}?mode=explore&pointId=${point.id}`}
              className="nav-landmark-pill"
              onMouseDown={() => sfx.click()}
            >
              {point.emoji} {point.name}
            </NavLink>
          ))}
        </div>

        {/* Sections */}
        <div className="nav-category-label">📖 فصول الدرس</div>
        <div className="nav-sections-list">
          {lesson.sections.map((section, idx) => (
            <NavLink
              key={idx}
              to={`/lesson/${lesson.id}?mode=explore#section-${idx}`}
              className="nav-section-link"
              onMouseDown={() => sfx.click()}
            >
              <span className="idx">{idx + 1}</span> {section.heading}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-category-label">🎮 التفاعل والمصادر</div>
        <div className="nav-actions-row">
          <NavLink
            to={`/lesson/${lesson.id}?mode=quiz`}
            className="nav-mini-btn quiz"
            onMouseDown={() => sfx.click()}
          >
            📝 الاختبار
          </NavLink>
          <NavLink
            to={`/lesson/${lesson.id}?mode=video`}
            className="nav-mini-btn video"
            onMouseDown={() => sfx.click()}
          >
            🎬 فيديو
          </NavLink>
          <NavLink
            to={`/lesson/${lesson.id}?mode=library`}
            className="nav-mini-btn book"
            onMouseDown={() => sfx.click()}
          >
            📔 مراجع
          </NavLink>
        </div>
      </div>
    )}
  </div>
);

// Resources Summary Component
const ResourcesSummary = ({ resources }) => (
  <div className="card" style={{ marginTop: 'auto' }}>
    <b>📦 مستودع الموارد الشامل</b>
    <div className="hr" style={{ margin: '8px 0' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <div className="stat-mini-pill">📚 {resources.books} كتب</div>
      <div className="stat-mini-pill">🎬 {resources.videos} فيديو</div>
      <div className="stat-mini-pill">🎙️ {resources.audio} صوت</div>
      <div className="stat-mini-pill">🖼️ {resources.images} لوحات</div>
    </div>
    <div className="hr" style={{ margin: '12px 0' }} />
    <div
      className="nav-item"
      style={{
        background: 'var(--surface-off)',
        borderRadius: '12px',
        padding: '12px',
        border: '1px dashed var(--primary-light)',
        textAlign: 'center',
        color: 'var(--ink)'
      }}
    >
      <div className="nav-title" style={{ fontSize: '0.9rem' }}>
        Presentation is available inside lessons
      </div>
    </div>
  </div>
);

// Main Sidebar Component
export default function Sidebar({ isOpen, onClose }) {
  const { state, resetAll } = useAppState();
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized calculations
  const completionPercentage = useMemo(() =>
    calculateCompletionPercentage(state.progress),
    [state.progress]
  );

  const level = useMemo(() =>
    levelFromPoints(state.points),
    [state.points]
  );

  const levelName = useMemo(() =>
    levelTitle(level),
    [level]
  );

  const levelProgress = useMemo(() =>
    progressToNext(state.points),
    [state.points]
  );

  const filteredLessons = useMemo(() =>
    filterLessonsByQuery(lessons, searchQuery),
    [searchQuery]
  );

  const completedLessons = useMemo(() =>
    Object.values(state.progress || {}).filter(v => v.completed).length,
    [state.progress]
  );

  const totalResources = useMemo(() =>
    calculateTotalResources(lessons),
    []
  );

  // Check if we're on mobile for overlay display
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{ display: 'block' }}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="sidebar-close" onClick={onClose} aria-label="إغلاق القائمة">
          ×
        </button>

        {/* Logo */}
        <Logo />

        {/* Stats Card */}
        <StatsCard
          points={state.points}
          completionPercentage={completionPercentage}
          level={level}
          levelName={levelName}
          levelProgress={levelProgress}
        />

        {/* Lessons Overview Card */}
        <div className="card">
          <div className="row">
            <b>دروس المنصة</b>
            <span className="small">{lessons.length} دروس</span>
          </div>
          <div className="hr" />

          <div style={{ padding: '5px 0' }}>
            <div className="row" style={{ marginBottom: '8px' }}>
              <span className="small">النقاط الإجمالية</span>
              <b style={{ color: 'var(--primary-dark)' }}>{state.points} ⭐</b>
            </div>
            <div className="row">
              <span className="small">دروس اكتملت</span>
              <b>{completedLessons} / {lessons.length}</b>
            </div>
          </div>

          <div className="hr" />

          {/* Quick Switcher */}
          <QuickSwitcher lessons={lessons} />
        </div>

        {/* Search Bar - Now separate */}
        <div className="sidebar-search" style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder="البحث في كل الموارد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="بحث في الدروس"
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Lessons Navigation - Direct Child of Sidebar */}
        <nav className="nav-list">
          {filteredLessons.map((lesson) => {
            const isActive = window.location.pathname.includes(lesson.id);
            // User requested everything expanded ("displayed downwards")
            const isExpanded = true;
            const isCompleted = state.progress?.[lesson.id]?.completed;

            return (
              <LessonNavItem
                key={lesson.id}
                lesson={lesson}
                isExpanded={isExpanded}
                searchQuery={searchQuery}
                isCompleted={isCompleted}
              />
            );
          })}
        </nav>

        {/* Games Link */}
        <NavLink
          className="nav-item games-link"
          to="/games"
          onMouseDown={() => sfx.click()}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="nav-title">🎮 مركز الألعاب التعليمية</div>
          <div className="nav-sub">اختبارات + شهادات + تحديات</div>
        </NavLink>

        {/* Daily Tip */}
        <div className="notice" style={{ animation: "wiggle 6s ease-in-out infinite" }}>
          💡 <strong>نصيحة اليوم:</strong> اسأل الخريطة أي سؤال، وجرب البحث الذكي لتوصل للمعلومة أسرع.
        </div>

        {/* Resources Summary */}
        <ResourcesSummary resources={totalResources} />

        {/* Footer */}
        <div className="footer-note">
          تقنيات المنصة: React + Leaflet 🍃
        </div>
      </aside>
    </>
  );
}