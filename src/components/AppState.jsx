import React, { createContext, useContext, useMemo, useState } from "react";
import { loadState, saveState, resetState } from "./storage.js";
import { lessons } from "../data/lessons.js";

const Ctx = createContext(null);

const defaultProgress = Object.fromEntries(lessons.map(l => [l.id, { mcq: {}, mapClick: {}, completed: false }]));
const initial = loadState() ?? {
  points: 0,
  streak: 0,
  theme: "light",
  progress: defaultProgress,
  lastLessonId: lessons[0]?.id ?? null
};

export function AppStateProvider({ children }) {
  const [state, setState] = useState(initial);

  function award(points) {
    setState(prev => {
      const next = { ...prev, points: prev.points + points };
      saveState(next);
      return next;
    });
  }

  function setLessonProgress(lessonId, patch) {
    setState(prev => {
      const prevP = prev.progress?.[lessonId] ?? {};
      const nextProgress = { ...prev.progress, [lessonId]: { ...prevP, ...patch } };
      const next = { ...prev, progress: nextProgress, lastLessonId: lessonId };
      saveState(next);
      return next;
    });
  }

  function markCompleted(lessonId) {
    setLessonProgress(lessonId, { completed: true });
  }

  function toggleTheme() {
    setState(prev => {
      const nextTheme = prev.theme === "dark" ? "light" : "dark";
      const next = { ...prev, theme: nextTheme };
      document.body.setAttribute("data-theme", nextTheme);
      saveState(next);
      return next;
    });
  }

  // Effect to apply theme on load and change
  React.useEffect(() => {
    document.body.setAttribute("data-theme", state.theme || "light");
  }, [state.theme]);

  function resetAll() {
    resetState();
    setState({
      points: 0,
      streak: 0,
      progress: defaultProgress,
      lastLessonId: lessons[0]?.id ?? null
    });
  }

  const value = useMemo(() => ({ state, award, setLessonProgress, markCompleted, resetAll, toggleTheme }), [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
