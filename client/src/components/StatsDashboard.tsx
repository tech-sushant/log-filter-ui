import { Card, CardContent } from "@/components/ui/card";
import { FileText, Filter, TrendingDown, Clock } from "lucide-react";

interface StatsDashboardProps {
  originalLines: number;
  filteredLines: number;
  processingTime?: number;
}

export function StatsDashboard({
  originalLines,
  filteredLines,
  processingTime,
}: StatsDashboardProps) {
  const reduction = originalLines > 0
    ? ((originalLines - filteredLines) / originalLines * 100).toFixed(1)
    : "0";

  const stats = [
    {
      label: "Original Lines",
      value: originalLines.toLocaleString(),
      icon: FileText,
      testId: "stat-original",
    },
    {
      label: "Filtered Lines",
      value: filteredLines.toLocaleString(),
      icon: Filter,
      testId: "stat-filtered",
    },
    {
      label: "Reduction",
      value: `${reduction}%`,
      icon: TrendingDown,
      trend: parseFloat(reduction) > 50 ? "positive" : "neutral",
      testId: "stat-reduction",
    },
    {
      label: "Processing Time",
      value: processingTime ? `${processingTime.toFixed(2)}s` : "—",
      icon: Clock,
      testId: "stat-time",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-4xl font-bold" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
