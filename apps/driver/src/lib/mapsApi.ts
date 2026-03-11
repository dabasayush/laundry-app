// ── Google Maps API helpers ───────────────────────────────────────────────────
// Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env / EAS secrets.

import { Address } from "../types";

const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function apiKey(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

// ── Polyline decoder (standard Google encoding algorithm) ─────────────────────
export function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

// ── Geocoding ─────────────────────────────────────────────────────────────────
export async function geocodeAddress(
  address: Address,
): Promise<{ lat: number; lng: number } | null> {
  const key = apiKey();
  if (!key) return null;

  const query = [address.line1, address.line2, address.city, address.pincode]
    .filter(Boolean)
    .join(", ");

  try {
    const res = await fetch(
      `${GEOCODE_URL}?address=${encodeURIComponent(query)}&key=${key}`,
    );
    const json = (await res.json()) as {
      status: string;
      results: { geometry: { location: { lat: number; lng: number } } }[];
    };
    if (json.status !== "OK" || !json.results[0]) return null;
    return json.results[0].geometry.location;
  } catch {
    return null;
  }
}

// ── Directions ────────────────────────────────────────────────────────────────
export interface DirectionsResult {
  points: { latitude: number; longitude: number }[];
  duration: string;
  distance: string;
}

export async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<DirectionsResult | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch(
      `${DIRECTIONS_URL}?` +
        `origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&mode=driving` +
        `&key=${key}`,
    );
    const json = (await res.json()) as {
      status: string;
      routes: {
        overview_polyline: { points: string };
        legs: { duration: { text: string }; distance: { text: string } }[];
      }[];
    };

    if (json.status !== "OK" || !json.routes[0]) return null;

    const route = json.routes[0];
    return {
      points: decodePolyline(route.overview_polyline.points),
      duration: route.legs[0]?.duration?.text ?? "",
      distance: route.legs[0]?.distance?.text ?? "",
    };
  } catch {
    return null;
  }
}
