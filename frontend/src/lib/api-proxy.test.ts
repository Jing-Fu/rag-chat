import { afterEach, describe, expect, it } from "vitest";

import {
  buildBackendUrl,
  createProxyHeaders,
  createProxyResponseHeaders,
  resolveBackendBaseUrl,
} from "@/lib/api-proxy";

function createRequestLike(headersInit: HeadersInit = {}) {
  return {
    headers: new Headers(headersInit),
  };
}

describe("api proxy helpers", () => {
  afterEach(() => {
    delete process.env.API_PROXY_TARGET;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("prefers explicit API proxy target when configured", () => {
    process.env.API_PROXY_TARGET = "http://backend:8000/";

    const baseUrl = resolveBackendBaseUrl(createRequestLike({ host: "localhost:3000" }));

    expect(baseUrl).toBe("http://backend:8000");
  });

  it("derives backend host from forwarded request headers when env is unset", () => {
    const baseUrl = resolveBackendBaseUrl(
      createRequestLike({
        "x-forwarded-proto": "https",
        "x-forwarded-host": "127.0.0.1:3000",
      }),
    );

    expect(baseUrl).toBe("https://127.0.0.1:8000");
  });

  it("keeps the api path and query string when building the target url", () => {
    const targetUrl = buildBackendUrl(
      createRequestLike({ host: "localhost:3000" }),
      "/api/knowledge",
      "?status=ready",
    );

    expect(targetUrl).toBe("http://localhost:8000/api/knowledge?status=ready");
  });

  it("removes hop-by-hop request headers before proxying", () => {
    const headers = createProxyHeaders(
      createRequestLike({
        host: "localhost:3000",
        connection: "keep-alive",
        "content-length": "12",
        authorization: "Bearer token",
      }),
    );

    expect(headers.get("authorization")).toBe("Bearer token");
    expect(headers.has("host")).toBe(false);
    expect(headers.has("connection")).toBe(false);
    expect(headers.has("content-length")).toBe(false);
  });

  it("removes hop-by-hop response headers before returning the proxy response", () => {
    const headers = createProxyResponseHeaders(
      createRequestLike({
        connection: "keep-alive",
        "content-length": "256",
        "content-type": "text/event-stream",
        "transfer-encoding": "chunked",
      }),
    );

    expect(headers.get("content-type")).toBe("text/event-stream");
    expect(headers.has("connection")).toBe(false);
    expect(headers.has("content-length")).toBe(false);
    expect(headers.has("transfer-encoding")).toBe(false);
  });
});
