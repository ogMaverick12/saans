const UNKNOWN_CLIENT_IP = "unknown";
const FORWARDED_FOR_HEADER = "x-forwarded-for";

/**
 * Reads the first address from the X-Forwarded-For header, or "unknown".
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get(FORWARDED_FOR_HEADER);
  if (forwardedFor === null) {
    return UNKNOWN_CLIENT_IP;
  }

  const [firstAddress] = forwardedFor.split(",");
  const trimmedAddress = firstAddress?.trim();
  return trimmedAddress ? trimmedAddress : UNKNOWN_CLIENT_IP;
}
