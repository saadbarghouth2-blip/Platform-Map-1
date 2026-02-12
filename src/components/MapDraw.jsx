import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

export default function MapDraw(){
  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        draw={{
          rectangle: true,
          polyline: true,
          polygon: true,
          circle: true,
          marker: false
        }}
      />
    </FeatureGroup>
  );
}
