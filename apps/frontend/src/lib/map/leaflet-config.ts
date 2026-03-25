// Leaflet icon path fix for Next.js bundling
// Must be called once before rendering any Leaflet map
export function initLeafletIcons(): void {
  if (typeof window === 'undefined') return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as typeof import('leaflet');

  // Fix the default icon URL resolution broken by webpack/Next.js bundling
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}
