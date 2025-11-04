import { useState, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ConfigPanel, type FilterConfig } from "@/components/ConfigPanel";
import { LogViewer } from "@/components/LogViewer";
import { StatsDashboard } from "@/components/StatsDashboard";
import { ActionBar } from "@/components/ActionBar";
import { filterAppiumLogs, setFilterConfig } from "@/lib/logFilter";
import { useToast } from "@/hooks/use-toast";

export default function LogFilteringApp() {
  const [originalLogs, setOriginalLogs] = useState("");
  const [filteredLogs, setFilteredLogs] = useState("");
  const [filename, setFilename] = useState("");
  const [processingTime, setProcessingTime] = useState<number | undefined>();
  const [config, setConfig] = useState<FilterConfig>({
    enableResponseTruncation: true,
    enableStackCompression: true,
    enableSessionCompression: true,
    enableHTTPGrouping: true,
    enableContextAwareFiltering: true,
  });
  const { toast } = useToast();

  const processLogs = useCallback((content: string, currentConfig: FilterConfig) => {
    const startTime = performance.now();
    setFilterConfig(currentConfig);
    const filtered = filterAppiumLogs(content);
    const endTime = performance.now();
    const time = (endTime - startTime) / 1000;

    setFilteredLogs(filtered || "No meaningful logs found after filtering.");
    setProcessingTime(time);
  }, []);

  const handleFileSelect = useCallback(
    (content: string, name: string) => {
      setOriginalLogs(content);
      setFilename(name);
      processLogs(content, config);
      toast({
        title: "File Loaded",
        description: `Successfully processed ${name}`,
      });
    },
    [config, processLogs, toast]
  );

  const handleConfigChange = useCallback(
    (newConfig: FilterConfig) => {
      setConfig(newConfig);
      if (originalLogs) {
        processLogs(originalLogs, newConfig);
      }
    },
    [originalLogs, processLogs]
  );

  const handleDownload = useCallback(() => {
    if (!filteredLogs) return;

    const blob = new Blob([filteredLogs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ? `filtered_${filename}` : "filtered_logs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Filtered logs have been downloaded",
    });
  }, [filteredLogs, filename, toast]);

  const handleCopy = useCallback(() => {
    if (!filteredLogs) return;

    navigator.clipboard.writeText(filteredLogs);
    toast({
      title: "Copied",
      description: "Filtered logs copied to clipboard",
    });
  }, [filteredLogs, toast]);

  const handleReset = useCallback(() => {
    setOriginalLogs("");
    setFilteredLogs("");
    setFilename("");
    setProcessingTime(undefined);
    toast({
      title: "Reset",
      description: "All data has been cleared",
    });
  }, [toast]);

  const originalLineCount = originalLogs.split("\n").length;
  const filteredLineCount = filteredLogs.split("\n").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Appium Log Filter</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {!originalLogs ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Intelligent Log Filtering</h2>
              <p className="text-muted-foreground">
                Upload your Appium log files to filter out noise and focus on critical information
              </p>
            </div>
            <FileUploadZone onFileSelect={handleFileSelect} />
            <ConfigPanel config={config} onChange={handleConfigChange} />
          </div>
        ) : (
          <div className="space-y-6">
            <StatsDashboard
              originalLines={originalLineCount}
              filteredLines={filteredLineCount}
              processingTime={processingTime}
            />

            <ConfigPanel config={config} onChange={handleConfigChange} />

            <ActionBar
              onDownload={handleDownload}
              onCopy={handleCopy}
              onReset={handleReset}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
              <LogViewer
                title="Original Logs"
                content={originalLogs}
                lineCount={originalLineCount}
                testId="viewer-original"
              />
              <LogViewer
                title="Filtered Logs"
                content={filteredLogs}
                lineCount={filteredLineCount}
                testId="viewer-filtered"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
