import React from "react";
import { motion } from "framer-motion";


const decodeUnicodeEscapes = (value) =>
  value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

export default function Mascot({
  title = "جاهز نبدأ؟",
  text = "اختار درس، واضغط على العلامات على الخريطة، وبعدها حلّ التقييم عشان تجمع نقاط ⭐",
  image = "/اشكال للروبوتات والشات جى بى تى/clipart-cartoon-robot-256x256-1cd8.png"
}) {
  const displayTitle = decodeUnicodeEscapes(title);
  const displayText = decodeUnicodeEscapes(text);
  return (
    <motion.div
      className="mascot"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .35 }}
    >
      <div className="mascotAvatar" aria-hidden="true">
        <img
          src={image}
          alt="زيزو"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div className="mascotBubble">
        <div className="mascotTitle">{displayTitle}</div>
        <div className="mascotText">{displayText}</div>
      </div>
    </motion.div>
  );
}
