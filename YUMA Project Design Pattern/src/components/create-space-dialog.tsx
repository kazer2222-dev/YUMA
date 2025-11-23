import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import {
  Copy,
  Wand2,
  Settings2,
  Zap,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { navigationData } from "../lib/navigation-data";

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceCreated?: (spaceName: string) => void;
}

type CreationStep = "initial" | "customize-option" | "tabs-config" | "template-setup" | "ai-wizard";

// Available tabs configuration
const availableTabs = [
  { id: "overview", label: "Overview", description: "Space overview and quick stats", defaultEnabled: true },
  { id: "tasks", label: "Tasks", description: "Task list and management", defaultEnabled: true },
  { id: "board", label: "Board", description: "Kanban board view", defaultEnabled: true },
  { id: "calendar", label: "Calendar", description: "Calendar view for tasks", defaultEnabled: false },
  { id: "sprints", label: "Sprints", description: "Sprint planning and tracking", defaultEnabled: false },
  { id: "roadmap", label: "Roadmap", description: "Project roadmap timeline", defaultEnabled: false },
  { id: "reports", label: "Reports", description: "Analytics and insights", defaultEnabled: false },
  { id: "backlog", label: "Backlog", description: "Backlog management", defaultEnabled: false },
  { id: "releases", label: "Releases", description: "Release planning", defaultEnabled: false },
];

export function CreateSpaceDialog({
  open,
  onOpenChange,
  onSpaceCreated,
}: CreateSpaceDialogProps) {
  const [step, setStep] = useState<CreationStep>("initial");
  const [spaceName, setSpaceName] = useState("");
  const [creationOption, setCreationOption] = useState<"default" | "customize">("default");
  const [customizeMethod, setCustomizeMethod] = useState<"duplicate" | "manual" | "ai">("manual");
  const [selectedSpaceToDuplicate, setSelectedSpaceToDuplicate] = useState("");
  const [enabledTabs, setEnabledTabs] = useState<Record<string, boolean>>(
    availableTabs.reduce((acc, tab) => ({ ...acc, [tab.id]: tab.defaultEnabled }), {})
  );
  const [aiDescription, setAiDescription] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const spaces = navigationData.find(item => item.id === "spaces")?.children || [];

  const resetDialog = () => {
    setStep("initial");
    setSpaceName("");
    setCreationOption("default");
    setCustomizeMethod("manual");
    setSelectedSpaceToDuplicate("");
    setEnabledTabs(
      availableTabs.reduce((acc, tab) => ({ ...acc, [tab.id]: tab.defaultEnabled }), {})
    );
    setAiDescription("");
    setIsAiGenerating(false);
  };

  const handleCreateSpace = () => {
    if (!spaceName.trim()) {
      toast.error("Please enter a space name");
      return;
    }

    // Create space logic here based on the selected options
    if (creationOption === "default") {
      toast.success(`Space "${spaceName}" created with default configuration!`);
    } else {
      if (customizeMethod === "duplicate") {
        toast.success(`Space "${spaceName}" created by duplicating "${selectedSpaceToDuplicate}"!`);
      } else if (customizeMethod === "manual") {
        const enabledTabsList = Object.entries(enabledTabs)
          .filter(([_, enabled]) => enabled)
          .map(([id]) => availableTabs.find(tab => tab.id === id)?.label)
          .join(", ");
        toast.success(`Space "${spaceName}" created with tabs: ${enabledTabsList}`);
      } else if (customizeMethod === "ai") {
        toast.success(`Space "${spaceName}" created with AI-suggested configuration!`);
      }
    }

    onSpaceCreated?.(spaceName);
    onOpenChange(false);
    resetDialog();
  };

  const handleBack = () => {
    if (step === "tabs-config" || step === "ai-wizard") {
      setStep("customize-option");
    } else if (step === "customize-option") {
      setStep("initial");
    } else if (step === "template-setup") {
      setStep("tabs-config");
    }
  };

  const handleNextFromInitial = () => {
    if (!spaceName.trim()) {
      toast.error("Please enter a space name");
      return;
    }

    if (creationOption === "default") {
      handleCreateSpace();
    } else {
      setStep("customize-option");
    }
  };

  const handleNextFromCustomizeOption = () => {
    if (customizeMethod === "duplicate") {
      if (!selectedSpaceToDuplicate) {
        toast.error("Please select a space to duplicate");
        return;
      }
      handleCreateSpace();
    } else if (customizeMethod === "manual") {
      setStep("tabs-config");
    } else if (customizeMethod === "ai") {
      setStep("ai-wizard");
    }
  };

  const handleNextFromTabs = () => {
    // Check if at least one tab is enabled
    const hasEnabledTabs = Object.values(enabledTabs).some(enabled => enabled);
    if (!hasEnabledTabs) {
      toast.error("Please enable at least one tab");
      return;
    }
    setStep("template-setup");
  };

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe the space you want to create");
      return;
    }

    setIsAiGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate AI suggestions
    toast.success("AI has generated recommendations for your space!");
    setIsAiGenerating(false);
    
    // Auto-enable suggested tabs based on description
    // This is a simple simulation - in real app, AI would analyze the description
    const suggestedTabs = {
      overview: true,
      tasks: true,
      board: true,
      calendar: aiDescription.toLowerCase().includes("deadline") || aiDescription.toLowerCase().includes("schedule"),
      sprints: aiDescription.toLowerCase().includes("sprint") || aiDescription.toLowerCase().includes("agile"),
      roadmap: aiDescription.toLowerCase().includes("roadmap") || aiDescription.toLowerCase().includes("milestone"),
      reports: aiDescription.toLowerCase().includes("analytics") || aiDescription.toLowerCase().includes("report"),
      backlog: aiDescription.toLowerCase().includes("backlog"),
      releases: aiDescription.toLowerCase().includes("release"),
    };
    
    setEnabledTabs(suggestedTabs);
  };

  const getDialogTitle = () => {
    switch (step) {
      case "initial":
        return "Create New Space";
      case "customize-option":
        return "Choose Customization Method";
      case "tabs-config":
        return "Configure Tabs";
      case "template-setup":
        return "Setup Templates";
      case "ai-wizard":
        return "AI-Assisted Creation";
      default:
        return "Create New Space";
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case "initial":
        return "Create a new workspace to organize your projects and tasks";
      case "customize-option":
        return "Choose how you want to set up your space";
      case "tabs-config":
        return "Select which tabs you want to enable for this space";
      case "template-setup":
        return "Add templates to streamline task creation (optional)";
      case "ai-wizard":
        return "Describe your space and let AI suggest the best configuration";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[580px] bg-[var(--card)] border-[var(--border)] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {step !== "initial" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle className="text-[var(--foreground)]">
                {getDialogTitle()}
              </DialogTitle>
              {getDialogDescription() && (
                <DialogDescription className="text-[var(--muted-foreground)] text-sm mt-1">
                  {getDialogDescription()}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Initial */}
          {step === "initial" && (
            <div className="space-y-5">
              {/* Space Name */}
              <div className="space-y-2">
                <Label htmlFor="space-name" className="text-[var(--foreground)]">
                  Space Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="space-name"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g., Product Development, Marketing Campaign"
                  className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                  autoFocus
                />
              </div>

              {/* Creation Options */}
              <div className="space-y-3">
                <Label className="text-[var(--foreground)]">Creation Options</Label>
                <RadioGroup
                  value={creationOption}
                  onValueChange={(value: any) => setCreationOption(value)}
                  className="space-y-3"
                >
                  {/* Default Configuration */}
                  <label
                    htmlFor="default"
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      creationOption === "default"
                        ? "border-[#5B5FED] bg-[#5B5FED]/5"
                        : "border-[var(--border)] hover:border-[var(--border)]/80"
                    }`}
                  >
                    <RadioGroupItem value="default" id="default" className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#5B5FED]" />
                        <span className="text-[var(--foreground)]">
                          Create with Default Configuration
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Quick setup with standard tabs and blank templates
                      </p>
                    </div>
                  </label>

                  {/* Customize */}
                  <label
                    htmlFor="customize"
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      creationOption === "customize"
                        ? "border-[#5B5FED] bg-[#5B5FED]/5"
                        : "border-[var(--border)] hover:border-[var(--border)]/80"
                    }`}
                  >
                    <RadioGroupItem value="customize" id="customize" className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-[#5B5FED]" />
                        <span className="text-[var(--foreground)]">
                          Customize
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Configure tabs, templates, and workflows yourself
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: Customize Options */}
          {step === "customize-option" && (
            <div className="space-y-3">
              <RadioGroup
                value={customizeMethod}
                onValueChange={(value: any) => setCustomizeMethod(value)}
                className="space-y-3"
              >
                {/* Duplicate from Existing */}
                <label
                  htmlFor="duplicate"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    customizeMethod === "duplicate"
                      ? "border-[#5B5FED] bg-[#5B5FED]/5"
                      : "border-[var(--border)] hover:border-[var(--border)]/80"
                  }`}
                >
                  <RadioGroupItem value="duplicate" id="duplicate" className="mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-[#5B5FED]" />
                        <span className="text-[var(--foreground)]">
                          Duplicate from Existing Space
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Copy configuration from an existing space
                      </p>
                    </div>
                    
                    {customizeMethod === "duplicate" && (
                      <Select
                        value={selectedSpaceToDuplicate}
                        onValueChange={setSelectedSpaceToDuplicate}
                      >
                        <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]">
                          <SelectValue placeholder="Select a space to duplicate" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                          {spaces.map((space) => (
                            <SelectItem
                              key={space.id}
                              value={space.id}
                              className="text-[var(--foreground)]"
                            >
                              {space.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </label>

                {/* Customize by Myself */}
                <label
                  htmlFor="manual"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    customizeMethod === "manual"
                      ? "border-[#5B5FED] bg-[#5B5FED]/5"
                      : "border-[var(--border)] hover:border-[var(--border)]/80"
                  }`}
                >
                  <RadioGroupItem value="manual" id="manual" className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-[#5B5FED]" />
                      <span className="text-[var(--foreground)]">
                        Customize by Myself
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Manually configure tabs and templates
                    </p>
                  </div>
                </label>

                {/* Ask Help from AI */}
                <label
                  htmlFor="ai"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    customizeMethod === "ai"
                      ? "border-[#5B5FED] bg-[#5B5FED]/5"
                      : "border-[var(--border)] hover:border-[var(--border)]/80"
                  }`}
                >
                  <RadioGroupItem value="ai" id="ai" className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-[#5B5FED]" />
                      <span className="text-[var(--foreground)]">
                        Ask Help from AI
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Let AI suggest optimal configuration based on your needs
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Tabs Configuration */}
          {step === "tabs-config" && (
            <div className="space-y-3">
              {availableTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    enabledTabs[tab.id]
                      ? "border-[#5B5FED]/30 bg-[#5B5FED]/5"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--foreground)]">
                        {tab.label}
                      </span>
                      {tab.defaultEnabled && (
                        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      {tab.description}
                    </p>
                  </div>
                  <Switch
                    checked={enabledTabs[tab.id]}
                    onCheckedChange={(checked) =>
                      setEnabledTabs((prev) => ({ ...prev, [tab.id]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Template Setup */}
          {step === "template-setup" && (
            <div className="space-y-4">
              <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[var(--muted)]/50 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-[var(--foreground)] mb-2">Templates (Optional)</h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-4">
                  You can add templates later from Space Settings. Click "Create Space" to finish setup.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[var(--muted-foreground)] border-[var(--border)]"
                >
                  Add Template Now
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: AI Wizard */}
          {step === "ai-wizard" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-description" className="text-[var(--foreground)]">
                  Describe Your Space
                </Label>
                <textarea
                  id="ai-description"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="E.g., 'A space for managing our mobile app development with sprint planning, bug tracking, and release management'"
                  className="w-full min-h-[120px] p-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg resize-none placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B5FED] focus:border-transparent"
                />
              </div>

              {!isAiGenerating && Object.values(enabledTabs).some(v => v) && (
                <div className="p-4 bg-[#5B5FED]/5 border border-[#5B5FED]/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-[var(--foreground)]">
                    <Sparkles className="w-4 h-4 text-[#5B5FED]" />
                    <span>AI Recommendations</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Based on your description, we recommend:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(enabledTabs)
                        .filter(([_, enabled]) => enabled)
                        .map(([id]) => {
                          const tab = availableTabs.find(t => t.id === id);
                          return (
                            <span
                              key={id}
                              className="px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                            >
                              {tab?.label}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAiGenerate}
                disabled={isAiGenerating || !aiDescription.trim()}
                className="w-full bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
              >
                {isAiGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              resetDialog();
              onOpenChange(false);
            }}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </Button>
          
          {step === "initial" && (
            <Button
              onClick={handleNextFromInitial}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              {creationOption === "default" ? "Create Space" : "Next"}
            </Button>
          )}

          {step === "customize-option" && (
            <Button
              onClick={handleNextFromCustomizeOption}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              {customizeMethod === "duplicate" ? "Create Space" : "Next"}
            </Button>
          )}

          {step === "tabs-config" && (
            <Button
              onClick={handleNextFromTabs}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              Next
            </Button>
          )}

          {step === "template-setup" && (
            <Button
              onClick={handleCreateSpace}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              Create Space
            </Button>
          )}

          {step === "ai-wizard" && Object.values(enabledTabs).some(v => v) && (
            <Button
              onClick={handleCreateSpace}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              Create Space
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}