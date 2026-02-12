import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import * as Esri from "esri-leaflet";

/**
 * Custom component to render an Esri Feature Layer.
 * Since react-leaflet-esri might have compatibility issues, 
 * we use the native Leaflet map instance.
 */
export function EsriFeatureLayer({ url, options = {}, enabled = false }) {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (enabled && !layerRef.current) {
            layerRef.current = Esri.featureLayer({
                url,
                ...options,
                // Default style for better visibility
                style: (feature) => ({
                    color: "#0ea5a3",
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.2
                })
            }).addTo(map);

            // Add basic popup if not provided
            if (!options.onEachFeature) {
                layerRef.current.bindPopup((layer) => {
                    const props = layer.feature.properties;
                    return `<div style="direction:rtl; font-family:sans-serif;">
            <strong style="color:#0ea5a3;">معلومات الطبقة:</strong><br/>
            ${Object.entries(props).slice(0, 5).map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`).join("")}
          </div>`;
                });
            }
        }

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, url, enabled, JSON.stringify(options)]);

    return null;
}

/**
 * Custom component to render an Esri Map Layer (Dynamic/Tiled).
 */
export function EsriMapLayer({ url, type = "featureLayer", options = {}, enabled = false }) {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (enabled && !layerRef.current) {
            if (type === "dynamic") {
                layerRef.current = Esri.dynamicMapLayer({ url, ...options }).addTo(map);
            } else if (type === "tiled") {
                layerRef.current = Esri.tiledMapLayer({ url, ...options }).addTo(map);
            } else {
                layerRef.current = Esri.featureLayer({ url, ...options }).addTo(map);
            }
        }

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, url, type, enabled, JSON.stringify(options)]);

    return null;
}

/**
 * Custom component to render a WMS Layer.
 */
export function WmsLayer({ url, options = {}, enabled = false }) {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (enabled && !layerRef.current) {
            layerRef.current = L.tileLayer.wms(url, {
                format: 'image/png',
                transparent: true,
                ...options
            }).addTo(map);
        }

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, url, enabled, JSON.stringify(options)]);

    return null;
}
