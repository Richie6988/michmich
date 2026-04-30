'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BarryMapProps, MapMarker } from './barry-map';
import type { GeoPoint } from '@barry/shared-types';

// Fix Leaflet default icon paths (broken in webpack/Next.js)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Build a custom Barry pin icon as a divIcon (HTML-based, fully styleable)
function makeBarryIcon(opts: {
  color?: string;
  type?: MapMarker['type'];
  label?: string;
  rank?: number;
  selected?: boolean;
  category?: string;
}): L.DivIcon {
  const color = opts.color || '#2563EB';
  const size = opts.selected ? 48 : 40;
  const animClass = opts.selected ? 'barry-pin-selected' : 'barry-pin-drop';

  let inner = '';
  if (opts.type === 'user') {
    // User location: pulsing blue dot with ripple
    inner = `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; inset: 0; background: #2563EB; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.18), 0 2px 6px rgba(37, 99, 235, 0.4);"></div>
        <div style="position: absolute; inset: -10px; border: 2px solid #2563EB; border-radius: 50%; opacity: 0.4; animation: barryPulse 2s ease-out infinite;"></div>
      </div>`;
  } else if (opts.type === 'origin') {
    // Participant origin: avatar disc with ring
    inner = `
      <div class="${animClass}" style="width: ${size - 6}px; height: ${size - 6}px; background: ${color}; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.18);">
        ${opts.label || ''}
      </div>`;
  } else {
    // Barry-shaped pin with rank badge
    const rankBadge = opts.rank ? `
      <div style="position: absolute; top: -4px; right: -4px; background: ${color}; color: white; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${opts.rank}</div>
    ` : '';

    inner = `
      <div class="${animClass}" style="position: relative;">
        <svg width="${size}" height="${size * 1.25}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
          <defs>
            <linearGradient id="pinG-${opts.rank || 0}-${color.slice(1)}" x1="16" y1="1" x2="16" y2="33" gradientUnits="userSpaceOnUse">
              <stop stop-color="${lighten(color, 15)}"/>
              <stop offset="1" stop-color="${color}"/>
            </linearGradient>
          </defs>
          <path d="M16 1C9.4 1 4 6.4 4 13c0 8.7 12 25 12 25s12-16.3 12-25c0-6.6-5.4-12-12-12z" fill="url(#pinG-${opts.rank || 0}-${color.slice(1)})"/>
          <circle cx="16" cy="13" r="5.5" fill="white"/>
        </svg>
        ${rankBadge}
      </div>`;
  }

  return L.divIcon({
    className: 'barry-marker',
    html: inner,
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size],
  });
}

// Lighten a hex color by N percent
function lighten(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + Math.round(255 * percent / 100));
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function MapController({ center, zoom }: { center: GeoPoint; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true, duration: 0.5 });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function ViewportListener({ onViewportChange }: { onViewportChange: (vp: any) => void }) {
  const map = useMap();
  useEffect(() => {
    const fire = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      onViewportChange({
        center: { lat: c.lat, lng: c.lng },
        zoom: map.getZoom(),
        bounds: {
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        },
      });
    };
    fire(); // initial
    map.on('moveend', fire);
    map.on('zoomend', fire);
    return () => {
      map.off('moveend', fire);
      map.off('zoomend', fire);
    };
  }, [map, onViewportChange]);
  return null;
}

export function LeafletMap({
  center, zoom = 13, markers = [], className = '',
  height = '100%', interactive = true, onMapClick, selectedMarkerId, onViewportChange,
}: BarryMapProps) {
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        {/* Light, clean tile style — Carto Voyager */}
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <MapController center={center} zoom={zoom} />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {onViewportChange && <ViewportListener onViewportChange={onViewportChange} />}

        {markers.map(m => (
          <Marker
            key={m.id}
            position={[m.position.lat, m.position.lng]}
            icon={makeBarryIcon({
              color: m.color,
              type: m.type,
              label: m.label,
              rank: m.rank,
              selected: m.id === selectedMarkerId,
            })}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          />
        ))}
      </MapContainer>

      {/* Custom CSS for pin animations */}
      <style jsx global>{`
        @keyframes barryPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes barryPinDrop {
          0% { transform: translateY(-30px) scale(0.6); opacity: 0; }
          60% { transform: translateY(4px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .barry-pin-drop {
          animation: barryPinDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .barry-pin-selected {
          animation: barryPinDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          transform: scale(1.15);
          transform-origin: bottom center;
        }
        .barry-marker {
          cursor: pointer !important;
          background: transparent !important;
          border: none !important;
        }
        .barry-marker > div {
          pointer-events: auto;
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-marker-icon { cursor: pointer; }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #2563EB !important;
          border: none !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #EFF6FF !important;
        }
      `}</style>
    </div>
  );
}
