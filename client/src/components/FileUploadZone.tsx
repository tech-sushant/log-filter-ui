import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";

interface FileUploadZoneProps {
  onFileSelect: (content: string, filename: string) => void;
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-200 ${
        isDragging ? "border-primary bg-accent/50 scale-[1.02]" : "border-border"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-testid="zone-file-upload"
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
    </Card>
  );
}
