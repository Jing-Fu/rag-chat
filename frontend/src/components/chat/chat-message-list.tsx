import type { ChatMessageItem, ChatSourceItem } from "@/lib/api";

function getSources(message: ChatMessageItem): ChatSourceItem[] {
  return message.sources?.items ?? [];
}

function ThinkingIndicator() {
  return (
    <span
      aria-label="Assistant is thinking"
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
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 pb-32">
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
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                isUser
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-foreground"
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
                <div className="mt-3 border-t border-border/80 pt-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground/90">Sources</p>
                  <ul className="mt-1 space-y-1">
                    {sources.map((source) => (
                      <li key={`${source.chunk_id}-${source.chunk_index}`} className="truncate">
                        {source.filename} · chunk {source.chunk_index} ·{" "}
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
        <div className="text-xs text-muted-foreground animate-pulse pl-2">Streaming response...</div>
      )}
    </div>
  );
}
