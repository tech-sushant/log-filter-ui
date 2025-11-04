import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState, useMemo } from "react";

interface LogViewerProps {
  title: string;
  content: string;
  lineCount: number;
  testId?: string;
  searchQuery?: string;
}

export function LogViewer({ title, content, lineCount, testId, searchQuery = "" }: LogViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [content]);

  const lines = useMemo(() => content.split("\n"), [content]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedLines(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = new Set<number>();
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query)) {
        matches.add(index);
      }
    });

    setHighlightedLines(matches);

    // Scroll to first match
    if (matches.size > 0 && contentRef.current) {
      const firstMatch = Math.min(...Array.from(matches));
      const lineHeight = 24; // approximate line height
      contentRef.current.scrollTop = firstMatch * lineHeight - 100;
    }
  }, [searchQuery, lines]);

  const highlightLog = (line: string, index: number) => {
    let className = "leading-relaxed";
    const isSearchMatch = highlightedLines.has(index);
    
    if (isSearchMatch) {
      className += " bg-yellow-200 dark:bg-yellow-900/30";
    }

    if (/Error|Exception|Failed|Cannot|NoSuchElement/i.test(line)) {
      className += " font-semibold text-destructive";
    } else if (/WARNING|WARN|Warning/i.test(line)) {
      className += " font-medium text-amber-600 dark:text-amber-500";
    } else if (/\[HTTP\]/i.test(line)) {
      className += " text-chart-2";
    } else if (/\[debug\]/i.test(line)) {
      className += " text-muted-foreground";
    }

    // Highlight search term within the line
    let displayLine = line;
    if (searchQuery && isSearchMatch) {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = line.split(regex);
      return (
        <div key={index} className="flex gap-4">
          <span className="text-xs text-muted-foreground select-none w-12 text-right flex-shrink-0">
            {index + 1}
          </span>
          <span className={className}>
            {parts.map((part, i) => 
              regex.test(part) ? (
                <mark key={i} className="bg-yellow-400 dark:bg-yellow-600 text-foreground font-semibold px-0.5">
                  {part}
                </mark>
              ) : (
                part
              )
            )}
          </span>
        </div>
      );
    }

    return (
      <div key={index} className="flex gap-4">
        <span className="text-xs text-muted-foreground select-none w-12 text-right flex-shrink-0">
          {index + 1}
        </span>
        <span className={className}>{displayLine}</span>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full" data-testid={testId}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {searchQuery && highlightedLines.size > 0 && (
              <Badge variant="outline" className="text-xs">
                {highlightedLines.size} matches
              </Badge>
            )}
            <Badge variant="secondary" data-testid={`${testId}-count`}>
              {lineCount.toLocaleString()} lines
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div
          ref={contentRef}
          className="h-full overflow-y-auto px-6 pb-6 font-mono text-sm bg-muted/30"
          data-testid={`${testId}-content`}
        >
          {lines.map((line, index) => highlightLog(line, index))}
        </div>
      </CardContent>
    </Card>
  );
}
