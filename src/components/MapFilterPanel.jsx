import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const MAP_LAYERS_META = {
    // --- Resources ---
    resources: {
        id: "resources",
        title: "💰 الثروات المعدنية (الذهب والفوسفات)",
        icon: "💎",
        description: "توزيع أهم المناجم والمحاجر في مصر، مثل منجم السكري والمناطق الغنية بالذهب والمعادن الاستراتيجية.",
        color: "var(--secondary)",
        category: "المعادن والثروات"
    },
    egypt_user: {
        id: "egypt_user",
        title: "📈 خدمات قطاعية متقدمة",
        icon: "📊",
        description: "بيانات تفصيلية للقطاعات الاقتصادية والتنموية من المركز القومي لنظم المعلومات الجغرافية.",
        color: "var(--accent)",
        category: "المعادن والثروات"
    },

    // --- Water & Nature ---
    water: {
        id: "water",
        title: "🌊 المسطحات المائية والبحيرات",
        icon: "💧",
        description: "تتبع مجرى النيل والبحيرات (ناصر، قارون، المنزلة) وكيفية الحفاظ على الأمن المائي المصري.",
        color: "var(--primary)",
        category: "المياه والبيئة"
    },
    hydro: {
        id: "hydro",
        title: "🛰️ شبكة الهيدرولوجيا الوطنية",
        icon: "🗺️",
        description: "بيانات هيدرولوجية دقيقة تظهر حركة المياه وتوزيعها عبر الأراضي المصرية.",
        color: "var(--primary-dark)",
        category: "المياه والبيئة"
    },
    nature: {
        id: "nature",
        title: "🌿 الغابات والغطاء النباتي",
        icon: "🌲",
        description: "استعراض الغابات الشجرية والمحميات والمناطق التي نجحت مصر في استثمارها زراعياً.",
        color: "var(--accent)",
        category: "المياه والبيئة"
    },

    // --- Agriculture ---
    farming: {
        id: "farming",
        title: "🚜 أنظمة الزراعة والأراضي",
        icon: "🌾",
        description: "دراسة أنواع التربة وأنظمة الزراعة المختلفة لضمان الأمن الغذائي المصري (بيانات ISRIC).",
        color: "var(--accent)",
        category: "الزراعة والأراضي"
    },
    fao_base: {
        id: "fao_base",
        title: "🌍 قاعدة بيانات الفاو (FAO)",
        icon: "🌐",
        description: "بيانات عالمية لربط الزراعة في مصر بالمنظومة الدولية للأمن الغذائي.",
        color: "var(--primary-dark)",
        category: "الزراعة والأراضي"
    },

    // --- Urban & Cairo ---
    cairo_full: {
        id: "cairo_full",
        title: "🏗️ مركز القاهرة العمراني",
        icon: "🏛️",
        description: "حدود محافظة القاهرة بكل تفاصيلها العمرانية والتاريخية.",
        color: "var(--secondary)",
        category: "التوسع العمراني"
    },
    gamaleya: {
        id: "gamaleya",
        title: "🕌 حي الجمالية التاريخي",
        icon: "✨",
        description: "استكشاف أقدم وأعرق أحياء القاهرة الإسلامية ومعالمها الفريدة.",
        color: "var(--accent)",
        category: "التوسع العمراني"
    },
    maadi: {
        id: "maadi",
        title: "🏡 أرقى أحياء المعادي",
        icon: "🌳",
        description: "دراسة التخطيط العمراني المتميز لحي المعادي وخدماته المتكاملة.",
        color: "var(--secondary-dark)",
        category: "التوسع العمراني"
    },

    // --- Administrative ---
    provinces: {
        id: "provinces",
        title: "🗺️ حدود المحافظات 2023",
        icon: "📍",
        description: "التقسيم الإداري الأحدث لمصر يظهر حدود الـ 27 محافظة بوضوح تكنولوجي.",
        color: "var(--ink-light)",
        category: "الحدود والإدارة"
    }
};

export default function MapFilterPanel({ activeLayers, onToggleLayer }) {
    const [isOpen, setIsOpen] = useState(false);

    const categories = [
        "الحدود والإدارة",
        "المعادن والثروات",
        "المياه والبيئة",
        "الزراعة والأراضي",
        "التوسع العمراني"
    ];

    return (
        <div className="map-filter-container" style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1000 }}>
            {/* Toggle Button */}
            <motion.button
                className="filter-toggle-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "var(--glass-blur)",
                    border: "2px solid var(--border)",
                    borderRadius: "20px",
                    padding: "12px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    boxShadow: "var(--glass-shadow)",
                    fontWeight: "800",
                    color: "var(--ink)",
                    fontSize: "1rem"
                }}
            >
                <span>{isOpen ? "✖️ إغلاق اللوحة" : "🔍 استكشاف طبقات مصر"}</span>
                {!isOpen && <span className="active-count-badge">{Object.values(activeLayers).filter(v => v).length}</span>}
            </motion.button>

            {/* Filter Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 60, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.8 }}
                        className="filter-panel-card"
                        style={{
                            marginTop: "12px",
                            width: "360px",
                            background: "var(--glass-bg)",
                            backdropFilter: "var(--glass-blur)",
                            border: "1px solid var(--border)",
                            borderRadius: "32px",
                            padding: "24px",
                            boxShadow: "var(--shadow-premium)",
                            maxHeight: "75vh",
                            overflowY: "auto",
                            direction: "rtl"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, color: "var(--ink)", fontSize: "1.2rem", fontWeight: "900" }}>🎓 مكتبة المعلومات</h3>
                            <span style={{ fontSize: "0.75rem", background: "var(--surface-off)", color: "var(--text-turquoise)", padding: "4px 10px", borderRadius: "10px", fontWeight: "700" }}>Live GIS</span>
                        </div>

                        {categories.map(cat => (
                            <div key={cat} className="filter-category" style={{ marginBottom: "24px" }}>
                                <h4 style={{
                                    fontSize: "0.85rem",
                                    color: "var(--ink-light)",
                                    margin: "0 0 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                }}>
                                    <div style={{ width: 4, height: 16, background: "var(--primary)", borderRadius: 2 }} />
                                    {cat}
                                </h4>
                                <div className="filter-items" style={{ display: "grid", gap: "12px" }}>
                                    {Object.values(MAP_LAYERS_META).filter(l => l.category === cat).map(layer => (
                                        <motion.div
                                            key={layer.id}
                                            className={`filter-item ${activeLayers[layer.id] ? 'active' : ''}`}
                                            onClick={() => onToggleLayer(layer.id)}
                                            whileHover={{ scale: 1.02, x: -4 }}
                                            style={{
                                                padding: "16px",
                                                borderRadius: "20px",
                                                background: activeLayers[layer.id] ? "var(--surface)" : "var(--surface-off)",
                                                border: `2px solid ${activeLayers[layer.id] ? "var(--primary)" : "var(--border)"}`,
                                                cursor: "pointer",
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                                <div style={{
                                                    width: "38px",
                                                    height: "38px",
                                                    borderRadius: "12px",
                                                    background: activeLayers[layer.id] ? layer.color : "var(--surface-off)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "1.3rem",
                                                    transition: "all 0.3s ease",
                                                    boxShadow: activeLayers[layer.id] ? `0 8px 16px rgba(0,0,0,0.1)` : "none"
                                                }}>
                                                    {layer.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "900", fontSize: "0.95rem", color: activeLayers[layer.id] ? "var(--ink)" : "var(--ink-light)" }}>{layer.title}</div>
                                                </div>
                                                <div className="custom-checkbox" style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 6,
                                                    background: activeLayers[layer.id] ? "var(--primary)" : "var(--surface-off)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.2s ease"
                                                }}>
                                                    {activeLayers[layer.id] && <span style={{ color: "var(--text-on-primary)", fontSize: "0.8rem" }}>✔️</span>}
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-light)", lineHeight: "1.6", fontWeight: "500" }}>
                                                {layer.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="panel-footer-premium">
                            <p>تم دمج أكثر من 12 طبقة جغرافية احترافية لتعزيز تجربة التعلم 🚀</p>
                            <span>المصدر: وزارة الاتصالات + هيئة المساحة + FAO</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .filter-panel-card::-webkit-scrollbar { width: 4px; }
        .filter-panel-card::-webkit-scrollbar-track { background: transparent; }
        .filter-panel-card::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
        .filter-item.active { box-shadow: var(--shadow-sm); }
        .active-count-badge {
            background: var(--accent);
            color: var(--text-on-primary);
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 0.8rem;
            margin-right: 4px;
        }
        .panel-footer-premium {
            margin-top: 15px;
            padding: 15px;
            background: var(--surface-off);
            border-radius: 20px;
            text-align: center;
        }
        .panel-footer-premium p { margin: 0 0 5px; font-size: 0.75rem; color: var(--ink); font-weight: 700; }
        .panel-footer-premium span { font-size: 0.65rem; color: var(--ink-light); }
      `}</style>
        </div>
    );
}
