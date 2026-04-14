import { AppSidebar } from "@/components/layout/app-sidebar";
import { PenTool, Plus, Search, Edit3, Trash2, Globe } from "lucide-react";

export default function PromptsPage() {
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Prompt Templates</h1>
          </div>
          <button className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto w-full relative p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Search and Category Filter */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </div>

            {/* Grid Layout for Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              
              {/* Card 1 */}
              <div className="group border border-border rounded-xl bg-card hover:bg-secondary/40 transition-colors flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card rounded-md shadow-sm border border-border">
                  <button className="p-1.5 hover:bg-secondary rounded-l text-muted-foreground hover:text-foreground transition-colors" title="Edit Template">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-border my-1" />
                  <button className="p-1.5 hover:bg-red-500/10 rounded-r text-red-500/70 hover:text-red-500 transition-colors" title="Delete Template">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</span>
                  </div>
                  <h3 className="font-semibold text-foreground text-base line-clamp-1">Expert Coder Assistant</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">You are an expert software engineer providing concise, accurate, and highly optimized code solutions. Always assume modern best practices context. Avoid general explanations.</p>
                </div>
                <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Default for: <strong className="text-foreground">Chat</strong></span>
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group border border-border rounded-xl bg-card hover:bg-secondary/40 transition-colors flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card rounded-md shadow-sm border border-border">
                  <button className="p-1.5 hover:bg-secondary rounded-l text-muted-foreground hover:text-foreground transition-colors" title="Edit Template">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-border my-1" />
                  <button className="p-1.5 hover:bg-red-500/10 rounded-r text-red-500/70 hover:text-red-500 transition-colors" title="Delete Template">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-md">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Prompt</span>
                  </div>
                  <h3 className="font-semibold text-foreground text-base line-clamp-1">Summarize into Bullets</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">Please review the following text and summarize the key points into a precise, 5-point bullet list without omitting crucial definitions.</p>
                </div>
                <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Shortcuts: <strong className="text-foreground">/sum</strong></span>
                  <span className="bg-muted px-2 py-0.5 rounded border border-border">Inactive</span>
                </div>
              </div>
              
              {/* Add New Card Placeholder */}
              <button className="border-2 border-dashed border-border rounded-xl bg-background hover:bg-secondary/20 transition-all flex flex-col items-center justify-center min-h-[220px] text-muted-foreground hover:text-foreground hover:border-foreground/40 group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Create New Template</span>
                <span className="text-xs mt-1 text-muted-foreground/70">Define system behavior or prompt shortcut</span>
              </button>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}