import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Filter,
  Play,
  Save,
  ArrowLeft,
  Search,
} from "lucide-react";
import { AutomationTriggerSelector } from "./automation-trigger-selector";
import { AutomationConditions } from "./automation-conditions";
import { AutomationActions } from "./automation-actions";
import { AutomationPreview } from "./automation-preview";
import { toast } from "sonner@2.0.3";

interface AutomationBuilderProps {
  onBack?: () => void;
  onSave?: () => void;
}

export function AutomationBuilder({
  onBack,
  onSave,
}: AutomationBuilderProps) {
  const [step, setStep] = useState(1);
  const [automationName, setAutomationName] = useState("");
  
  // Trigger state
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  
  // Conditions state
  const [conditions, setConditions] = useState<any[]>([]);
  
  // Actions state
  const [actions, setActions] = useState<any[]>([]);

  const steps = [
    { number: 1, title: "Select Trigger", icon: Zap },
    { number: 2, title: "Add Conditions", icon: Filter, optional: true },
    { number: 3, title: "Add Actions", icon: Play },
    { number: 4, title: "Save Automation", icon: Save },
  ];

  const handleNext = () => {
    if (step === 1 && !selectedTrigger) {
      toast.error("Please select a trigger");
      return;
    }
    if (step === 3 && actions.length === 0) {
      toast.error("Please add at least one action");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    if (!automationName.trim()) {
      toast.error("Please enter an automation name");
      return;
    }
    toast.success("Automation created successfully!");
    onSave?.();
    
    // Reset form
    setStep(1);
    setAutomationName("");
    setSelectedTrigger(null);
    setConditions([]);
    setActions([]);
  };

  const handleClose = () => {
    setStep(1);
    setAutomationName("");
    setSelectedTrigger(null);
    setConditions([]);
    setActions([]);
    onBack?.();
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--background)] relative">
      {/* Header - Fixed */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-[var(--foreground)]">
                {step === 4 ? "Save Automation" : "Create Automation"}
              </h1>
              <p className="text-[var(--muted-foreground)] text-sm">
                {steps[step - 1].title}
                {steps[step - 1].optional && " (Optional)"}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  step === s.number
                    ? "bg-[#5B5FED] text-white"
                    : step > s.number
                    ? "bg-green-500/20 text-green-500"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-xs">
                  {s.title}
                  {s.optional && " (Optional)"}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area - Absolute positioned with scrolling */}
      <div className="absolute left-0 right-0 flex" style={{ top: '140px', bottom: '80px' }}>
        {/* Main Content - Left side */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden">
          <div className="p-6">
            {step === 1 && (
              <AutomationTriggerSelector
                selectedTrigger={selectedTrigger}
                onSelectTrigger={setSelectedTrigger}
              />
            )}
            {step === 2 && (
              <AutomationConditions
                conditions={conditions}
                onConditionsChange={setConditions}
              />
            )}
            {step === 3 && (
              <AutomationActions actions={actions} onActionsChange={setActions} />
            )}
            {step === 4 && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="automation-name" className="text-[var(--foreground)]">
                    Automation Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="automation-name"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    placeholder="e.g., High Priority Alert"
                    className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
                  />
                </div>

                {/* Summary */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                  <h3 className="text-[var(--foreground)] mb-4">Automation Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[var(--muted-foreground)] mb-1">
                          Trigger
                        </div>
                        <div className="text-[var(--foreground)]">
                          {selectedTrigger?.label || "No trigger selected"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Filter className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[var(--muted-foreground)] mb-1">
                          Conditions
                        </div>
                        <div className="text-[var(--foreground)]">
                          {conditions.length === 0
                            ? "No conditions (always run)"
                            : `${conditions.length} ${
                                conditions.length === 1 ? "condition" : "conditions"
                              }`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Play className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[var(--muted-foreground)] mb-1">
                          Actions
                        </div>
                        <div className="text-[var(--foreground)]">
                          {actions.length === 0
                            ? "No actions"
                            : `${actions.length} ${
                                actions.length === 1 ? "action" : "actions"
                              }`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Preview */}
        <div className="w-80 border-l border-[var(--border)] flex-shrink-0 bg-[var(--card)] overflow-y-auto">
          <AutomationPreview
            trigger={selectedTrigger}
            conditions={conditions}
            actions={actions}
          />
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] z-10">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Skip Conditions
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white min-w-[120px]"
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white min-w-[160px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Automation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}