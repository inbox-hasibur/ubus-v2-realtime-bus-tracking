export interface StopCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export const KNOWN_STOPS: Record<string, [number, number]> = {
  "IUBAT Campus": [23.8759, 90.3795],
  "IUBAT Main Gate": [23.8759, 90.3795],
  "Kamarpara": [23.8860, 90.3850],
  "Abdullahpur": [23.8920, 90.4020],
  "House Building": [23.8820, 90.4005],
  "Rajlakshmi": [23.8680, 90.4010],
  "Jasimuddin": [23.8600, 90.4030],
  "Airport": [23.8510, 90.4070],
  "Khilkhet": [23.8320, 90.4180],
  "Kuril": [23.8180, 90.4220],
  "Kakoli/Banani": [23.7937, 90.4066],
  "Banani": [23.7937, 90.4066],
  "Mohakhali": [23.7780, 90.4010],
  "Farmgate": [23.7570, 90.3890],
  "Science Lab": [23.7380, 90.3830],
  "New Market": [23.7330, 90.3850],
  "Azimpur": [23.7280, 90.3860],
  "City College": [23.7400, 90.3840],
  "Zigatala": [23.7410, 90.3750],
  "Dhanmondi 15": [23.7450, 90.3730],
  "Shankar Bus Stand": [23.7500, 90.3700],
  "Mirpur 10": [23.8070, 90.3685],
  "Mirpur 1": [23.7950, 90.3530],
  "Kalshi": [23.8230, 90.3780],
  "Gazipur Chowrasta": [23.9980, 90.4250],
  "Chandura": [23.9780, 90.2850],
  "EPZ": [23.9450, 90.2700],
  "MES": [23.8120, 90.4110],
};

export function getStopCoordinate(name: string): [number, number] {
  const clean = name.trim().toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_STOPS)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return coords;
    }
  }
  // Default to proximity of IUBAT with small jitter for unknown stops
  return [23.8759 + (Math.random() - 0.5) * 0.02, 90.3795 + (Math.random() - 0.5) * 0.02];
}

/**
 * Calculates distance between two GPS coordinates in Kilometers (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates Estimated Time of Arrival based on distance and speed
 */
export function calculateETA(
  distanceKm: number,
  speedKmH: number = 30
): { minutes: number; formatted: string } {
  const effectiveSpeed = Math.max(15, Math.min(50, speedKmH || 28));
  const totalMinutes = Math.max(1, Math.round((distanceKm / effectiveSpeed) * 60));

  if (totalMinutes < 60) {
    return {
      minutes: totalMinutes,
      formatted: `${totalMinutes.toString().padStart(2, "0")}:00 M`,
    };
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return {
    minutes: totalMinutes,
    formatted: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} H`,
  };
}
