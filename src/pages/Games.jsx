import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DragDropMinerals from "../components/DragDropMinerals.jsx";
import { useAppState } from "../components/AppState.jsx";
import Certificate from "../components/Certificate.jsx";
import { levelFromPoints, levelTitle } from "../components/levels.js";
import "../styles/Games.css";
import "../styles/animations.css";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
  })
};

export default function Games() {
  const { state, award } = useAppState();
  const level = levelFromPoints(state.points);
  const title = levelTitle(level);
  const gameFloaters = ["🎯", "🎲", "🌈", "⭐", "🧠", "🎁"];

  // --- QUIZ STATE ---
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);

  // 50+ Questions Bank
  const questions = [
    // Resources & Geography
    { q: "منجم السكري مشهور بـ؟", options: ["الذهب", "الفوسفات", "الفحم", "الغاز"], correct: 0, points: 10 },
    { q: "أكبر حقل غاز في المتوسط هو؟", options: ["ظهر", "الزعفرانة", "قارون", "توشكى"], correct: 0, points: 10 },
    { q: "محطة بنبان تعتمد على؟", options: ["الطاقة الشمسية", "الفحم", "الديزل", "الغاز"], correct: 0, points: 10 },
    { q: "البحر الأحمر يتميز بـ؟", options: ["شعاب مرجانية", "ثلوج", "صحارى جليد", "أنهار"], correct: 0, points: 10 },
    { q: "قناة السويس تربط بين؟", options: ["المتوسط والأحمر", "النيل والمتوسط", "النيل والأحمر", "المتوسط والبحيرات"], correct: 0, points: 10 },
    { q: "أي مدينة تلقب بمدينة الـ 100 باب؟", options: ["الأقصر", "أسوان", "القاهرة", "الإسكندرية"], correct: 0, points: 10 },
    { q: "أين تقع محمية وادي الحيتان؟", options: ["الفيوم", "الجيزة", "الوادي الجديد", "مطروح"], correct: 0, points: 10 },
    { q: "ما هي المحافظة التي تشتهر بصناعة الأثاث؟", options: ["دمياط", "قنا", "الأقصر", "بورسعيد"], correct: 0, points: 10 },
    { q: "ما هو أطول نهر في العالم ويمر بمصر؟", options: ["النيل", "الأمازون", "الكونغو", "دجلة"], correct: 0, points: 10 },
    { q: "أين يقع معبد أبو سمبل؟", options: ["أسوان", "الأقصر", "سوهاج", "إدفو"], correct: 0, points: 10 },
    { q: "السد العالي يوجد في محافظة؟", options: ["أسوان", "الأقصر", "قنا", "القاهرة"], correct: 0, points: 10 },
    { q: "جبل سانت كاترين يقع في؟", options: ["جنوب سيناء", "شمال سيناء", "الصحراء الغربية", "الشرقية"], correct: 0, points: 10 },
    { q: "الحديد يستخرج من؟", options: ["الواحات البحرية", "أبو طرطور", "أم بجمة", "سفاجا"], correct: 0, points: 10 },
    { q: "محطة جبل الزيت تولد كهرباء من؟", options: ["الرياح", "الشمس", "المياه", "الفحم"], correct: 0, points: 10 },
    { q: "أشجار المانجروف تنمو على سواحل؟", options: ["البحر الأحمر", "نهر النيل", "بحيرة ناصر", "الإسماعيلية"], correct: 0, points: 10 },
    { q: "محمية رأس محمد تقع عند التقاء؟", options: ["السويس والعقبة", "النيل والمتوسط", "الأحمر والمتوسط", "ناصر وتوشكى"], correct: 0, points: 10 },
    { q: "مدينة الجلود تقع في؟", options: ["الروبيكي", "دمياط", "بورسعيد", "أسيوط"], correct: 0, points: 10 },
    { q: "تعتمد الزراعة في الواحات على؟", options: ["المياه الجوفية", "مياه النيل", "مياه الأمطار", "بحرية"], correct: 0, points: 10 },
    { q: "يستخرج المنجنيز من؟", options: ["أم بجمة", "المغارة", "السويس", "العلمين"], correct: 0, points: 10 },
    { q: "أكبر بحيرة صناعية في العالم هي؟", options: ["بحيرة ناصر", "بحيرة قارون", "بحيرة المنزلة", "البرلس"], correct: 0, points: 10 },
    { q: "عاصمة مصر في العهد القديم؟", options: ["منف", "القاهرة", "مرسى مطروح", "بورسعيد"], correct: 0, points: 10 },
    { q: "أين يقع ميناء الإسكندرية؟", options: ["البحر المتوسط", "البحر الأحمر", "النيل", "بحيرة مريوط"], correct: 0, points: 10 },
    { q: "ما هو الحيوان الوطني لمصر؟", options: ["عقاب السهول (النسر)", "الأسد", "الجمل", "التمساح"], correct: 0, points: 10 },
    { q: "في أي قارة تقع مصر؟", options: ["أفريقيا", "آسيا", "أوروبا", "أمريكا"], correct: 0, points: 10 },
    { q: "ما هو المحصول الملقب بالذهب الأبيض؟", options: ["القطن", "القمح", "الأرز", "الذرة"], correct: 0, points: 10 },
    { q: "أين يوجد معبد الكرنك؟", options: ["الأقصر", "أسوان", "البحيرة", "أسيوط"], correct: 0, points: 10 },
    { q: "المحافظة التي يمر بها فرع دمياط ورشيد؟", options: ["البحيرة وكفر الشيخ", "أسوان", "قنا", "المنيا"], correct: 0, points: 10 },
    { q: "المشروع الذي يربط سيناء بالوادي؟", options: ["أنفاق قناة السويس", "قناة السويس الجديدة", "سد العالي", "النهر الصناعي"], correct: 0, points: 10 },
    { q: "أين توجد صخور الرخام الفاخرة؟", options: ["جبل الجلالة", "السكري", "المغارة", "بنبان"], correct: 0, points: 10 },
    { q: "النبات الشهير الذي استخدمه القدماء للكتابة؟", options: ["البردي", "النيلي", "الكتان", "القطن"], correct: 0, points: 10 },

    // Modern & Future
    { q: "مدينة العلمين الجديدة تقع على؟", options: ["البحر المتوسط", "البحر الأحمر", "النيل", "بحيرة ناصر"], correct: 0, points: 10 },
    { q: "مشروع الدلتا الجديدة يهدف لـ؟", options: ["استصلاح الأراضي", "بناء مصانع", "توليد كهرباء", "صيد الأسماك"], correct: 0, points: 10 },
    { q: "القطار الكهربائي السريع يربط العين السخنة بـ؟", options: ["مطروح", "أسوان", "سيناء", "المنيا"], correct: 0, points: 10 },
    { q: "محطة الضبعة النووية تقع في؟", options: ["مرسى مطروح", "الإسكندرية", "بورسعيد", "السويس"], correct: 0, points: 10 },
    { q: "مشروع 'حياة كريمة' يهدف لتطوير؟", options: ["الريف المصري", "المدن الجديدة", "المطارات", "الموانئ"], correct: 0, points: 10 },

    // History & Culture
    { q: "من هو باني الهرم الأكبر؟", options: ["خوفو", "خفرع", "منقرع", "زوسر"], correct: 0, points: 10 },
    { q: "ما هو الحجر الذي فك رموز الهيروقليفية؟", options: ["حجر رشيد", "حجر باليرمو", "مسلة فيلة", "لوحة نارمر"], correct: 0, points: 10 },
    { q: "أول طبيب في التاريخ هو؟", options: ["إمحوتب", "أحمس", "رمسيس", "توت عنخ آمون"], correct: 0, points: 10 },
    { q: "الملكة التي حكمت مصر كفرعون؟", options: ["حتشبسوت", "نفرتيتي", "كليوباترا", "تي"], correct: 0, points: 10 },
    { q: "أين يقع المتحف القومي للحضارة؟", options: ["الفسطاط", "التحرير", "الهرم", "العاصمة الإدارية"], correct: 0, points: 10 },

    // General Knowledge
    { q: "العملة الرسمية لمصر هي؟", options: ["الجنيه المصري", "الدولار", "اليورو", "الريال"], correct: 0, points: 10 },
    { q: "عدد محافظات مصر؟", options: ["27", "25", "30", "20"], correct: 0, points: 10 },
    { q: "أكبر بحيرة طبيعية في مصر؟", options: ["المنزلة", "قارون", "البرلس", "مريوط"], correct: 0, points: 10 },
    { q: "أعلى قمة جبلية في مصر؟", options: ["سانت كاترين", "موسى", "شايب البنات", "العوينات"], correct: 0, points: 10 },
    { q: "ما هو البحر الذي يفصل بين مصر والسعودية؟", options: ["البحر الأحمر", "البحر المتوسط", "بحر العرب", "الخليج"], correct: 0, points: 10 },

    // Fun & Nature
    { q: "طائر الفلامنجو يهاجر إلى؟", options: ["بحيرات الشمال", "الصحراء الغربية", "وادي النيل", "جبال البحر الأحمر"], correct: 0, points: 10 },
    { q: "حيوان 'الأطوم' (عروس البحر) يوجد في؟", options: ["البحر الأحمر", "النيل", "بحيرة ناصر", "بحيرة قارون"], correct: 0, points: 10 },
    { q: "محمية 'رأس محمد' تشتهر بـ؟", options: ["الشعاب المرجانية", "الديناصورات", "الحيتان", "الرمال السوداء"], correct: 0, points: 10 },
    { q: "أين تقع الصحراء البيضاء؟", options: ["الفرافرة", "سيناء", "أسوان", "الشرقية"], correct: 0, points: 10 },
    { q: "ما هي المدينة التي تسمى 'عروس المتوسط'؟", options: ["الإسكندرية", "بورسعيد", "مرسى مطروح", "العريش"], correct: 0, points: 10 }
  ];

  // --- MATCHING STATE ---
  const allMatchingPairs = [
    { id: 1, resource: "ذهب", location: "منجم السكري" },
    { id: 2, resource: "فوسفات", location: "أبو طرطور" },
    { id: 3, resource: "بترول", location: "خليج السويس" },
    { id: 4, resource: "طاقة شمسية", location: "بنبان" },
    { id: 5, resource: "أثاث", location: "مدينة دمياط" },
    { id: 6, resource: "جلود", location: "الروبيكي" },
    { id: 7, resource: "كهرباء", location: "السد العالي" },
    { id: 8, resource: "مانجروف", location: "البحر الأحمر" },
    { id: 9, resource: "حيتان", location: "الفيوم" },
    { id: 10, resource: "أرز", location: "الدلتا" },
    { id: 11, resource: "سيراميك", location: "العين السخنة" },
    { id: 12, resource: "رخام", location: "الجلالة" },
    { id: 13, resource: "بلح", location: "سيوه" },
    { id: 14, resource: "أسماك", location: "بحيرة ناصر" }
  ];

  const [matchSubset, setMatchSubset] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [matchScore, setMatchScore] = useState(0);
  const triggerCelebration = () => {
    setCelebrationKey((prev) => prev + 1);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 700);
  };

  const buildMatchSubset = () => [...allMatchingPairs].sort(() => 0.5 - Math.random()).slice(0, 5);

  useEffect(() => {
    setMatchSubset(buildMatchSubset());
  }, []);

  const resetMatchingRound = () => {
    setMatchSubset(buildMatchSubset());
    setSelectedItems([]);
    setMatchedIds([]);
    setMatchScore(0);
  };

  const matchingResources = useMemo(() => matchSubset.map((p) => ({ id: p.id, label: p.resource, type: "resource" })), [matchSubset]);
  const matchingLocations = useMemo(() => matchSubset.map((p) => ({ id: p.id, label: p.location, type: "location" })), [matchSubset]);
  const shuffledMatchItems = useMemo(() => [...matchingResources, ...matchingLocations].sort(() => 0.5 - Math.random()), [matchingResources, matchingLocations]);

  // --- TRUE/FALSE STATE ---
  const tfFacts = [
    { f: "مصر تقع في الركن الشمالي الشرقي من أفريقيا.", ans: true },
    { f: "البحر الأحمر يحد مصر من الشمال.", ans: false },
    { f: "نهر النيل ينبع من بحيرة ناصر داخل مصر.", ans: false },
    { f: "الأقصر تحتوي على ثلث آثار العالم.", ans: true },
    { f: "قناة السويس الجديدة طولها 1000 كم.", ans: false },
    { f: "القطن المصري طويل التيلة مشهور عالمياً.", ans: true },
    { f: "الهرم الأكبر هو أحد عجائب الدنيا السبع.", ans: true },
    { f: "الفراعنة استخدموا الحديد لبناء الأهرامات.", ans: false }
  ];
  const [tfIdx, setTfIdx] = useState(0);
  const [tfResult, setTfResult] = useState(null);
  const [tfScore, setTfScore] = useState(0);

  // --- QUIZ HANDLERS ---
  const handleAnswerClick = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === questions[currentQuestion].correct) {
      setQuizScore(prev => prev + 10);
      award(10);
      triggerCelebration();
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizStarted(false);
      award(quizScore / 2); // bonus
    }
  };

  // --- MATCH HANDLERS ---
  const handleMatchClick = (item) => {
    if (matchedIds.includes(item.id)) return;
    if (selectedItems.length === 0) {
      setSelectedItems([item]);
      return;
    }
    const first = selectedItems[0];
    if (first.id === item.id && first.type !== item.type) {
      setMatchScore(prev => prev + 15);
      award(15);
      setMatchedIds(prev => [...prev, item.id]);
      triggerCelebration();
    }
    setSelectedItems([]);
  };

  // --- TF HANDLERS ---
  const checkTF = (userAns) => {
    if (tfResult !== null) return;
    const correct = tfFacts[tfIdx].ans === userAns;
    setTfResult(correct ? "ممتاز! 🎉" : "خطأ! حاول تاني ❌");
    if (correct) {
      setTfScore(prev => prev + 5);
      award(5);
      triggerCelebration();
    }
    setTimeout(() => {
      setTfResult(null);
      setTfIdx((tfIdx + 1) % tfFacts.length);
    }, 1500);
  };

  return (
    <div className="games-container">
      <div className="games-floater-layer" aria-hidden="true">
        {gameFloaters.map((icon, index) => (
          <motion.span
            key={`${icon}-${index}`}
            className="games-floater"
            style={{ right: `${12 + (index * 14) % 74}%`, top: `${12 + (index * 11) % 72}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            key={celebrationKey}
            className="celebration-burst"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section className="games-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="hero-sub">🎮 عالم الألعاب</div>
        <h1>تحديات كنوز مصر</h1>
        <p>50+ سؤال جديد • ألعاب تفاعلية • جوائز قيمة</p>
        <div className="stats-pills">
          <div className="stat-pill">🏆 {title}</div>
          <div className="stat-pill">⭐ {state.points} نقطة</div>
          <div className="stat-pill">📈 مستوى {level}</div>
        </div>
      </motion.section>

      <div className="games-grid">
        {/* NEW CARD STACK QUIZ */}
        <motion.div className="game-card playful-game-card quiz-card-stack" variants={cardVariants} initial="hidden" whileInView="visible" custom={0}>
          <div className="game-icon">🧠</div>
          <h3 className="game-title">اختبار العباقرة</h3>

          {!quizStarted ? (
            <div style={{ textAlign: 'center' }}>
              <p className="game-desc">هل أنت مستعد لتحدي الـ 50 سؤال؟</p>
              <button className="quiz-btn-start" onClick={() => setQuizStarted(true)}>ابدأ التحدي 🚀</button>
            </div>
          ) : (
            <div className="quiz-container">
              {/* Progress Bar */}
              <div className="quiz-progress-track">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="quiz-header">
                <span>سؤال {currentQuestion + 1} / {questions.length}</span>
                <span className="quiz-score-badge">✨ {quizScore}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="quiz-question">{questions[currentQuestion].q}</div>

                  <div className="quiz-options-grid">
                    {questions[currentQuestion].options.map((opt, i) => (
                      <motion.div
                        key={i}
                        className={`quiz-opt-card ${showResult ? (i === questions[currentQuestion].correct ? "correct" : (i === selectedAnswer ? "wrong" : "")) : ""}`}
                        onClick={() => handleAnswerClick(i)}
                        whileHover={!showResult ? { scale: 1.02, translateY: -2 } : {}}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                        {opt}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="quiz-footer-actions"
                >
                  <div className={`result-feedback ${selectedAnswer === questions[currentQuestion].correct ? "success" : "error"}`}>
                    {selectedAnswer === questions[currentQuestion].correct ? "إجابة صحيحة! 🎉" : "للأسف خطأ 😢"}
                  </div>
                  <button className="btn-next" onClick={nextQuestion}>السؤال التالي ⬅</button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* MATCHING */}
        <motion.div className="game-card playful-game-card" variants={cardVariants} initial="hidden" whileInView="visible" custom={1}>
          <div className="game-icon">🔗</div>
          <h3 className="game-title">وصل الموارد</h3>
          <p className="game-desc">أوصل كل مورد بالمكان الصحيح!</p>
          <div className="match-grid">
            {shuffledMatchItems.map((item, i) => (
              <button key={i} className={`match-btn ${matchedIds.includes(item.id) ? "matched" : ""} ${selectedItems[0] === item ? "selected" : ""}`} onClick={() => handleMatchClick(item)} disabled={matchedIds.includes(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          {matchedIds.length === matchSubset.length && (
            <button className="quiz-btn-start" onClick={resetMatchingRound}>مرحلة جديدة 🔄</button>
          )}
        </motion.div>

        {/* TRUE/FALSE */}
        <motion.div className="game-card playful-game-card" variants={cardVariants} initial="hidden" whileInView="visible" custom={2}>
          <div className="game-icon">⚡</div>
          <h3 className="game-title">صح أم خطأ؟</h3>
          <div className="tf-container">
            <div className="tf-q">{tfFacts[tfIdx].f}</div>
            <div className="tf-buttons">
              <button className="tf-btn true" onClick={() => checkTF(true)}>صح ✅</button>
              <button className="tf-btn false" onClick={() => checkTF(false)}>خطأ ❌</button>
            </div>
            <AnimatePresence>
              {tfResult && (
                <motion.div
                  className="tf-result-box"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  {tfResult}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* DRAG DROP */}
        <motion.div className="game-card playful-game-card" variants={cardVariants} initial="hidden" whileInView="visible" custom={3}>
          <div className="game-icon">🏗️</div>
          <h3 className="game-title">مهندس الموارد</h3>
          <DragDropMinerals />
        </motion.div>
      </div>

      <motion.div className="certificate-card" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <h2>🏆 لوحة الشرف</h2>
        <Certificate playerName="المستكشف المتميز" />
      </motion.div>
    </div>
  );
}
