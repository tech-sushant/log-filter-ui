import { Upload, FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FileUploadZoneProps {
  onFileSelect: (content: string, filename: string) => void;
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [pastedContent, setPastedContent] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "text/plain" || file.name.endsWith(".log") || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onFileSelect(content, file.name);
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .txt or .log file");
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(() => {
    if (pastedContent.trim()) {
      onFileSelect(pastedContent, "pasted-logs.txt");
      setPastedContent("");
    }
  }, [pastedContent, onFileSelect]);

  return (
    <Card data-testid="zone-file-upload">
      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "upload" ? "default" : "outline"}
            onClick={() => setMode("upload")}
            className="flex-1 hover-elevate active-elevate-2"
            data-testid="button-mode-upload"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          <Button
            variant={mode === "paste" ? "default" : "outline"}
            onClick={() => setMode("paste")}
            className="flex-1 hover-elevate active-elevate-2"
            data-testid="button-mode-paste"
          >
            <FileText className="h-4 w-4 mr-2" />
            Paste Logs
          </Button>
        </div>

        {mode === "upload" ? (
          <div
            className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
              isDragging ? "border-primary bg-accent/50 scale-[1.02]" : "border-border"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center p-12 min-h-64">
              <Upload className={`h-24 w-24 mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="text-lg font-medium mb-2">Drop your log file here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <input
                type="file"
                accept=".txt,.log"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                data-testid="input-file"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover-elevate active-elevate-2"
                data-testid="button-browse"
              >
                Browse Files
              </label>
              <p className="text-xs text-muted-foreground mt-4">.txt, .log files supported</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your Appium logs here..."
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              className="min-h-64 font-mono text-sm"
              data-testid="textarea-paste"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {pastedContent.split("\n").length.toLocaleString()} lines
              </p>
              <Button
                onClick={handlePaste}
                disabled={!pastedContent.trim()}
                data-testid="button-process-paste"
                className="hover-elevate active-elevate-2"
              >
                Process Logs
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
