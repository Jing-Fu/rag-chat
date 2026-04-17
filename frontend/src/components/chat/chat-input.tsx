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
  placeholder = "詢問任何與本機知識庫相關的問題",
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
      <div className="surface-prompt mx-auto flex w-full max-w-4xl flex-col px-3 py-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className="min-h-[52px] max-h-[200px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-neutral-400 disabled:opacity-50"
          rows={rows}
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full p-2 text-muted-foreground/60"
              title="檔案上傳請到知識庫頁面操作"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 hidden text-xs text-muted-foreground sm:block">
              使用 Shift + Enter 換行
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {errorMessage && (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
