
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-measure";

export default function MeasureTool({ enabled }){
  const map = useMap();

  useEffect(() => {
    if(!enabled) return;

    const measure = new L.Control.Measure({
      primaryLengthUnit: "kilometers",
      secondaryLengthUnit: "meters",
      primaryAreaUnit: "sqmeters",
      position: "topleft",
      activeColor: "#2563eb",
      completedColor: "#16a34a"
    });

    map.addControl(measure);

    return () => {
      map.removeControl(measure);
    };
  }, [enabled]);

  return null;
}
