import React from "react";
import { useAppState } from "./AppState.jsx";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
    const { state, toggleTheme } = useAppState();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <button className="menu-toggle" onClick={onToggleSidebar}>
                        ☰
                    </button>
                    <Link to="/" className="navbar-brand">
                        <span className="brand-icon">🛡️</span>
                        <span className="brand-text">كنوز مصر</span>
                    </Link>

                    <div className="navbar-links">
                        <Link to="/" className="nav-link">الرئيسية</Link>
                        <Link to="/games" className="nav-link">الألعاب</Link>
                        {/* We can add a dropdown for lessons later if needed, strictly sticking to user request for 'everything in navbar' */}
                    </div>
                </div>

                <div className="navbar-actions">
                    <motion.button
                        className="theme-btn"
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={state.theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
                    >
                        {state.theme === "dark" ? "☀️" : "🌙"}
                    </motion.button>

                    <div className="user-score-badge">
                        ⭐ {state.points || 0}
                    </div>
                </div>
            </div>
        </nav>
    );
}
