import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip, useMap, LayersControl, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapDraw from "./MapDraw.jsx";
import MeasureLayer from "./MeasureLayer.jsx";
import RealMiniMap from "./RealMiniMap.jsx";
import { EsriFeatureLayer, EsriMapLayer, WmsLayer } from "./GisLayers.jsx";
import MapFilterPanel from "./MapFilterPanel.jsx";
import { typeMeta } from "../data/legend.js";

const { BaseLayer } = LayersControl;

const DEFAULT_CENTER = [26.8, 30.8];
const DEFAULT_ZOOM = 6;
const FALLBACK_COLOR = "var(--primary)";
const FALLBACK_EMOJI = "?";
const OPENVERSE_IMAGE_CACHE = new Map();

const GIS_URLS = {
  resources: "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/Eygpt_Resource_Map_WFL1/FeatureServer/0",
  egypt_user: "https://egcapitalgis.idsc.gov.eg/server/rest/services/Hosted/egypt_user/FeatureServer/0",
  water_bodies: "https://gis.wfp.org/arcgis/rest/services/Hosted/Egypt_Water_Bodies/FeatureServer/0",
  hydro: "https://pro-ags2.dfs.un.org/arcgis/rest/services/hosted/Hydro_Egypt/FeatureServer/0",
  nature: "https://services5.arcgis.com/SaBe5HMtmnbqSWlu/ArcGIS/rest/services/Egypt_Scrub_and_Forest/FeatureServer/0",
  farming: "https://africasis.isric.org/ows/farming-systems",
  fao_base: "http://data.fao.org/maps/ows",
  cairo_full: "https://geoportal.cairodc.gov.eg/server/rest/services/Ù…Ø­Ø§ÙØ¸Ø©_Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©_Ø¨Ø§Ù„Ø­Ø¯ÙˆØ¯/MapServer",
  gamaleya: "https://geoportal.cairodc.gov.eg/server/rest/services/Ø®Ø¯Ù…Ø§Øª_Ø§Ù„Ø¬Ù…Ø§Ù„ÙŠØ©/MapServer",
  maadi: "https://geoportal.cairodc.gov.eg/server/rest/services/Ø®Ø¯Ù…Ø§Øª_Ø­Ù‰_Ø§Ù„Ù…Ø¹Ø§Ø¯Ù‰/MapServer",
  provinces: "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/Egypt_Province_Boundaries_2023/FeatureServer/0"
};

function buildIcon(point, active) {
  const meta = typeMeta?.[point.type] || {};
  const color = meta.color || FALLBACK_COLOR;
  const emoji = point.emoji || meta.emoji || FALLBACK_EMOJI;
  const size = active ? 52 : 44;
  const ring = active ? `0 0 0 6px ${color}33` : "0 8px 16px rgba(0,0,0,0.15)";
  const pinClass = active ? "map-pin active-premium" : "map-pin";

  const html = `
    <div class="${pinClass}" style="width:${size}px;height:${size}px;background:${color};box-shadow:${ring};border:3px solid var(--surface);">
      <span class="map-pin-emoji">${emoji}</span>
      <div class="pin-anchor"></div>
    </div>
  `;
  return L.divIcon({
    className: "map-pin-wrapper-premium",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function MapReady({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady?.(map);
  }, [map, onReady]);
  return null;
}

function MapFocus({ point, zoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), zoom), {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [point?.id, zoom]);
  return null;
}

function toExternalVideoUrl(videoUrl = "") {
  if (!videoUrl) return "";
  try {
    const parsed = new URL(videoUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    const isYouTube = host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
    if (!isYouTube) return videoUrl;

    const listType = parsed.searchParams.get("listType");
    const list = parsed.searchParams.get("list");
    if (listType === "search" && list) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(list)}`;
    }
  } catch {
    return videoUrl;
  }
  return videoUrl;
}

function MapPopupMedia({ point }) {
  const hasLocalVideo = Boolean(point?.videoSrc);
  const hasEmbedVideo = Boolean(point?.videoUrl);
  const hasVideo = hasLocalVideo || hasEmbedVideo;
  const isYouTubeSearchEmbed = /youtube\.com\/embed\?listType=search/i.test(String(point?.videoUrl || ""));
  const externalVideoUrl = hasEmbedVideo ? toExternalVideoUrl(point.videoUrl) : "";

  const [useEmbed, setUseEmbed] = useState(Boolean(point?.preferVideoUrl) && !hasLocalVideo);
  const [remoteImages, setRemoteImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadingRemoteImages, setLoadingRemoteImages] = useState(false);

  useEffect(() => {
    setUseEmbed(Boolean(point?.preferVideoUrl) && !Boolean(point?.videoSrc));
  }, [point?.id, point?.videoSrc, point?.videoUrl, point?.preferVideoUrl]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [point?.id]);

  useEffect(() => {
    const baseQuery = String(point?.mediaQuery || point?.ovQuery || point?.name || "")
      .replace(/\s+/g, " ")
      .trim();

    setLoadingRemoteImages(false);
    if (!baseQuery) {
      setRemoteImages([]);
      return undefined;
    }

    const cacheKey = baseQuery.toLowerCase();
    const cached = OPENVERSE_IMAGE_CACHE.get(cacheKey);
    if (Array.isArray(cached) && cached.length) {
      setRemoteImages(cached);
      return undefined;
    }

    setRemoteImages([]);
    const controller = new AbortController();
    let disposed = false;
    setLoadingRemoteImages(true);

    const requestUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(`${baseQuery} Egypt`)}&page_size=6`;
    fetch(requestUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (disposed || !payload) return;
        const parsed = (Array.isArray(payload?.results) ? payload.results : [])
          .map((item) => ({
            src: item?.thumbnail || item?.url || "",
            source: item?.foreign_landing_url || item?.url || "",
          }))
          .filter((item) => Boolean(item.src));

        const unique = [];
        const seen = new Set();
        for (const item of parsed) {
          if (seen.has(item.src)) continue;
          seen.add(item.src);
          unique.push(item);
          if (unique.length >= 4) break;
        }

        if (unique.length) {
          OPENVERSE_IMAGE_CACHE.set(cacheKey, unique);
          setRemoteImages(unique);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!disposed) setLoadingRemoteImages(false);
      });

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [point?.id, point?.mediaQuery, point?.ovQuery, point?.name]);

  const localImages = (Array.isArray(point?.images) ? point.images.filter(Boolean) : (point?.image ? [point.image] : []))
    .map((src) => ({ src, source: "" }));
  const images = remoteImages.length ? remoteImages : localImages;
  const boundedIndex = images.length ? Math.min(activeImageIndex, images.length - 1) : 0;
  const mainImageObj = images[boundedIndex] || null;
  const mainImage = mainImageObj?.src || "";

  return (
    <>
      {mainImage ? (
        <div className="popup-image-box">
          <img className="popup-main-image" src={mainImage} alt={point?.name || "landmark"} loading="lazy" />
          {images.length ? (
            <div className="popup-thumb-row">
              {images.map((img, idx) => (
                <button
                  key={`${point?.id}-thumb-${idx}`}
                  type="button"
                  className={`popup-thumb-btn ${idx === boundedIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`عرض الصورة ${idx + 1}`}
                >
                  <img className="popup-thumb" src={img.src} alt={`${point?.name || "landmark"} ${idx + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
          {mainImageObj?.source ? (
            <a href={mainImageObj.source} target="_blank" rel="noreferrer" className="popup-image-source">
              مصدر الصورة
            </a>
          ) : null}
          {loadingRemoteImages && !remoteImages.length ? (
            <div className="popup-image-loading">جاري تحميل صور أوضح لهذا المعلم...</div>
          ) : null}
        </div>
      ) : null}

      {hasVideo ? (
        <div className="popup-video-box">
          <div className="popup-video-title">🎬 {point?.videoTitle || "فيديو شرح مبسط"}</div>
          {(point?.videoUrl && point?.videoSrc) ? (
            <div className="popup-video-switcher">
              <button
                type="button"
                className={`popup-video-tab ${!useEmbed ? "active" : ""}`}
                onClick={() => setUseEmbed(false)}
              >
                فيديو الدرس
              </button>
              <button
                type="button"
                className={`popup-video-tab ${useEmbed ? "active" : ""}`}
                onClick={() => setUseEmbed(true)}
              >
                شرح إضافي
              </button>
            </div>
          ) : null}

          {!useEmbed && point?.videoSrc ? (
            <>
              <video
                className="popup-video-player"
                controls
                playsInline
                preload="metadata"
                poster={mainImage || undefined}
                onError={() => setUseEmbed(true)}
              >
                <source src={point.videoSrc} />
                المتصفح لا يدعم تشغيل الفيديو
              </video>
              <a href={point.videoSrc} target="_blank" rel="noreferrer" className="popup-video-link">
                فتح الفيديو في تبويب جديد
              </a>
              {point?.videoUrl ? (
                <a href={externalVideoUrl || point.videoUrl} target="_blank" rel="noreferrer" className="popup-video-link">
                  فتح شرح إضافي على يوتيوب
                </a>
              ) : null}
            </>
          ) : point?.videoUrl ? (
            isYouTubeSearchEmbed ? (
              <div className="popup-video-search">
                <div className="popup-video-note">
                  هذا الشرح يُفتح من يوتيوب مباشرة، واضغط الزر التالي للمشاهدة.
                </div>
                <a href={externalVideoUrl || point.videoUrl} target="_blank" rel="noreferrer" className="popup-video-link">
                  فتح الشرح على يوتيوب
                </a>
                {point?.videoSrc ? (
                  <a href={point.videoSrc} target="_blank" rel="noreferrer" className="popup-video-link">
                    فتح فيديو الدرس المحلي
                  </a>
                ) : null}
              </div>
            ) : (
              <>
                <iframe
                  className="popup-video-iframe"
                  title={`map-video-${point?.id}`}
                  src={point.videoUrl}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <a href={externalVideoUrl || point.videoUrl} target="_blank" rel="noreferrer" className="popup-video-link">
                  فتح الفيديو في تبويب جديد
                </a>
                {point?.videoSrc ? (
                  <a href={point.videoSrc} target="_blank" rel="noreferrer" className="popup-video-link">
                    فتح الفيديو المحلي
                  </a>
                ) : null}
              </>
            )
          ) : (
            <div className="popup-video-empty">لا يوجد فيديو متاح لهذا المعلم حالياً.</div>
          )}
          <div className="popup-kid-tip">{point?.kidHint || "👆 اضغط تشغيل الفيديو وشاهد الشرح خطوة بخطوة."}</div>
        </div>
      ) : null}
    </>
  );
}

export default function InteractiveMap({
  points = [],
  activeTypes = {},
  onMarkerClicked,
  highlightPointId,
  height = 600,
  enableDrawing = false,
  enableMeasure = false,
  onMapReady,
  autoFocusHighlight = true,
  openPopupPointId,
}) {
  const mapRef = useRef(null);
  const markerRefs = useRef(new Map());
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const [gisOverlays, setGisOverlays] = useState({
    resources: false,
    egypt_user: false,
    water_bodies: false,
    hydro: false,
    nature: false,
    farming: false,
    fao_base: false,
    cairo_full: false,
    gamaleya: false,
    maadi: false,
    provinces: true
  });

  const toggleGisLayer = (layerId) => {
    setGisOverlays(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const filteredPoints = useMemo(() => {
    if (!Array.isArray(points)) return [];
    return points.filter((p) => {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") return false;
      if (!activeTypes || Object.keys(activeTypes).length === 0) return true;
      if (activeTypes[p.type] === undefined) return true;
      return Boolean(activeTypes[p.type]);
    });
  }, [points, activeTypes]);

  const highlightPoint = useMemo(
    () => points.find((p) => p.id === highlightPointId) || null,
    [points, highlightPointId]
  );

  useEffect(() => {
    if (!openPopupPointId) return;
    const marker = markerRefs.current.get(openPopupPointId);
    if (marker?.openPopup) {
      setTimeout(() => marker.openPopup(), 500);
    }
  }, [openPopupPointId, filteredPoints.length]);

  function handleReady(map) {
    mapRef.current = map;
    onMapReady?.(map);
  }

  return (
    <div className="interactive-map professional-view" style={{ height, width: "100%", position: "relative" }}>
      <MapFilterPanel activeLayers={gisOverlays} onToggleLayer={toggleGisLayer} />

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        style={{ height: "100%", width: "100%", borderRadius: "28px" }}
      >
        <LayersControl position="bottomright">
          <BaseLayer checked name="Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© (Ù„ÙŠÙ„Ø§Ù‹)">
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>
          <BaseLayer name="Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªØ¶Ø§Ø±ÙŠØ³ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØ©">
            <TileLayer
              attribution='&copy; OpenTopoMap'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="Ø±Ø¤ÙŠØ© Ø§Ù„Ø£Ù‚Ù…Ø§Ø± Ø§Ù„ØµÙ†Ø§Ø¹ÙŠØ© ðŸ›°ï¸">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
        </LayersControl>

        {/* --- GIS Data Overlays (ArcGIS FeatureLayers) --- */}
        <EsriFeatureLayer url={GIS_URLS.provinces} enabled={gisOverlays.provinces} options={{ style: { color: 'var(--ink-light)', weight: 1.5, fillOpacity: 0, dashArray: '6, 6' } }} />
        <EsriFeatureLayer url={GIS_URLS.resources} enabled={gisOverlays.resources} options={{ style: (f) => ({ color: '#f59e0b', weight: 2.5, fillOpacity: 0.5 }) }} />
        <EsriFeatureLayer url={GIS_URLS.egypt_user} enabled={gisOverlays.egypt_user} options={{ style: { color: '#8b5cf6', weight: 2 } }} />
        <EsriFeatureLayer url={GIS_URLS.water_bodies} enabled={gisOverlays.water_bodies} options={{ style: { color: '#2563eb', weight: 1.5, fillOpacity: 0.4 } }} />
        <EsriFeatureLayer url={GIS_URLS.hydro} enabled={gisOverlays.hydro} options={{ style: { color: '#3b82f6', weight: 3 } }} />
        <EsriFeatureLayer url={GIS_URLS.nature} enabled={gisOverlays.nature} options={{ style: { color: 'var(--accent)', weight: 1.5, fillOpacity: 0.4 } }} />

        {/* --- GIS Data Overlays (ArcGIS Dynamic Layers for Cairo) --- */}
        <EsriMapLayer url={GIS_URLS.cairo_full} type="dynamic" enabled={gisOverlays.cairo_full} />
        <EsriMapLayer url={GIS_URLS.gamaleya} type="dynamic" enabled={gisOverlays.gamaleya} />
        <EsriMapLayer url={GIS_URLS.maadi} type="dynamic" enabled={gisOverlays.maadi} />

        {/* --- WMS Layers (Agriculture & FAO) --- */}
        <WmsLayer url={GIS_URLS.farming} enabled={gisOverlays.farming} options={{ layers: 'farming_systems', opacity: 0.6 }} />
        <WmsLayer url={GIS_URLS.fao_base} enabled={gisOverlays.fao_base} options={{ layers: 'fao:base_wms', opacity: 0.5 }} />

        <ZoomControl position="bottomleft" />
        <MapReady onReady={handleReady} />
        {autoFocusHighlight ? <MapFocus point={highlightPoint} zoom={13} /> : null}
        <RealMiniMap />
        {enableDrawing ? <MapDraw /> : null}
        <MeasureLayer enabled={enableMeasure} />

        {/* --- Interactive Markers --- */}
        {filteredPoints.map((p) => {
          const active = p.id === highlightPointId || p.id === selectedId || p.id === hoveredId;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={buildIcon(p, active)}
              ref={(marker) => {
                if (!marker) {
                  markerRefs.current.delete(p.id);
                  return;
                }
                const instance = marker?.leafletElement ?? marker;
                markerRefs.current.set(p.id, instance);
              }}
              eventHandlers={{
                click: () => {
                  setSelectedId(p.id);
                  if (mapRef.current) {
                    mapRef.current.flyTo([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 14), {
                      duration: 1.4,
                      easeLinearity: 0.2
                    });
                  }
                  onMarkerClicked?.(p);
                },
                mouseover: () => setHoveredId(p.id),
                mouseout: () => setHoveredId(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -45]} opacity={0.9} permanent={false}>
                <div style={{ fontWeight: 800, padding: "2px 4px" }}>{p.name}</div>
              </Tooltip>

              <Popup className="premium-map-popup">
                <div className="popup-card">
                  <div className="popup-header" style={{ borderBottom: `4px solid ${typeMeta?.[p.type]?.color || FALLBACK_COLOR}` }}>
                    <span className="popup-emoji">{p.emoji || typeMeta?.[p.type]?.emoji || "ðŸ›ï¸"}</span>
                    <div className="popup-title-group">
                      <h4 className="popup-name">{p.name}</h4>
                      <span className="popup-type">{typeMeta?.[p.type]?.label || p.type}</span>
                    </div>
                  </div>
                  <div className="popup-body">
                    <p className="popup-desc">{p.story || p.info}</p>
                    {p.funFact && (
                      <div className="popup-fun-fact">
                        <strong>âœ¨ Ù…Ø¹Ù„ÙˆÙ…Ø© Ø°ÙƒÙŠØ©:</strong> {p.funFact}
                      </div>
                    )}
                    {Array.isArray(p.quickFacts) && (
                      <div className="popup-quick-stats">
                        {p.quickFacts.slice(0, 3).map((f, idx) => (
                          <div key={idx} className="stat-pill">{f}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <MapPopupMedia point={p} />
                  <button className="popup-action-btn" onClick={() => onMarkerClicked?.(p)}>
                    اختر هذا المعلم 🧭
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* --- HUD --- */}
      <div className="map-hud-premium">
        <div className="hud-part">
          <div className="hud-icon">ðŸ§­</div>
          <div className="hud-text">
            <span>Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹ Ø§Ù„Ù†Ø´Ø·Ø©</span>
            <strong>{filteredPoints.length}</strong>
          </div>
        </div>
        <div className="hud-line" />
        <div className="hud-part">
          <div className="hud-icon">ðŸ“¡</div>
          <div className="hud-text">
            <span>Ø§Ù„Ø·Ø¨Ù‚Ø§Øª Ø§Ù„Ù…ÙØ¹Ù„Ø©</span>
            <strong>{Object.values(gisOverlays).filter(v => v).length}</strong>
          </div>
        </div>
      </div>

      <div className="kids-map-guide">
        👶 اضغط أي معلم على الخريطة ثم شغّل فيديو الشرح 🎬
      </div>

      <style>{`
        .interactive-map { border-radius: 32px; background: var(--surface-off); }
        .professional-view {
          box-shadow: 0 40px 100px -20px rgba(15, 23, 42, 0.25);
          position: relative;
        }

        /* HUD Premium Styles */
        .map-hud-premium {
          position: absolute;
          bottom: 24px;
          right: 30px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          padding: 10px 24px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
          z-index: 1000;
          direction: rtl;
        }
        .hud-part { display: flex; align-items: center; gap: 12px; }
        .hud-icon { font-size: 1.4rem; }
        .hud-text { display: flex; flex-direction: column; }
        .hud-text span { font-size: 0.65rem; color: var(--ink-light); font-weight: 700; opacity: 0.95; }
        .hud-text strong { font-size: 1rem; color: var(--ink); font-weight: 900; }
        .hud-line { width: 1px; height: 32px; background: rgba(0,0,0,0.08); }

        /* Premium Pin Styles */
        .map-pin {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 1px;
          transform: rotate(-45deg);
          box-sizing: border-box;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .map-pin-emoji { transform: rotate(45deg); font-size: 1.4rem; z-index: 5; }
        .active-premium { transform: rotate(-45deg) scale(1.1); filter: brightness(1.1); }
        
        /* Popup Styling */
        .interactive-map .leaflet-popup-pane { z-index: 1200; }
        .premium-map-popup .leaflet-popup-content-wrapper {
            padding: 0;
            overflow: hidden;
            border-radius: 24px !important;
            background: var(--surface);
            border: 1px solid var(--border);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2) !important;
        }
        .premium-map-popup .leaflet-popup-content { margin: 0; width: min(340px, calc(100vw - 72px)) !important; }
        .popup-card { direction: rtl; font-family: 'Tajawal', sans-serif; max-height: min(72vh, 620px); overflow-y: auto; overflow-x: hidden; }
        .popup-card::-webkit-scrollbar { width: 8px; }
        .popup-card::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
        .popup-header { padding: 14px 16px; background: var(--surface-off); display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 2; }
        .popup-emoji { font-size: 2.2rem; }
        .popup-title-group { display: flex; flex-direction: column; }
        .popup-name { margin: 0; font-size: 1.05rem; font-weight: 900; color: var(--ink); line-height: 1.35; }
        .popup-type { font-size: 0.75rem; font-weight: 700; color: var(--text-turquoise); }
        .popup-body { padding: 12px 16px; line-height: 1.6; }
        .popup-desc { margin: 0; font-size: 0.86rem; color: var(--ink-light); }
        .popup-image-box { padding: 0 16px 10px; }
        .popup-main-image { width: 100%; height: 158px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); display: block; background: var(--surface-off); }
        .popup-thumb-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 6px; }
        .popup-thumb-btn { border: none; background: transparent; padding: 0; cursor: pointer; border-radius: 8px; }
        .popup-thumb { width: 100%; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-off); display: block; }
        .popup-thumb-btn.active .popup-thumb { border-color: var(--text-turquoise); box-shadow: 0 0 0 2px rgba(0, 197, 190, 0.35); }
        .popup-image-source { display: inline-block; margin-top: 8px; font-size: 0.7rem; font-weight: 800; color: var(--ink-light); text-decoration: none; }
        .popup-image-loading { margin-top: 6px; font-size: 0.68rem; font-weight: 700; color: var(--ink-light); }
        .popup-fun-fact { margin-top: 15px; padding: 12px; background: var(--glass-bg); border-radius: 12px; border-right: 4px solid var(--secondary); font-size: 0.8rem; color: var(--ink); }
        .popup-quick-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .stat-pill { padding: 4px 10px; background: var(--surface-off); border-radius: 8px; font-size: 0.7rem; font-weight: 700; color: var(--ink-lighter); }
        .popup-video-box { margin: 10px 16px 0; padding: 10px; border-radius: 14px; background: var(--surface-off); border: 1px solid var(--border); }
        .popup-video-title { font-size: 0.78rem; font-weight: 800; color: var(--ink); margin-bottom: 8px; }
        .popup-video-switcher { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
        .popup-video-tab { border: 1px solid var(--border); border-radius: 999px; padding: 6px 8px; font-size: 0.68rem; font-weight: 800; color: var(--ink); background: var(--surface); cursor: pointer; }
        .popup-video-tab.active { background: var(--primary-light); color: var(--text-on-primary); border-color: var(--primary-light); }
        .popup-video-player,
        .popup-video-iframe { width: 100%; border: none; border-radius: 10px; display: block; background: #000; }
        .popup-video-player { max-height: 180px; }
        .popup-video-iframe { height: 180px; }
        .popup-video-empty { font-size: 0.78rem; color: var(--ink-light); padding: 8px; text-align: center; }
        .popup-video-search { border: 1px dashed var(--border-strong); border-radius: 10px; padding: 10px; background: var(--surface); }
        .popup-video-note { font-size: 0.74rem; color: var(--ink-light); line-height: 1.6; margin-bottom: 8px; }
        .popup-video-link { display: block; margin-top: 8px; font-size: 0.72rem; font-weight: 800; color: var(--text-turquoise); text-decoration: none; }
        .popup-kid-tip { margin-top: 8px; font-size: 0.72rem; color: var(--ink-light); font-weight: 700; }
        .popup-action-btn { 
            width: 100%; 
            padding: 12px 14px; 
            border: none; 
            background: var(--ink); 
            color: var(--text-on-primary); 
            font-weight: 800; 
            cursor: pointer; 
            transition: background 0.2s;
        }
        .popup-action-btn:hover { background: var(--primary-dark); }
        .leaflet-popup-tip-container { display: none; }
        .kids-map-guide {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 1000;
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--ink);
          box-shadow: var(--shadow-sm);
          max-width: min(320px, calc(100% - 36px));
        }
        @media (max-width: 900px) {
          .kids-map-guide {
            top: 12px;
            left: 12px;
            font-size: 0.72rem;
            padding: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
}

