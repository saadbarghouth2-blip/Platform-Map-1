import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { AppStateProvider } from "./components/AppState.jsx";
import Home from "./pages/Home.jsx";
import Lesson from "./pages/Lesson.jsx";
import Games from "./pages/Games.jsx";
import Present from "./pages/Present.jsx";

import Navbar from "./components/Navbar.jsx";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <AppStateProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="kids-atmosphere" aria-hidden="true">
          <span className="kids-blob blob-1" />
          <span className="kids-blob blob-2" />
          <span className="kids-blob blob-3" />
          <span className="kids-blob blob-4" />
        </div>
        <div className="app">
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lesson/:id" element={<Lesson />} />
              <Route path="/games" element={<Games />} />
              <Route path="/present" element={<Present />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>
      </BrowserRouter>
    </AppStateProvider>
  );
}
