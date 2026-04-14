import { ChevronDown, Cpu, Database, PenTool } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatHeader() {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-1 sm:gap-2 text-sm max-w-full overflow-x-auto scrollbar-hide py-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium text-foreground whitespace-nowrap">
              <Cpu className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span>llama3.2</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem className="cursor-pointer">llama3.2</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">mistral:instruct</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">phi3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium text-foreground whitespace-nowrap">
              <PenTool className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span>Default Assistant</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem className="cursor-pointer">Default Assistant</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Code Reviewer</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Documentation Writer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium whitespace-nowrap">
              <Database className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground opacity-90">No Knowledge Base</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            <DropdownMenuItem className="cursor-pointer font-medium text-muted-foreground">None (General Chat)</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Company Handbook (Ready)</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Engineering Specs (Ready)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}