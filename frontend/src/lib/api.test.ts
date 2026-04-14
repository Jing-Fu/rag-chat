import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, chatApi } from "@/lib/api";

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("chatApi.streamChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses SSE events and returns final accumulated message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse([
          "event: session\ndata: session-1\n\n",
          "event: token\ndata: Hello\n\n",
          "event: token\ndata: world\n\n",
          'event: done\ndata: {"session_id":"session-1","sources":[]}\n\n',
        ]),
      ),
    );

    const onToken = vi.fn();
    const result = await chatApi.streamChat(
      {
        message: "hello",
        kb_id: "kb-1",
        model_name: "llama3.2",
      },
      { onToken },
    );

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(result.sessionId).toBe("session-1");
    expect(result.fullText).toBe("Helloworld");
    expect(result.sources).toEqual([]);
  });

  it("throws ApiError when backend returns non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "invalid request" }), {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      chatApi.streamChat({
        message: "hello",
        kb_id: "kb-1",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

