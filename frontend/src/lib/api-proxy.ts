const DEFAULT_BACKEND_PORT = "8000";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

type RequestWithHeaders = {
  headers: Headers;
};

type HeadersLike = {
  headers: Headers;
};

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getFirstHeaderValue(headers: Headers, name: string): string | null {
  const rawValue = headers.get(name);
  if (!rawValue) {
    return null;
  }

  return rawValue.split(",")[0]?.trim() ?? null;
}

export function resolveBackendBaseUrl(request: RequestWithHeaders): string {
  const configuredBaseUrl = process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL;
  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  const forwardedProto = getFirstHeaderValue(request.headers, "x-forwarded-proto") ?? "http";
  const forwardedHost =
    getFirstHeaderValue(request.headers, "x-forwarded-host") ??
    getFirstHeaderValue(request.headers, "host") ??
    `localhost:${DEFAULT_BACKEND_PORT}`;
  const hostname = forwardedHost.replace(/:\d+$/, "");

  return `${forwardedProto}://${hostname}:${DEFAULT_BACKEND_PORT}`;
}

export function buildBackendUrl(
  request: RequestWithHeaders,
  pathname: string,
  search: string,
): string {
  const url = new URL(pathname, `${resolveBackendBaseUrl(request)}/`);
  url.search = search;
  return url.toString();
}

export function createProxyHeaders(request: RequestWithHeaders): Headers {
  const headers = new Headers(request.headers);

  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  return headers;
}

export function createProxyResponseHeaders(response: HeadersLike): Headers {
  const headers = new Headers(response.headers);

  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  return headers;
}
