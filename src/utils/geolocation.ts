/**
 * Utility to fetch current GPS coordinates with robust multi-stage fallbacks
 * and reverse geocoding to Bengali address text.
 */

export interface LocationResult {
  success: boolean;
  lat?: number;
  lng?: number;
  address?: string;
  errorMessage?: string;
}

export async function fetchCurrentGpsLocation(): Promise<LocationResult> {
  if (!navigator.geolocation) {
    return {
      success: false,
      errorMessage: 'আপনার ব্রাউজার বা ডিভাইসে জিপিএস সমর্থন করে না। অনুগ্রহ করে ম্যানুয়ালি আপনার সঠিক ঠিকানা লিখুন।',
    };
  }

  const getPosition = (highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 30000,
      });
    });
  };

  let position: GeolocationPosition | null = null;

  try {
    // 1st Attempt: Low accuracy (fast IP/cell/Wi-Fi positioning - works instantly indoors/webviews)
    position = await getPosition(false, 10000);
  } catch (err1) {
    console.warn('Low-accuracy GPS position attempt failed:', err1);
    try {
      // 2nd Attempt: High accuracy (satellite GPS lock, 12s timeout)
      position = await getPosition(true, 12000);
    } catch (err2: any) {
      console.warn('High-accuracy GPS position attempt failed:', err2);
      
      let errMsg = 'জিপিএস লোকেশন পাওয়া যায়নি। ব্রাউজারের Location/GPS Permission অন রয়েছে কিনা চেক করুন।';
      if (err2 && typeof err2 === 'object' && 'code' in err2) {
        if (err2.code === 1) { // PERMISSION_DENIED
          errMsg = 'ব্রাউজারে লোকেশন পারমিশন অফ করা আছে। অনুগ্রহ করে ব্রাউজারের Location/GPS Permission অন করুন অথবা নিচে আপনার ঠিকানা টাইপ করুন।';
        } else if (err2.code === 3) { // TIMEOUT
          errMsg = 'জিপিএস সিগন্যাল পেতে সময় বেশি লাগছে। অনুগ্রহ করে আপনার ঠিকানাটি নিচে লিখে দিন।';
        }
      }
      return { success: false, errorMessage: errMsg };
    }
  }

  if (!position || !position.coords) {
    return {
      success: false,
      errorMessage: 'জিপিএস স্থানাঙ্ক পাওয়া যায়নি। অনুগ্রহ করে ম্যানুয়ালি আপনার ঠিকানাটি টাইপ করুন।',
    };
  }

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  let realAddress = '';

  // 1. Reverse Geocode via BigDataCloud
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=bn`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const place = data.locality || data.city || data.localityInfo?.informative?.[0]?.name;
      const region = data.principalSubdivision || data.countryName;
      if (place) {
        realAddress = `${place}, ${region}`;
      }
    }
  } catch (e) {
    console.warn('BigDataCloud geocode failed:', e);
  }

  // 2. Reverse Geocode via Nominatim OSM
  if (!realAddress) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          realAddress = parts.slice(0, 3).join(',').trim();
        }
      }
    } catch (e) {
      console.warn('Nominatim geocode failed:', e);
    }
  }

  const formattedLocString = realAddress
    ? `${realAddress} (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`
    : `লাইভ জিপিএস লোকেশন (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

  return {
    success: true,
    lat,
    lng,
    address: formattedLocString,
  };
}
