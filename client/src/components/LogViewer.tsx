import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";

interface LogViewerProps {
  title: string;
  content: string;
  lineCount: number;
  testId?: string;
}

export function LogViewer({ title, content, lineCount, testId }: LogViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [content]);

  const highlightLog = (line: string, index: number) => {
    let className = "leading-relaxed";
    
    if (/Error|Exception|Failed|Cannot|NoSuchElement/i.test(line)) {
      className += " font-semibold text-destructive";
    } else if (/WARNING|WARN|Warning/i.test(line)) {
      className += " font-medium text-amber-600 dark:text-amber-500";
    } else if (/\[HTTP\]/i.test(line)) {
      className += " text-chart-2";
    } else if (/\[debug\]/i.test(line)) {
      className += " text-muted-foreground";
    }

    return (
      <div key={index} className="flex gap-4">
        <span className="text-xs text-muted-foreground select-none w-12 text-right flex-shrink-0">
          {index + 1}
        </span>
        <span className={className}>{line}</span>
      </div>
    );
  };

  const lines = content.split("\n");

  return (
    <Card className="flex flex-col h-full" data-testid={testId}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Badge variant="secondary" data-testid={`${testId}-count`}>
            {lineCount.toLocaleString()} lines
          </Badge>
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
