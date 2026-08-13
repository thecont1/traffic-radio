import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { CONFIG } from './config';

// -----------------------------------------------------------------------------
// Approximate device location -> neighbourhood-level place name, e.g.
// "Vijaynagar, Bangalore". GPS via navigator.geolocation on web / expo-location
// on native; reverse geocoding uses expo-location's native reverseGeocodeAsync
// on native and the OpenStreetMap Nominatim API on web (no backend required).
// Refreshes every CONFIG.LOCATION_REFRESH_MS (5 minutes); overlapping requests
// are prevented.
// -----------------------------------------------------------------------------
async function getCoords() {
  if (Platform.OS === 'web') {
    // navigator.geolocation only works in secure contexts (HTTPS or localhost).
    // On a plain-HTTP network URL (e.g. http://192.168.x.x:8081) it is undefined.
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation requires HTTPS or localhost');
    }
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 240000,
      })
    );
    return pos.coords;
  }
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('permission');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return pos.coords;
}

// Build a neighbourhood-level place name from a native reverse-geocode result.
function formatAddress(addr) {
  const hood = addr.district || addr.subregion || addr.name || addr.street;
  const city = addr.city || addr.region || addr.country;
  if (hood && city) return `${hood}, ${city}`;
  if (city) return city;
  return addr.formattedAddress || null;
}

// Web fallback: reverse geocode via OpenStreetMap Nominatim (keyless, public).
async function reverseGeocodeWeb(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16&addressdetails=1&accept-language=en`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'traffic-radio-app/1.0' } });
  if (!resp.ok) throw new Error(`nominatim ${resp.status}`);
  const data = await resp.json();
  const a = data.address || {};
  const hood =
    a.neighbourhood || a.suburb || a.quarter || a.residential || a.city_district || a.borough;
  const city = a.city || a.town || a.municipality || a.village || a.county;
  if (hood && city) return `${hood}, ${city}`;
  if (city) return a.country ? `${city}, ${a.country}` : city;
  return data.display_name || null;
}

export function useLocation() {
  const [place, setPlace] = useState(null);
  const [status, setStatus] = useState('locating'); // locating | ok | unavailable
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const { latitude, longitude } = await getCoords();
      let placeName = null;
      if (Platform.OS === 'web') {
        placeName = await reverseGeocodeWeb(latitude, longitude);
      } else {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) placeName = formatAddress(results[0]);
      }
      if (placeName) {
        setPlace(placeName);
        setStatus('ok');
      } else {
        setStatus('unavailable');
      }
    } catch (e) {
      setStatus((prev) => (prev === 'ok' ? 'ok' : 'unavailable')); // keep last good value
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, CONFIG.LOCATION_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { place, status };
}
