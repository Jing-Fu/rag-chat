import { AppSidebar } from "@/components/layout/app-sidebar";
import { Database, Plus, Search, Trash2, UploadCloud, RefreshCw } from "lucide-react";

export default function KnowledgePage() {
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Knowledge Bases</h1>
          </div>
          <button className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Database
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto w-full relative p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search knowledge bases..." 
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </div>

            {/* List / Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium text-foreground py-3">Name</th>
                    <th className="px-6 py-4 font-medium text-foreground py-3">Description</th>
                    <th className="px-6 py-4 font-medium text-foreground py-3">Documents</th>
                    <th className="px-6 py-4 font-medium text-foreground py-3">Status</th>
                    <th className="px-6 py-4 font-medium text-foreground py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Mock Data Row 1 */}
                  <tr className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">Engineering Docs</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">Technical specifications and design documents constraint rules.</td>
                    <td className="px-6 py-4 text-muted-foreground">12 Files</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ready
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary" title="Sync / Refresh">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary" title="Upload Document">
                          <UploadCloud className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-500/70 hover:text-red-500 rounded hover:bg-red-500/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Mock Data Row 2 */}
                  <tr className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">HR Guidelines</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">Company policies, benefits, and onboarding guides.</td>
                    <td className="px-6 py-4 text-muted-foreground">4 Files</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Indexing
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary" title="Sync / Refresh">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary" title="Upload Document">
                          <UploadCloud className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-500/70 hover:text-red-500 rounded hover:bg-red-500/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}