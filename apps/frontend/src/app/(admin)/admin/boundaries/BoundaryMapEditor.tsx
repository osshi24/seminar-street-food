'use client';

import { useEffect, useRef } from 'react';

interface Coord {
  lat: number;
  lng: number;
}

interface BoundaryMapEditorProps {
  coordinates: Coord[];
  onChange: (coords: Coord[]) => void;
  approvedPins?: Coord[];
  height?: number;
}

const DEFAULT_CENTER: Coord = { lat: 10.762622, lng: 106.660172 };

export default function BoundaryMapEditor({
  coordinates,
  onChange,
  approvedPins = [],
  height = 480,
}: BoundaryMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const coordsRef = useRef<Coord[]>(coordinates);
  const onChangeRef = useRef(onChange);
  const isLoadedRef = useRef(false);
  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    coordsRef.current = coordinates;
  }, [coordinates]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  function syncPolygon() {
    const map = mapInstanceRef.current;
    if (!map || !isLoadedRef.current) return;
    const src = map.getSource('boundary');
    if (!src) return;
    const coords = coordsRef.current;
    if (coords.length === 0) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    if (coords.length < 3) {
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords.map((c) => [c.lng, c.lat]),
        },
      });
    } else {
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [...coords.map((c) => [c.lng, c.lat]), [coords[0].lng, coords[0].lat]],
          ],
        },
      });
    }
  }

  function syncPins(pins: Coord[]) {
    const map = mapInstanceRef.current;
    if (!map || !isLoadedRef.current) return;
    const src = map.getSource('approved-pins');
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: pins.map((p) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      })),
    });
  }

  function syncMarkers() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    coordsRef.current.forEach((coord, index) => {
      const el = document.createElement('div');
      el.className = 'boundary-marker';
      el.style.cssText = `
        width: 22px; height: 22px;
        background: #0891b2;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: white; font: 600 10px/1 system-ui;
      `;
      el.textContent = String(index + 1);
      el.title = `Điểm ${index + 1} — click để xóa, kéo để di chuyển`;
      el.addEventListener('mousedown', (ev) => ev.stopPropagation());
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const next = coordsRef.current.filter((_, i) => i !== index);
        onChangeRef.current(next);
      });

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([coord.lng, coord.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        const next = coordsRef.current.map((c, i) =>
          i === index ? { lat, lng } : c,
        );
        onChangeRef.current(next);
      });

      markersRef.current.push(marker);
    });
  }

  function fitBoundsOnce() {
    if (initialFitDoneRef.current) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords = coordsRef.current;
    if (coords.length < 2) {
      initialFitDoneRef.current = true;
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((c) => bounds.extend([c.lng, c.lat]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 0 });
    initialFitDoneRef.current = true;
  }

  // Init map once
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');

    const initialCenter =
      coordsRef.current.length > 0 ? coordsRef.current[0] : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 15,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('click', (e: { lngLat: { lng: number; lat: number } }) => {
      const next = [
        ...coordsRef.current,
        { lat: e.lngLat.lat, lng: e.lngLat.lng },
      ];
      onChangeRef.current(next);
    });

    map.getCanvas().style.cursor = 'crosshair';

    map.once('load', () => {
      map.addSource('boundary', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'boundary-fill',
        type: 'fill',
        source: 'boundary',
        paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.18 },
        filter: ['==', '$type', 'Polygon'],
      });
      map.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#0891b2', 'line-width': 2.5 },
      });

      map.addSource('approved-pins', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer(
        {
          id: 'approved-pins-circle',
          type: 'circle',
          source: 'approved-pins',
          paint: {
            'circle-radius': 4,
            'circle-color': '#475569',
            'circle-opacity': 0.7,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
          },
        },
        'boundary-fill',
      );

      isLoadedRef.current = true;
      syncPolygon();
      syncPins(approvedPins);
      syncMarkers();
      fitBoundsOnce();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
      isLoadedRef.current = false;
      initialFitDoneRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    syncPolygon();
    syncMarkers();
  }, [coordinates]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    syncPins(approvedPins);
  }, [approvedPins]);

  return (
    <div
      ref={mapRef}
      style={{ height: `${height}px`, width: '100%', borderRadius: '8px', zIndex: 0 }}
    />
  );
}
