import type { ChatMessageItem, ChatSourceItem } from "@/lib/api";

function getSources(message: ChatMessageItem): ChatSourceItem[] {
  return message.sources?.items ?? [];
}

function ThinkingIndicator() {
  return (
    <span
      aria-label="助理正在思考"
      className="inline-flex items-center gap-1 text-muted-foreground"
    >
      <span className="size-2 rounded-full bg-current animate-pulse [animation-delay:-0.3s]" />
      <span className="size-2 rounded-full bg-current animate-pulse [animation-delay:-0.15s]" />
      <span className="size-2 rounded-full bg-current animate-pulse" />
    </span>
  );
}

type ChatMessageListProps = {
  messages: ChatMessageItem[];
  isStreaming?: boolean;
};

export function ChatMessageList({ messages, isStreaming = false }: ChatMessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-0 py-8 pb-16 sm:px-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const sources = getSources(message);
        const isThinking = !isUser && isStreaming && !message.content;

        return (
          <article
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] text-sm leading-6 ${
                isUser
                  ? "rounded-full bg-foreground px-5 py-3 text-background"
                  : "rounded-[12px] border border-border bg-card px-5 py-4 text-foreground"
              }`}
            >
              {isThinking ? (
                <div className="flex min-h-6 items-center">
                  <ThinkingIndicator />
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
              {!isUser && sources.length > 0 && (
                <div className="mt-4 rounded-[12px] border border-border bg-muted px-3 py-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">引用來源</p>
                  <ul className="mt-2 space-y-1.5">
                    {sources.map((source) => (
                      <li key={`${source.chunk_id}-${source.chunk_index}`} className="truncate">
                        {source.filename} · 區塊 {source.chunk_index} ·{" "}
                        {(source.relevance_score * 100).toFixed(1)}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {isStreaming && (
        <div className="pl-2 text-xs text-muted-foreground animate-pulse">回應串流中...</div>
      )}
    </div>
  );
}
