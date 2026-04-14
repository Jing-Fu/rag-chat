import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { type KeyboardEvent, type TextareaHTMLAttributes } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  errorMessage?: string | null;
} & Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows">;

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isSending = false,
  placeholder = "Message RAG Assistant...",
  errorMessage = null,
  rows = 1,
}: ChatInputProps) {
  const canSubmit = !disabled && !isSending && value.trim().length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (canSubmit) {
      onSubmit();
    }
  }

  return (
    <div className="w-full">
      <div className="relative rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] flex flex-col p-1.5 shadow-sm max-w-3xl mx-auto w-full">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className="w-full bg-transparent resize-none outline-none focus:ring-0 text-foreground px-4 py-3 min-h-[52px] max-h-[200px] text-[15px] disabled:opacity-50"
          rows={rows}
        />
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="p-2 rounded-full text-muted-foreground/60 cursor-not-allowed"
              title="File upload is managed in Knowledge page"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden sm:block mr-2 font-medium">
              Use shift + return for new line
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {errorMessage && (
        <p className="mt-2 text-xs text-red-300 text-center" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
