import { type NextRequest } from "next/server";

import { buildBackendUrl, createProxyHeaders } from "@/lib/api-proxy";

export const dynamic = "force-dynamic";

async function proxyRequest(request: NextRequest): Promise<Response> {
  const targetUrl = buildBackendUrl(request, request.nextUrl.pathname, request.nextUrl.search);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: createProxyHeaders(request),
    cache: "no-store",
    redirect: "manual",
  };

  if (hasBody) {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstreamResponse = await fetch(targetUrl, init);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
