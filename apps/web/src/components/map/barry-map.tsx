'use client';

import dynamic from 'next/dynamic';
import type { GeoPoint } from '@barry/shared-types';

export interface MapMarker {
  id: string;
  position: GeoPoint;
  type?: 'origin' | 'destination' | 'venue' | 'user' | 'pin';
  color?: string;
  label?: string;
  rank?: number;
  onClick?: () => void;
}

export interface MapViewport {
  /** Viewport center after pan/zoom */
  center: GeoPoint;
  /** Current zoom level */
  zoom: number;
  /** Visible bounding box on the map */
  bounds: { north: number; south: number; east: number; west: number };
}

export interface BarryMapProps {
  center: GeoPoint;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  height?: string;
  interactive?: boolean;
  onMapClick?: (point: GeoPoint) => void;
  selectedMarkerId?: string;
  /** Fired on every pan/zoom — used by overlays to compute off-screen markers */
  onViewportChange?: (viewport: MapViewport) => void;
}

// Lazy-load to avoid SSR issues with Leaflet (window not defined)
export const BarryMap = dynamic(() => import('./leaflet-map').then(m => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50 animate-pulse flex items-center justify-center rounded-2xl">
      <div className="text-barry-grey text-sm">Chargement de la carte...</div>
    </div>
  ),
});
