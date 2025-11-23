import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface AISuggestion {
  type: "insight" | "warning" | "success";
  title: string;
  description: string;
}

interface AIAssistantPanelProps {
  suggestions?: AISuggestion[];
}

const suggestionIcons = {
  insight: TrendingUp,
  warning: AlertCircle,
  success: CheckCircle2,
};

const suggestionStyles = {
  insight: "border-[var(--ai-primary)] bg-[var(--ai-primary)]/5",
  warning: "border-[var(--priority-medium)] bg-[var(--priority-medium)]/5",
  success: "border-[var(--status-done)] bg-[var(--status-done)]/5",
};

export function AIAssistantPanel({ suggestions = [] }: AIAssistantPanelProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-[var(--ai-gradient-from)]/5 to-[var(--ai-gradient-to)]/5 border-[var(--ai-primary)]/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--ai-gradient-from)] to-[var(--ai-gradient-to)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[var(--ai-primary)]">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent insights and recommendations
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestionIcons[suggestion.type];
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${suggestionStyles[suggestion.type]}`}
                >
                  <div className="flex gap-3">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <h4>{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            className="border-[var(--ai-primary)]/30 hover:bg-[var(--ai-primary)]/10"
          >
            Ask AI
          </Button>
          <Button className="bg-gradient-to-r from-[var(--ai-gradient-from)] to-[var(--ai-gradient-to)] text-white hover:opacity-90">
            Generate Tasks
          </Button>
        </div>
      </div>
    </Card>
  );
}
