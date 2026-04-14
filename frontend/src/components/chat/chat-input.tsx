import { ArrowUp, Paperclip } from "lucide-react";

export function ChatInput() {
  return (
    <div className="relative rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] flex flex-col p-1.5 shadow-sm max-w-3xl mx-auto w-full">
      <textarea
        placeholder="Message RAG Assistant..."
        className="w-full bg-transparent resize-none outline-none focus:ring-0 text-foreground px-4 py-3 min-h-[52px] max-h-[200px] text-[15px]"
        rows={1}
      />
      <div className="flex items-center justify-between px-2 pb-1.5">
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="Attach knowledge or files">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block mr-2 font-medium">Use shift + return for new line</div>
          <button className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-opacity">
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}