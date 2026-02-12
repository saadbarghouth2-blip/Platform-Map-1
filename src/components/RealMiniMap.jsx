import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-minimap";
import "leaflet-minimap/dist/Control.MiniMap.min.css"; // تأكدي من استيراد الـ CSS الخاص بها

export default function RealMiniMap() {
  const map = useMap();
  const miniMapRef = useRef(null); // مرجع لمنع تكرار إضافة الخريطة

  useEffect(() => {
    // التأكد من عدم إضافة الخريطة المصغرة أكثر من مرة
    if (miniMapRef.current) return;

    // 1. اختيار طبقة الخريطة المصغرة (يفضل أن تكون بسيطة)
    const miniLayer = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { 
        minZoom: 0, 
        maxZoom: 13,
        attribution: "" // إخفاء الحقوق في الخريطة الصغيرة لمنع الزحام
      }
    );

    // 2. إعداد الخريطة المصغرة
    const miniMap = new L.Control.MiniMap(miniLayer, {
      toggleDisplay: true,       // زر لإخفاء/إظهار الخريطة
      minimized: false,          // تبدأ وهي مفتوحة
      position: "bottomleft",    // موقعها
      width: 180,                // عرض أكبر قليلاً
      height: 140,
      zoomLevelOffset: -5,       // تجعل الزوم أصغر من الخريطة الرئيسية لرؤية مصر كاملة
      aimingRectOptions: { 
        color: "#3b82f6",        // لون المربع الذي يحدد مكانك حالياً
        weight: 2, 
        clickable: false 
      },
      shadowRectOptions: { 
        color: "#94a3b8", 
        weight: 1, 
        opacity: 0.5 
      }
    });

    // 3. إضافتها للخريطة وحفظ المرجع
    miniMap.addTo(map);
    miniMapRef.current = miniMap;

    // تنظيف (Cleanup) عند إغلاق المكون
    return () => {
      if (miniMapRef.current) {
        map.removeControl(miniMapRef.current);
        miniMapRef.current = null;
      }
    };
  }, [map]);

  return (
    <style>{`
      /* تجميل الخريطة الصغيرة لتناسب التصميم الحديث */
      .leaflet-control-minimap {
        border: 4px solid white !important;
        border-radius: 15px !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        overflow: hidden;
      }
      .leaflet-control-minimap-toggle-display {
        background-color: #3b82f6 !important;
        border-radius: 5px 0 0 0 !important;
      }
    `}</style>
  );
}