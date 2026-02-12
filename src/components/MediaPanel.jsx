import React, { useEffect, useMemo, useState } from "react";
import { searchOpenverseAudio, searchOpenverseImages } from "../services/openverse.js";
import ImageGallery from "./ImageGallery.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import { speakArabic, stopSpeak } from "./tts.js";
import { sfx } from "./sfx.js";

function Attribution({ item }) {
  if (!item) return null;
  return (
    <div className="small" style={{ opacity: 0.9 }}>
      {item.creator ? <>✍️ {item.creator} · </> : null}
      {item.license ? <>📄 {item.license} </> : null}
      {item.source ? <>· <a href={item.source} target="_blank" rel="noreferrer">المصدر</a></> : null}
      {item.licenseUrl ? <>· <a href={item.licenseUrl} target="_blank" rel="noreferrer">الرخصة</a></> : null}
    </div>
  );
}

export default function MediaPanel({ point }) {
  const query = useMemo(() => point?.ovQuery || point?.name, [point?.id, point?.ovQuery, point?.name]);
  const [ovImgs, setOvImgs] = useState([]);
  const [ovAud, setOvAud] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setOvImgs([]);
    setOvAud([]);
    setErr("");
    if (!point || !query) return;

    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const [imgs, aud] = await Promise.all([
          searchOpenverseImages(query, { page_size: 18 }),
          searchOpenverseAudio(query, { page_size: 10 }),
        ]);
        if (cancel) return;
        setOvImgs(imgs);
        setOvAud(aud);
      } catch {
        if (cancel) return;
        setErr("تعذر تحميل صور/صوت من المصدر.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [point?.id, query]);

  if (!point) {
    return (
      <div className="card">
        <b>مركز المعرفة</b>
        <div className="hr" />
        <div className="small">اختر نقطة من الخريطة ليظهر هنا الصور والصوت والشرح.</div>
      </div>
    );
  }

  const storyText = point.story || point.info || "";
  const localImages = point.images || [];
  const images = localImages.length ? localImages : ovImgs.map((x) => x.thumb || x.url);
  const audioSrc = point.audioUrl || (ovAud[0]?.url ?? null);

  const localVideoSrc = point.videoSrc || null;
  const embedVideoUrl = point.videoUrl || null;
  const hasVideo = Boolean(localVideoSrc || embedVideoUrl);
  const videoTitle = point.videoTitle || "فيديو شرح مبسط";

  return (
    <div className="card">
      <div className="row">
        <b>مركز المعرفة</b>
        <span className="small">صور + صوت + فيديو</span>
      </div>
      <div className="hr" />

      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{point.name}</div>
      <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12, color: "var(--ink-light)" }}>{storyText}</div>

      {point.educationalContent ? (
        <div
          style={{
            padding: 12,
            background: "var(--info-bg)",
            borderRadius: 12,
            border: "1px solid var(--info)",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: "var(--info-text)" }}>
            معلومة تعليمية:
          </div>
          <div style={{ fontSize: 13, color: "var(--info-text)", lineHeight: 1.7 }}>{point.educationalContent}</div>
        </div>
      ) : null}

      {point.funFact ? (
        <div
          style={{
            padding: 12,
            background: "var(--warning-bg)",
            borderRadius: 12,
            border: "1px dashed var(--warning)",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: "var(--warning-text)" }}>
            حقيقة ممتعة:
          </div>
          <div style={{ fontSize: 13, color: "var(--warning-text)", lineHeight: 1.7 }}>{point.funFact}</div>
        </div>
      ) : null}

      <div className="btnRow" style={{ marginTop: 10 }}>
        <button className="btn secondary" onMouseDown={() => sfx.click()} onClick={() => speakArabic(`${point.name}. ${storyText}`)}>
          قراءة بصوت (TTS)
        </button>
        <button className="btn secondary" onMouseDown={() => sfx.click()} onClick={stopSpeak}>
          إيقاف
        </button>
      </div>

      <div className="hr" />
      <b>📸 الصور (من المصدر)</b>
      {loading && !images.length ? <div className="small">جاري تحميل الصور...</div> : null}
      {err ? <div className="small">{err}</div> : null}
      <ImageGallery images={images} />
      {!localImages.length ? <Attribution item={ovImgs[0]} /> : null}

      <div className="hr" />
      <AudioPlayer src={audioSrc} title="🎧 صوت المكان (من المصدر)" />
      {!point.audioUrl ? <Attribution item={ovAud[0]} /> : null}

      {hasVideo ? (
        <>
          <div className="hr" />
          <b>🎬 {videoTitle}</b>
          {point.kidHint ? (
            <div className="small" style={{ marginTop: 6, marginBottom: 10, color: "var(--ink-light)", fontWeight: 700 }}>
              {point.kidHint}
            </div>
          ) : null}
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
            {localVideoSrc ? (
              <>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={images?.[0] || undefined}
                  style={{ width: "100%", maxHeight: 240, display: "block", background: "#000" }}
                >
                  <source src={localVideoSrc} />
                  المتصفح لا يدعم تشغيل الفيديو
                </video>
                <a
                  href={localVideoSrc}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", margin: "8px 10px 10px", fontSize: 12, fontWeight: 700, color: "var(--text-turquoise)" }}
                >
                  فتح الفيديو في تبويب جديد
                </a>
              </>
            ) : (
              <iframe
                title={`video-${point.id}`}
                src={embedVideoUrl}
                width="100%"
                height="220"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
