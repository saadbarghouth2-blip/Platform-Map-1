import React, { useEffect, useMemo, useState } from "react";
import { Polyline, CircleMarker, Tooltip, useMapEvents } from "react-leaflet";
import { sfx } from "./sfx.js";

function haversine(a, b){
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const dLat = toRad(b[0]-a[0]);
  const dLng = toRad(b[1]-a[1]);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(x)));
}

function totalDistance(coords){
  let m = 0;
  for(let i=1;i<coords.length;i++){
    m += haversine(coords[i-1], coords[i]);
  }
  return m;
}

function fmt(m){
  if(m < 1000) return `${Math.round(m)} م`;
  return `${(m/1000).toFixed(2)} كم`;
}

export default function MeasureLayer({ enabled=false }){
  const [coords, setCoords] = useState([]);

  useMapEvents({
    click(e){
      if(!enabled) return;
      sfx.click();
      setCoords(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
    dblclick(){
      if(!enabled) return;
      // double click ends measuring (no special handling)
    }
  });

  useEffect(() => {
    if(!enabled) setCoords([]);
  }, [enabled]);

  const dist = useMemo(() => totalDistance(coords), [coords]);

  if(!enabled) return null;

  return (
    <>
      {coords.length >= 2 ? (
        <Polyline positions={coords} pathOptions={{}} />
      ) : null}

      {coords.map((c, idx) => (
        <CircleMarker key={idx} center={c} radius={6} pathOptions={{}}>
          <Tooltip direction="top" offset={[0,-6]} opacity={0.95} permanent={idx===coords.length-1}>
            {idx===coords.length-1 ? `المسافة: ${fmt(dist)}` : `نقطة ${idx+1}`}
          </Tooltip>
        </CircleMarker>
      ))}

      <div className="measureHint">
        <b>وضع القياس</b>
        <div className="small">اضغط على الخريطة لإضافة نقاط قياس. اضغط مزدوج لإنهاء القياس.</div>
      </div>
    </>
  );
}
