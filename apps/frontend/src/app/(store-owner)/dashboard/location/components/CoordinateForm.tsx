'use client';

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

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ (Latitude)</label>
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => onChange(e.target.value, lng)}
          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            lat && !validateLat(lat)
              ? 'border-red-400 focus:ring-red-300'
              : 'border-gray-300 focus:ring-orange-300'
          }`}
          placeholder="10.762622"
        />
        {lat && !validateLat(lat) && (
          <p className="text-xs text-red-500 mt-1">Vĩ độ phải từ -90 đến 90</p>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Longitude)</label>
        <input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => onChange(lat, e.target.value)}
          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            lng && !validateLng(lng)
              ? 'border-red-400 focus:ring-red-300'
              : 'border-gray-300 focus:ring-orange-300'
          }`}
          placeholder="106.660172"
        />
        {lng && !validateLng(lng) && (
          <p className="text-xs text-red-500 mt-1">Kinh độ phải từ -180 đến 180</p>
        )}
      </div>
    </div>
  );
}
