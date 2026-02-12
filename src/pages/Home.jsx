import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { lessons } from "../data/lessons.js";
import { useAppState } from "../components/AppState.jsx";
import { askZizo } from "../services/aiService.js";
import Achievements from "../components/Achievements.jsx";
import "../styles/Home.css";
import "../styles/animations.css";

export default function Home() {
  const { state } = useAppState();
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "zizo", text: "أهلاً يا بطل! أنا زيزو 🦊، صديقك الذكي! اسألني عن أي حاجة في الدنيا وهرد عليك فوراً! 🌟✨" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const lessonOne = lessons.find((l) => l.id === "lesson-1");
  const floatingStickers = ["🌟", "🎈", "🧩", "🎨", "🚀", "🪁"];

  // التمرير التلقائي السلس داخل صندوق الشات فقط
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim() || isTyping) return;

    const input = userQuestion;
    const currentHistory = [...chatHistory];

    setChatHistory(prev => [...prev, { role: "user", text: input }]);
    setUserQuestion("");
    setIsTyping(true);

    try {
      // Use the new AI service with Gemini integration
      const aiResponse = await askZizo(input, currentHistory);
      setChatHistory(prev => [...prev, { role: "zizo", text: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setChatHistory(prev => [...prev, {
        role: "zizo",
        text: "يا مستكشف! 🦊 حصل شوية شوشرة في الاتصال، بس أنا موجود! جرب تسأل تاني كده؟ ✨"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="home-container">
      {/* Background Decor */}
      <div className="bg-decor">
        <motion.div className="shape s1" animate={{ y: [0, 50, 0], x: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="shape s2" animate={{ y: [0, -40, 0], x: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      </div>
      <div className="floating-sticker-layer" aria-hidden="true">
        {floatingStickers.map((icon, index) => (
          <motion.span
            key={`${icon}-${index}`}
            className="floating-sticker"
            style={{
              right: `${10 + (index * 13) % 72}%`,
              top: `${8 + (index * 16) % 74}%`,
            }}
            animate={{ y: [0, -24, 0], rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 5 + index * 0.7, repeat: Infinity, ease: "easeInOut" }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      {/* Hero Section */}
      <motion.section
        className="hero-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="hero-info">
          <motion.span
            className="badge-new"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            موسم الاستكشاف 2026 🗺️
          </motion.span>
          <h1 className="hero-title">اكتشف أسرار <br /> كنوز مصر</h1>
          <p className="hero-desc">رحلة تفاعلية مذهلة لاكتشاف الثروات الطبيعية مع صديقك زيزو وتكنولوجيا الذكاء الاصطناعي.</p>
          <motion.div
            className="user-stats-pill"
            whileHover={{ scale: 1.05 }}
            style={{ background: 'var(--primary-gradient)', padding: '12px 24px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-on-primary)', fontWeight: 800 }}
          >
            ⭐ نقاطك الحالية: {state.points || 0}
          </motion.div>
          <div className="hero-actions">
            <NavLink to={`/lesson/${lessonOne?.id || "lesson-1"}`} className="hero-cta primary">
              ابدأ الاستكشاف
            </NavLink>
            <NavLink to="/games" className="hero-cta secondary">
              ادخل الألعاب
            </NavLink>
          </div>
        </div>
        <motion.img
          className="hero-img"
          src="/اشكال للروبوتات والشات جى بى تى/pngtree-friendly-red-robot-waving-clip-art-3d-illustrati.png"
          alt="زيزو"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut"
          }}
        />
      </motion.section>

      {/* Chat Section */}
      <h2 className="section-heading">💬 رادار زيزو الذكي</h2>
      <section className="chat-container">
        <div className="messages-flow">
          <AnimatePresence>
            {chatHistory.map((msg, i) => (
              <motion.div
                key={i}
                className={`chat-bubble-wrapper ${msg.role}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {msg.role === "zizo" && (
                  <img
                    src="/اشكال للروبوتات والشات جى بى تى/clipart-cartoon-robot-256x256-1cd8.png"
                    alt="زيزو"
                    className="chat-avatar"
                  />
                )}
                <div className="bubble-content">
                  <div className="bubble-role">{msg.role === "zizo" ? "🦊 زيزو" : "أنت"}</div>
                  <p style={{ margin: 0, whiteSpace: "pre-line" }}>{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              className="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img src="/اشكال للروبوتات والشات جى بى تى/clipart-cartoon-robot-256x256-1cd8.png" alt="زيزو" className="chat-avatar" style={{ width: '32px', height: '32px' }} />
              <span>زيزو بيفكر</span>
              <span className="typing-dots">
                <span style={{ animationDelay: '0s' }}>.</span>
                <span style={{ animationDelay: '0.2s' }}>.</span>
                <span style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <input
            className="chat-input"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="اسأل زيزو (مثال: إيه أطول نهر؟ أو احسب 25 × 4)"
          />
          <button type="submit" className="chat-btn" disabled={isTyping}>
            {isTyping ? "..." : "إرسال"}
          </button>
        </form>
      </section>

      {/* Resources Cards */}
      <h2 className="section-heading">💎 اكتشف ثرواتنا</h2>
      <div className="resources-grid">
        {[
          { title: "منجم السكري", icon: "💰", color: "var(--text-turquoise)", text: "أكبر منجم ذهب في مصر يقع في الصحراء الشرقية، كنز مصري حقيقي.", img: "/الدرسالاول الجديد/hq720.jpg" },
          { title: "نهر النيل", icon: "💧", color: "var(--accent)", text: "شريان الحياة والمصدر الرئيسي للمياه والزراعة عبر العصور.", img: "/الخلفيات/Water-Egypt-Nile-of-Egypt-fanack-flickr1024px-1.png" },
          { title: "حقل ظهر", icon: "⛽", color: "var(--secondary)", text: "أكبر حقل غاز طبيعي في البحر المتوسط، فخر الصناعة المصرية.", img: "/الدرس الثانى الجديد/صورة لمصادر الطاقة.jpg" }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="res-card playful-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <div className="res-image-wrap">
              <img src={item.img} alt={item.title} />
              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--glass-bg)', padding: '8px', borderRadius: '12px', fontSize: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
                {item.icon}
              </div>
            </div>
            <div className="res-card-body">
              <div className="res-title">{item.title}</div>
              <div className="res-text">{item.text}</div>
              <div style={{ marginTop: '15px', color: item.color, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>استكشف المزيد</span>
                <span>←</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Platform Features */}
      <h2 className="section-heading">🚀 منصة التعلم الشاملة</h2>
      <div className="platform-grid">
        {[
          { title: "مكتبة المعرفة", icon: "📚", text: "شرح مبسط + صور + فيديو + صوت لكل نقطة.", tags: ["شرح", "صور", "صوت"], gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
          { title: "الخريطة الذكية", icon: "🗺️", text: "اسأل الخريطة عن أي مكان وشوف التفاصيل فورًا.", tags: ["بحث", "مواقع", "حقائق"], gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
          { title: "مختبر الأنشطة", icon: "🧪", text: "تجارب وأسئلة سريعة لرفع الفهم.", tags: ["أنشطة", "أسئلة", "نقاط"], gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
          { title: "مركز الألعاب", icon: "🎮", text: "ألعاب تعليمية وتحديات يومية ممتعة.", tags: ["ألعاب", "تحديات", "جوائز"], gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
          { title: "مشاريع صغيرة", icon: "🧩", text: "مهام تطبيقية تساعد على التذكر.", tags: ["مشروع", "تطبيق", "منزل"], gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
          { title: "لوحة ولي الأمر", icon: "👨‍👩‍👧‍👦", text: "متابعة المستوى والنقاط والإنجازات.", tags: ["متابعة", "تقارير", "تقدّم"], gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="platform-card hover-lift playful-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="platform-icon anim-wiggle" style={{ background: item.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem' }}>{item.icon}</div>
            <div className="platform-title">{item.title}</div>
            <div className="platform-desc">{item.text}</div>
            <div className="platform-tags">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Learning Tracks */}
      <h2 className="section-heading">🧭 مسارات التعلم</h2>
      <div className="tracks-grid">
        {lessons.map((l, index) => (
          <motion.div
            key={l.id}
            className="track-card playful-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            style={{ borderTop: `4px solid ${index % 3 === 0 ? "#f59e0b" : index % 3 === 1 ? "#0ea5a3" : "#fb7185"}` }}
          >
            <div className="track-card-title">{l.title}</div>
            <div className="track-meta">
              <span>{l.points?.length ?? 0} نقاط</span>
              <span>•</span>
              <span>{l.quiz?.mcq?.length ?? 0} أسئلة</span>
            </div>
            <div className="track-desc">{l.subtitle}</div>
            <NavLink to={`/lesson/${l.id}`} className="track-cta">
              ابدأ المسار
            </NavLink>
          </motion.div>
        ))}
      </div>

      {/* Missions */}
      <div className="missions-card">
        <div className="missions-header">
          <h3 className="missions-title">🧩 مهام الأسبوع للمستكشف</h3>
          <span className="missions-badge">نقاط إضافية x2</span>
        </div>
        <ul className="missions-list">
          <li>حدّد 3 مواقع على الخريطة ودوّن معلومة عن كل موقع.</li>
          <li>جاوب على 5 أسئلة في اختبار الدرس.</li>
          <li>اسأل زيزو سؤالًا جديدًا وخليه يشرح الإجابة.</li>
        </ul>
      </div>

      {/* Lessons List & Sidebar */}
      <div className="bottom-layout">
        <div className="lessons-list">
          <h2 className="section-heading" style={{ marginTop: 0 }}>📍 محطات الرحلة</h2>
          {lessons.map((l, i) => (
            <NavLink key={l.id} to={`/lesson/${l.id}`} className="lesson-card playful-card">
              <span className="lesson-num">{i + 1}</span>
              <div className="lesson-info">
                <h4>{l.title}</h4>
                <p>{l.subtitle}</p>
              </div>
              <div className="lesson-status">
                {state.progress?.[l.id]?.completed && <span title="مكتمل">⭐</span>}
              </div>
            </NavLink>
          ))}
        </div>
        <aside>
          <Achievements points={state.points} />
        </aside>
      </div>
      <section className="resource-hub" style={{ marginTop: '50px', padding: '40px', borderRadius: '40px', background: 'var(--surface-off)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 className="section-heading" style={{ margin: 0 }}>📚 مركز الموارد التعليمية</h2>
          <p style={{ color: "var(--ink-light)", opacity: 1, marginTop: '10px' }}>تصفح أهم محتويات الكتب والمواد الدراسية في مكان واحد</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { title: "كتيب الطالب", count: lessons.reduce((acc, l) => acc + (l.media?.studentBook?.length || 0), 0), icon: "📔", color: "#3b82f6" },
            { title: "ملخصات خارجية", count: lessons.reduce((acc, l) => acc + (l.media?.selahElTelmeez?.length || 0), 0), icon: "📘", color: "#10b981" },
            { title: "فيديوهات شرح", count: lessons.reduce((acc, l) => acc + (l.media?.videos?.length || 0), 0), icon: "🎬", color: "#f59e0b" },
            { title: "محاضرات صوتية", count: lessons.reduce((acc, l) => acc + (l.media?.audio?.length || 0), 0), icon: "🎙️", color: "#ef4444" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              style={{
                padding: '20px',
                borderRadius: '24px',
                background: 'var(--surface)',
                borderBottom: `4px solid ${stat.color}`,
                textAlign: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{stat.icon}</div>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{stat.count}</div>
              <div style={{ color: "var(--ink-light)", opacity: 1, fontSize: '0.9rem' }}>{stat.title}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: '40px' }}>
          <h4 style={{ marginBottom: '15px' }}>✨ لمحات من الدروس</h4>
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
            {lessons.flatMap(l => l.media?.presentationImages || []).slice(0, 8).map((img, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                style={{
                  minWidth: '240px',
                  height: '150px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  border: '2px solid white'
                }}
              >
                <img src={img} alt="Highlight" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: "40px" }} />
    </div>
  );
}
