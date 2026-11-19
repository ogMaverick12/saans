import { ALLOWED_HOSTS } from "@/lib/config";
import { AppError } from "@/lib/errors";

const ALLOWED_PROTOCOL = "https:";
const BLOCKED_MESSAGE =
  "The request was blocked because its destination is not allowed.";

/**
 * Throws when a URL is not HTTPS or its host is not on the allowlist.
 */
export function assertAllowedHost(url: URL): void {
  const isHttps = url.protocol === ALLOWED_PROTOCOL;
  const isAllowedHost = ALLOWED_HOSTS.some((host) => host === url.hostname);

  if (!isHttps || !isAllowedHost) {
    throw new AppError("UPSTREAM_BLOCKED", BLOCKED_MESSAGE);
  }
}
