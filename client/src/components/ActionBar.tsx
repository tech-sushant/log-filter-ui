import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";

interface ActionBarProps {
  onDownload: () => void;
  onCopy: () => void;
  onReset: () => void;
  onSearch?: (query: string) => void;
}

export function ActionBar({ onDownload, onCopy, onReset, onSearch }: ActionBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border-b flex-wrap" data-testid="bar-actions">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search in logs..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="default"
          onClick={onCopy}
          data-testid="button-copy"
          className="hover-elevate active-elevate-2"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={onDownload}
          data-testid="button-download"
          className="hover-elevate active-elevate-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="ghost"
          size="default"
          onClick={onReset}
          data-testid="button-reset"
          className="hover-elevate active-elevate-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
