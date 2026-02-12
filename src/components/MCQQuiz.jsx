import React, { useMemo, useState } from "react";
import { sfx } from "./sfx.js";

export default function MCQQuiz({ questions = [], onAnswered }){
  const [answers, setAnswers] = useState({}); // {id: selectedIndex}
  const [checked, setChecked] = useState(false);

  const score = useMemo(() => {
    let s = 0;
    for(const q of questions){
      const picked = answers[q.id];
      if(picked === q.answer) s += 10;
    }
    return s;
  }, [answers, questions]);

  function choose(qid, idx){
    if(checked) return;
    sfx.click();
    setAnswers(prev => ({...prev, [qid]: idx}));
  }

  function check(){
    setChecked(true);
    // feedback sounds
    const full = score === questions.length * 10 && questions.length > 0;
    if(full) sfx.reward();
    else if(score > 0) sfx.correct();
    else sfx.wrong();
    onAnswered?.({ answers, score });
  }

  return (
    <div className="card">
      <div className="row">
        <b>اختبار سريع (اختيار من متعدد)</b>
        <span className="small">+10 نقاط لكل إجابة صحيحة</span>
      </div>
      <div className="hr" />
      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        {questions.map((q, i) => (
          <div key={q.id}>
            <div style={{fontWeight:800, marginBottom:8}}>{i+1}) {q.q}</div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {q.options.map((op, idx) => {
                const picked = answers[q.id];
                const isPicked = picked === idx;
                const isCorrect = checked && idx === q.answer;
                const isWrongPicked = checked && isPicked && idx !== q.answer;
                return (
                  <label
                    key={idx}
                    className={[
                      "quizOption",
                      isCorrect ? "correct" : "",
                      isWrongPicked ? "wrong" : ""
                    ].join(" ")}
                    onClick={() => choose(q.id, idx)}
                  >
                    <input type="radio" name={q.id} checked={isPicked} readOnly />
                    <div>{op}</div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hr" />
      <div className="row">
        <div className="small">النتيجة: <b>{checked ? score : 0}</b></div>
        <button className="btn" onClick={check} disabled={checked || questions.length===0}>تحقق من الإجابات</button>
      </div>

      {checked ? (
        <div className="notice" style={{marginTop:10, borderColor:"rgba(124,58,237,.25)", background:"rgba(124,58,237,.06)"}}>
          {score === questions.length*10 ? "ممتاز! إجاباتك كلها صح." : score > 0 ? "شاطر! راجع الإجابات الغلط وحاول تاني." : "لسه محتاج تراجع الدرس قبل الاختبار!"}
        </div>
      ) : null}
    </div>
  );
}
