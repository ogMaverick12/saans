/**
 * One HTTP security header emitted for every route.
 */
export interface SecurityHeader {
  key: string;
  value: string;
}

const CONTENT_SECURITY_POLICY = "Content-Security-Policy";
const X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
const REFERRER_POLICY = "Referrer-Policy";
const PERMISSIONS_POLICY = "Permissions-Policy";

const SCRIPT_SOURCES = "'self' 'unsafe-inline'";
const UNSAFE_EVAL_SOURCE = " 'unsafe-eval'";

/**
 * Builds the CSP and companion security headers for all routes.
 */
export function buildSecurityHeaders(isDevelopment: boolean): SecurityHeader[] {
  const scriptSources = `${SCRIPT_SOURCES}${isDevelopment ? UNSAFE_EVAL_SOURCE : ""}`;
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return [
    { key: CONTENT_SECURITY_POLICY, value: contentSecurityPolicy },
    { key: X_CONTENT_TYPE_OPTIONS, value: "nosniff" },
    { key: REFERRER_POLICY, value: "strict-origin-when-cross-origin" },
    {
      key: PERMISSIONS_POLICY,
      value: "geolocation=(self), camera=(), microphone=()",
    },
  ];
}
