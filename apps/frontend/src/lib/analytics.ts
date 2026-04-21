declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

function track(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event, data);
  }
}

export const analytics = {
  mapView:            ()                          => track('map_view'),
  pinSelect:          (storeName: string)         => track('pin_select',          { store: storeName }),
  directionsRequest:  (storeName: string)         => track('directions_request',  { store: storeName }),
  navigationStart:    (storeName: string)         => track('navigation_start',    { store: storeName }),
  navigationStop:     ()                          => track('navigation_stop'),
  navigationArrived:  (storeName: string)         => track('navigation_arrived',  { store: storeName }),
  qrScanSuccess:      (type: string)              => track('qr_scan_success',     { type }),
  qrScanFail:         ()                          => track('qr_scan_fail'),
  storeView:          (storeName: string)         => track('store_view',          { store: storeName }),
  commentaryPlay:     (storeName: string)         => track('commentary_play',     { store: storeName }),
};
