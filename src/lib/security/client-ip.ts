const UNKNOWN_CLIENT_IP = "unknown";
const REAL_IP_HEADER = "x-real-ip";
const FORWARDED_FOR_HEADER = "x-forwarded-for";

/**
 * Reads the client address from x-real-ip, then the last X-Forwarded-For entry, or "unknown".
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get(REAL_IP_HEADER)?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = headers.get(FORWARDED_FOR_HEADER);
  if (forwardedFor === null) {
    return UNKNOWN_CLIENT_IP;
  }

  const addresses = forwardedFor.split(",");
  const nearestAddress = addresses[addresses.length - 1]?.trim();
  return nearestAddress ? nearestAddress : UNKNOWN_CLIENT_IP;
}
