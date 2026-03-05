import ipRangeCheck from "ip-range-check";

interface OfficeLocationForVerify {
  allowedIPs: string[];
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

type LocationResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function verifyLocation(
  clientIp: string,
  coords: { latitude: number; longitude: number } | undefined,
  office: OfficeLocationForVerify
): LocationResult {
  // GPS check (primary if coords provided and office has GPS config)
  if (
    coords &&
    office.latitude != null &&
    office.longitude != null &&
    office.radiusMeters != null
  ) {
    const dist = haversineDistance(
      coords.latitude,
      coords.longitude,
      office.latitude,
      office.longitude
    );
    if (dist > office.radiusMeters) {
      return { allowed: false, reason: "Lokasi Anda di luar radius yang diizinkan" };
    }
    return { allowed: true };
  }

  // Fall back to IP check only
  const ipAllowed =
    office.allowedIPs.length === 0 ||
    ipRangeCheck(clientIp, office.allowedIPs);

  if (!ipAllowed) {
    return {
      allowed: false,
      reason: "Alamat IP Anda tidak berada dalam rentang yang diizinkan",
    };
  }
  return { allowed: true };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
