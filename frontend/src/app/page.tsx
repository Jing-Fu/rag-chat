import { AppSidebar } from "@/components/layout/app-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatHeader />
        
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4 pt-12 pb-32">
            <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-6 shadow-sm border border-border">
              <Bot className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">How can I help you today?</h2>
            <p className="text-muted-foreground text-center text-[15px] max-w-md">
              Start typing to chat. To run a grounded RAG query, ensure you have selected a 
              <strong className="text-foreground font-medium mx-1">Knowledge Base</strong> 
              from the top menu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full">
              <button className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80">
                <span className="block font-medium text-foreground mb-1">Summarize docs</span>
                Using the Engineering Specs knowledge base
              </button>
              <button className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80">
                <span className="block font-medium text-foreground mb-1">Explain vector search</span>
                Using the Default Assistant prompt
              </button>
            </div>
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-4">
          <ChatInput />
          <p className="text-center text-xs text-muted-foreground mt-3">
            RAG Platform generates answers locally. Responses may vary based on selected context.
          </p>
        </div>
      </div>
    </div>
  );
}
