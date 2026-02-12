import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-minimap";

/**
 * Real Leaflet MiniMap control synced with the main map.
 * Shows Egypt (and the current viewport rectangle) just like mozaMap.
 */
export default function MiniMapControl(){
  const map = useMap();

  useEffect(() => {
    const osm2 = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { minZoom: 0, maxZoom: 13 }
    );

    const miniMap = new L.Control.MiniMap(osm2, {
      toggleDisplay: true,
      minimized: false,
      position: "bottomleft",
      width: 180,
      height: 120,
      zoomLevelOffset: -5,
      aimingRectOptions: { color: "#7c3aed", weight: 2, fillOpacity: 0.05 },
      shadowRectOptions: { color: "#2563eb", weight: 1, fillOpacity: 0.03 },
      strings: { hideText: "إخفاء", showText: "إظهار" }
    });

    map.addControl(miniMap);

    return () => {
      try { map.removeControl(miniMap); } catch {}
    };
  }, [map]);

  return null;
}
