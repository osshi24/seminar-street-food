'use client';

import { cn } from '../../../../../lib/cn';

interface CoordinateFormProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

export default function CoordinateForm({ lat, lng, onChange }: CoordinateFormProps) {
  const validateLat = (v: string) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= -90 && n <= 90;
  };
  const validateLng = (v: string) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= -180 && n <= 180;
  };

  const latInvalid = !!lat && !validateLat(lat);
  const lngInvalid = !!lng && !validateLng(lng);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Vĩ độ
        </label>
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => onChange(e.target.value, lng)}
          placeholder="10.762622"
          className={cn(
            'mt-1 w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2',
            latInvalid
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-orange-400 focus:ring-orange-200',
          )}
        />
        {latInvalid && <p className="mt-1 text-[11px] text-rose-600">−90 đến 90</p>}
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Kinh độ
        </label>
        <input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => onChange(lat, e.target.value)}
          placeholder="106.660172"
          className={cn(
            'mt-1 w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2',
            lngInvalid
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-orange-400 focus:ring-orange-200',
          )}
        />
        {lngInvalid && <p className="mt-1 text-[11px] text-rose-600">−180 đến 180</p>}
      </div>
    </div>
  );
}
