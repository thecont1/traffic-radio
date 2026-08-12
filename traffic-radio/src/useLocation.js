import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { CONFIG } from './config';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// -----------------------------------------------------------------------------
// Approximate device location -> neighbourhood-level place name, e.g.
// "Vijaynagar, Bangalore". GPS via navigator.geolocation on web / expo-location
// on native; reverse geocoding is proxied through the backend (/api/location).
// Refreshes every CONFIG.LOCATION_REFRESH_MS (5 minutes); overlapping requests
// are prevented.
// -----------------------------------------------------------------------------
async function getCoords() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
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

export function useLocation() {
  const [place, setPlace] = useState(null);
  const [status, setStatus] = useState('locating'); // locating | ok | unavailable
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const { latitude, longitude } = await getCoords();
      const resp = await fetch(`${API_URL}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!resp.ok) throw new Error(`api ${resp.status}`);
      const data = await resp.json();
      if (data.place_name) {
        setPlace(data.place_name);
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
