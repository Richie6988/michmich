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
}): L.DivIcon {
  const color = opts.color || '#2563EB';
  const size = opts.selected ? 44 : 36;
  const scale = opts.selected ? 'transform: scale(1.15);' : '';

  let inner = '';
  if (opts.type === 'user') {
    // User location: pulsing blue dot
    inner = `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="position: absolute; inset: 0; background: #2563EB; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);"></div>
        <div style="position: absolute; inset: -8px; border: 2px solid #2563EB; border-radius: 50%; opacity: 0.4; animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      </div>`;
  } else if (opts.type === 'origin') {
    // Participant origin: small avatar-like dot
    inner = `
      <div style="width: ${size}px; height: ${size}px; background: ${color}; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); ${scale}">
        ${opts.label || ''}
      </div>`;
  } else {
    // Default destination/zone pin
    const rankBadge = opts.rank ? `
      <div style="position: absolute; top: -2px; right: -2px; background: ${color}; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 2px solid white;">${opts.rank}</div>
    ` : '';

    inner = `
      <div style="position: relative; ${scale}">
        <svg width="${size}" height="${size * 1.2}" viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));">
          <defs>
            <linearGradient id="pinG-${color.slice(1)}" x1="16" y1="1" x2="16" y2="31" gradientUnits="userSpaceOnUse">
              <stop stop-color="${color}" stop-opacity="0.85"/>
              <stop offset="1" stop-color="${color}"/>
            </linearGradient>
          </defs>
          <path d="M16 1C10.2 1 5.5 5.7 5.5 11.5c0 7.95 10.5 22.5 10.5 22.5s10.5-14.55 10.5-22.5C26.5 5.7 21.8 1 16 1z" fill="url(#pinG-${color.slice(1)})"/>
          <circle cx="16" cy="11.5" r="4.5" fill="white"/>
        </svg>
        ${rankBadge}
      </div>`;
  }

  return L.divIcon({
    className: 'barry-marker',
    html: inner,
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.15],
    popupAnchor: [0, -size],
  });
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

export function LeafletMap({
  center, zoom = 13, markers = [], className = '',
  height = '100%', interactive = true, onMapClick, selectedMarkerId,
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

      {/* Custom CSS for ping animation */}
      <style jsx global>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-container { font-family: inherit; }
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
