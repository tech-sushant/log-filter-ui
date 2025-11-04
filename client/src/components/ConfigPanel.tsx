import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Combine, FileText, Layers, Filter, Zap } from "lucide-react";

export interface FilterConfig {
  enableResponseTruncation: boolean;
  enableStackCompression: boolean;
  enableSessionCompression: boolean;
  enableHTTPGrouping: boolean;
  enableContextAwareFiltering: boolean;
}

interface ConfigPanelProps {
  config: FilterConfig;
  onChange: (config: FilterConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const options = [
    {
      id: "enableResponseTruncation",
      label: "Response Truncation",
      description: "Truncate large response payloads",
      icon: FileText,
    },
    {
      id: "enableStackCompression",
      label: "Stack Compression",
      description: "Combine lengthy stack traces",
      icon: Combine,
    },
    {
      id: "enableSessionCompression",
      label: "Session Compression",
      description: "Combine session setup logs",
      icon: Layers,
    },
    {
      id: "enableHTTPGrouping",
      label: "HTTP Grouping",
      description: "Group similar HTTP requests",
      icon: Filter,
    },
    {
      id: "enableContextAwareFiltering",
      label: "Context Filtering",
      description: "Filter based on error context",
      icon: Zap,
    },
  ];

  const handleToggle = (key: keyof FilterConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <Card data-testid="panel-config">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Filter Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {option.description}
                </p>
                <Switch
                  id={option.id}
                  checked={config[option.id as keyof FilterConfig]}
                  onCheckedChange={() => handleToggle(option.id as keyof FilterConfig)}
                  data-testid={`switch-${option.id}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
