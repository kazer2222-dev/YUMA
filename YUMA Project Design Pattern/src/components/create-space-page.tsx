import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  X,
  Zap,
  Settings2,
  Copy,
  Sliders,
  Sparkles,
  Wand2,
  ChevronLeft,
  LayoutDashboard,
  Table2,
  Calendar,
  List,
  GitBranch,
  FileText,
  Kanban,
  Map,
  Bug,
  Lightbulb,
  ListTodo,
  Rocket,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";

type CreationOption = "default" | "customize";
type CustomizeMethod = "duplicate" | "manual" | "ai";
type Step = "initial" | "customize-option" | "tabs-config" | "ai-wizard" | "template-setup";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

interface CreateSpacePageProps {
  onCancel: () => void;
  onSpaceCreated: (spaceName: string) => void;
}

interface Template {
  id: string;
  name: string;
  category: "bug" | "feature" | "task" | "epic" | "custom";
  description: string;
  fieldCount: number;
  color: string;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Bug Report",
    category: "bug",
    description: "Report and track software bugs",
    fieldCount: 12,
    color: "#ef4444",
  },
  {
    id: "2",
    name: "Feature Request",
    category: "feature",
    description: "Submit new feature ideas",
    fieldCount: 11,
    color: "#3b82f6",
  },
  {
    id: "3",
    name: "Sprint Task",
    category: "task",
    description: "Standard sprint task template",
    fieldCount: 8,
    color: "#10b981",
  },
  {
    id: "4",
    name: "Epic Planning",
    category: "epic",
    description: "Large initiatives and epics",
    fieldCount: 15,
    color: "#8b5cf6",
  },
  {
    id: "5",
    name: "User Story",
    category: "task",
    description: "User-centered requirements",
    fieldCount: 9,
    color: "#10b981",
  },
  {
    id: "6",
    name: "Technical Debt",
    category: "bug",
    description: "Track technical improvements",
    fieldCount: 7,
    color: "#ef4444",
  },
  {
    id: "7",
    name: "Client Onboarding",
    category: "custom",
    description: "Streamlined process for new client setup",
    fieldCount: 14,
    color: "#64748b",
  },
  {
    id: "8",
    name: "Design Review",
    category: "custom",
    description: "Template for design feedback and iterations",
    fieldCount: 10,
    color: "#64748b",
  },
];

const templateIcons = {
  bug: Bug,
  feature: Lightbulb,
  task: ListTodo,
  epic: Rocket,
  custom: FileText,
};

const categoryColors = {
  bug: "from-red-500/20 to-red-600/10",
  feature: "from-blue-500/20 to-blue-600/10",
  task: "from-green-500/20 to-green-600/10",
  epic: "from-purple-500/20 to-purple-600/10",
  custom: "from-gray-500/20 to-gray-600/10",
};

const categoryBorderColors = {
  bug: "border-red-500/40",
  feature: "border-blue-500/40",
  task: "border-green-500/40",
  epic: "border-purple-500/40",
  custom: "border-gray-500/40",
};

const categoryBadgeColors = {
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  feature: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  task: "bg-green-500/20 text-green-400 border-green-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  custom: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const categoryLabels = {
  bug: "Bug Reports",
  feature: "Features",
  task: "Tasks",
  epic: "Epics",
  custom: "Custom",
};

const DEFAULT_TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, enabled: true },
  { id: "board", label: "Board", icon: Kanban, enabled: true },
  { id: "table", label: "Table", icon: Table2, enabled: true },
  { id: "calendar", label: "Calendar", icon: Calendar, enabled: true },
  { id: "list", label: "List", icon: List, enabled: true },
  { id: "workflow", label: "Workflow", icon: GitBranch, enabled: true },
  { id: "roadmap", label: "Roadmap", icon: Map, enabled: true },
  { id: "docs", label: "Docs", icon: FileText, enabled: false },
];

export function CreateSpacePage({ onCancel, onSpaceCreated }: CreateSpacePageProps) {
  const [step, setStep] = useState<Step>("initial");
  const [spaceName, setSpaceName] = useState("");
  const [creationOption, setCreationOption] = useState<CreationOption>("default");
  const [customizeMethod, setCustomizeMethod] = useState<CustomizeMethod>("manual");
  const [selectedSpaceToDuplicate, setSelectedSpaceToDuplicate] = useState("");
  const [tabs, setTabs] = useState<TabConfig[]>(DEFAULT_TABS);
  const [aiDescription, setAiDescription] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TabConfig[] | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [spaceNameError, setSpaceNameError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [aiGeneratedTemplates, setAiGeneratedTemplates] = useState<Template[]>([]);

  const enabledTabs = tabs.reduce((acc, tab) => {
    acc[tab.id] = tab.enabled;
    return acc;
  }, {} as Record<string, boolean>);

  const resetState = () => {
    setStep("initial");
    setSpaceName("");
    setCreationOption("default");
    setCustomizeMethod("manual");
    setSelectedSpaceToDuplicate("");
    setTabs(DEFAULT_TABS);
    setAiDescription("");
    setIsAiGenerating(false);
    setAiSuggestions(null);
    setSelectedTemplates([]);
    setSearchQuery("");
    setSelectedCategory("all");
    setSpaceNameError("");
    setIsCreating(false);
    setAiGeneratedTemplates([]);
  };

  const handleCreateSpace = () => {
    setIsCreating(true);

    // Simulate space creation process
    setTimeout(() => {
      if (creationOption === "default") {
        toast.success(`Space "${spaceName}" created with default configuration!`);
      } else if (customizeMethod === "duplicate") {
        toast.success(`Space "${spaceName}" created by duplicating "${selectedSpaceToDuplicate}"!`);
      } else if (customizeMethod === "manual") {
        const enabledTabsList = tabs
          .filter((tab) => tab.enabled)
          .map((tab) => tab.label)
          .join(", ");
        toast.success(`Space "${spaceName}" created with tabs: ${enabledTabsList}`);
      } else if (customizeMethod === "ai") {
        toast.success(`Space "${spaceName}" created with AI-suggested configuration!`);
      }

      onSpaceCreated(spaceName);
      resetState();
    }, 2000);
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
      setSpaceNameError("Please enter a space name");
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
      if (!aiDescription.trim()) {
        toast.error("Please describe your space requirements");
        return;
      }
      
      // Generate AI recommendations
      setIsAiGenerating(true);
      
      // Simulate AI generation with intelligent template selection
      setTimeout(() => {
        const description = aiDescription.toLowerCase();
        
        // Generate tab suggestions
        const suggestions = tabs.map((tab) => ({
          ...tab,
          enabled: Math.random() > 0.3,
        }));
        
        // Intelligent template selection based on description keywords
        const suggestedTemplateIds: string[] = [];
        const generatedTemplates: Template[] = [];
        
        // Check for specific keywords and suggest appropriate templates
        if (description.includes("bug") || description.includes("issue") || description.includes("defect")) {
          suggestedTemplateIds.push("1", "6"); // Bug Report, Technical Debt
        }
        
        if (description.includes("feature") || description.includes("enhancement") || description.includes("improvement")) {
          suggestedTemplateIds.push("2"); // Feature Request
        }
        
        if (description.includes("task") || description.includes("sprint") || description.includes("agile") || description.includes("scrum")) {
          suggestedTemplateIds.push("3", "5"); // Sprint Task, User Story
        }
        
        if (description.includes("epic") || description.includes("initiative") || description.includes("project")) {
          suggestedTemplateIds.push("4"); // Epic Planning
        }
        
        if (description.includes("client") || description.includes("customer") || description.includes("onboard")) {
          suggestedTemplateIds.push("7"); // Client Onboarding
        }
        
        if (description.includes("design") || description.includes("review") || description.includes("feedback")) {
          suggestedTemplateIds.push("8"); // Design Review
        }
        
        // If description mentions creating custom templates
        if (description.includes("custom") || description.includes("specific")) {
          // Generate a custom template based on the description
          const customTemplate: Template = {
            id: `custom-${Date.now()}`,
            name: `${spaceName} Custom Template`,
            category: "custom",
            description: `AI-generated template based on: ${aiDescription.slice(0, 60)}...`,
            fieldCount: Math.floor(Math.random() * 8) + 8, // 8-15 fields
            color: "#64748b",
          };
          generatedTemplates.push(customTemplate);
        }
        
        // If no specific keywords matched, select 2-3 random templates
        if (suggestedTemplateIds.length === 0 && generatedTemplates.length === 0) {
          const shuffled = [...MOCK_TEMPLATES].sort(() => 0.5 - Math.random());
          suggestedTemplateIds.push(...shuffled.slice(0, 2 + Math.floor(Math.random() * 2)).map(t => t.id));
        }
        
        // Remove duplicates
        const uniqueTemplateIds = Array.from(new Set(suggestedTemplateIds));
        
        setAiSuggestions(suggestions);
        setTabs(suggestions);
        setSelectedTemplates(uniqueTemplateIds);
        setAiGeneratedTemplates(generatedTemplates);
        setIsAiGenerating(false);
        toast.success(`AI recommendations generated! ${uniqueTemplateIds.length + generatedTemplates.length} templates selected.`);
        setStep("tabs-config");
      }, 2000);
    }
  };

  const handleNextFromTabs = () => {
    const hasEnabledTabs = tabs.some((tab) => tab.enabled);
    if (!hasEnabledTabs) {
      toast.error("Please enable at least one tab");
      return;
    }
    setStep("template-setup");
  };

  const handleToggleTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab
      )
    );
  };

  const handleAiGenerate = () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your space requirements");
      return;
    }

    setIsAiGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const suggestions = tabs.map((tab) => ({
        ...tab,
        enabled: Math.random() > 0.3,
      }));
      setAiSuggestions(suggestions);
      setTabs(suggestions);
      setIsAiGenerating(false);
      toast.success("AI recommendations generated!");
    }, 2000);
  };

  const handleApplyAiSuggestions = () => {
    if (aiSuggestions) {
      setTabs(aiSuggestions);
      setStep("tabs-config");
    }
  };

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  // Filter templates
  const searchFilter = (template: Template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query)
    );
  };

  // Combine MOCK_TEMPLATES with AI-generated templates
  const allTemplates = [...MOCK_TEMPLATES, ...aiGeneratedTemplates];

  const filteredTemplates = allTemplates.filter((t) => {
    // Hide selected templates from the browse list
    if (selectedTemplates.includes(t.id)) {
      return false;
    }
    if (selectedCategory !== "all" && t.category !== selectedCategory) {
      return false;
    }
    return searchFilter(t);
  });

  const categories = [
    { id: "all", label: "All Templates", count: allTemplates.length },
    { id: "bug", label: "Bug Reports", count: allTemplates.filter(t => t.category === "bug").length },
    { id: "feature", label: "Features", count: allTemplates.filter(t => t.category === "feature").length },
    { id: "task", label: "Tasks", count: allTemplates.filter(t => t.category === "task").length },
    { id: "epic", label: "Epics", count: allTemplates.filter(t => t.category === "epic").length },
    { id: "custom", label: "Custom", count: allTemplates.filter(t => t.category === "custom").length },
  ];

  const getStepTitle = () => {
    switch (step) {
      case "initial":
        return "Create a New Space";
      case "customize-option":
        return "Choose Customization Method";
      case "tabs-config":
        return "Configure Tabs";
      case "ai-wizard":
        return "AI-Assisted Setup";
      case "template-setup":
        return "Template Configuration";
      default:
        return "Create a New Space";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "initial":
        return "Name your space and choose how you'd like to set it up";
      case "customize-option":
        return "Select how you want to customize your space";
      case "tabs-config":
        return "Choose which tabs to enable for your space";
      case "ai-wizard":
        return "Let AI suggest the best configuration for your needs";
      case "template-setup":
        return "Configure templates for your enabled tabs";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative">
            {/* Content Card */}
            <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10 shadow-xl min-w-[420px]">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Animated Icon Stack */}
                <div className="relative w-24 h-24">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5B5FED] border-r-[#7C3AED] animate-spin" />
                  
                  {/* Middle pulsing ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-[#5B5FED]/30 animate-pulse" />
                  
                  {/* Center icon container */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Icon background with subtle gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#5B5FED]/10 to-[#7C3AED]/10 rounded-xl blur-sm" />
                      <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#5B5FED] to-[#7C3AED] rounded-xl">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h3 className="text-xl text-[var(--foreground)]">
                    Creating Your Space
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                    Setting up "{spaceName}" with your configuration...
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5B5FED] animate-pulse" />
                    <span>Configuring workspace structure</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse delay-75" />
                    <span>Setting up tabs and views</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5B5FED] animate-pulse delay-150" />
                    <span>Finalizing configuration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-[var(--border)]/50 bg-[var(--card)]/80 backdrop-blur-xl px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step !== "initial" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl text-[var(--foreground)]">{getStepTitle()}</h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
                  {getStepDescription()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                resetState();
                onCancel();
              }}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-8">
          {/* Step 1: Initial - Space Name & Creation Option */}
          {step === "initial" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Space Name Section */}
              <div className="relative">
                <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B5FED] to-[#7C3AED] shadow-sm">
                        <LayoutDashboard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="space-name" className="text-[var(--foreground)]">
                          Space Name
                        </Label>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Choose a descriptive name for your workspace
                        </p>
                      </div>
                    </div>
                    
                    <Input
                      id="space-name"
                      placeholder="e.g., Marketing Team, Product Development, Design Hub"
                      value={spaceName}
                      onChange={(e) => {
                        setSpaceName(e.target.value);
                        if (spaceNameError) setSpaceNameError("");
                      }}
                      className={`bg-[var(--background)]/80 backdrop-blur-sm border-[var(--border)] text-[var(--foreground)] h-14 px-4 rounded-lg focus:ring-2 transition-all placeholder:text-[var(--muted-foreground)]/50 ${
                        spaceNameError 
                          ? "border-red-500 focus:ring-red-500/50" 
                          : "focus:ring-[#5B5FED]/50 focus:border-[#5B5FED]/50"
                      }`}
                      autoFocus
                    />
                    {spaceNameError && (
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        {spaceNameError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Setup Method Section */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-lg text-[var(--foreground)]">Choose Your Setup Path</h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                    Start with defaults for quick setup, or customize every detail
                  </p>
                </div>

                <RadioGroup
                  value={creationOption}
                  onValueChange={(value: any) => setCreationOption(value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Default Configuration */}
                  <label
                    htmlFor="default"
                    className={`group relative cursor-pointer transition-all duration-300 ${
                      creationOption === "default" ? "scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                  >
                    <div
                      className={`relative h-full rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                        creationOption === "default"
                          ? "border-[#5B5FED] shadow-lg"
                          : "border-[var(--border)] hover:border-[var(--border)]/80 shadow-sm"
                      }`}
                    >
                      {/* Animated Background */}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        creationOption === "default"
                          ? "bg-[#5B5FED]/5"
                          : "bg-transparent"
                      }`} />

                      {/* Content */}
                      <div className="relative p-6 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <RadioGroupItem value="default" id="default" className="mt-1" />
                          <div className={`flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                            creationOption === "default"
                              ? "bg-gradient-to-br from-[#5B5FED] to-[#7C3AED] shadow-lg rotate-0"
                              : "bg-gradient-to-br from-[#5B5FED]/80 to-[#7C3AED]/80 shadow-sm -rotate-6 group-hover:rotate-0"
                          }`}>
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 space-y-2">
                          <h4 className="text-lg text-[var(--foreground)]">
                            Quick Start
                          </h4>
                          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                            Get up and running instantly with our pre-configured setup. Includes essential tabs and templates ready to use.
                          </p>
                        </div>

                        {/* Features List */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "default" ? "bg-[#5B5FED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>Pre-configured tabs & views</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "default" ? "bg-[#5B5FED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>Default templates included</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "default" ? "bg-[#5B5FED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>Ready in seconds</span>
                          </div>
                        </div>

                        {/* Best For Badge */}
                        <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--muted-foreground)]">Best for:</span>
                            <Badge variant="outline" className="text-xs bg-[var(--muted)]/30 text-[var(--foreground)] border-[var(--border)]">
                              First-time users
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Customize Configuration */}
                  <label
                    htmlFor="customize"
                    className={`group relative cursor-pointer transition-all duration-300 ${
                      creationOption === "customize" ? "scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                  >
                    <div
                      className={`relative h-full rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                        creationOption === "customize"
                          ? "border-[#7C3AED] shadow-lg"
                          : "border-[var(--border)] hover:border-[var(--border)]/80 shadow-sm"
                      }`}
                    >
                      {/* Animated Background */}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        creationOption === "customize"
                          ? "bg-[#7C3AED]/5"
                          : "bg-transparent"
                      }`} />

                      {/* Content */}
                      <div className="relative p-6 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <RadioGroupItem value="customize" id="customize" className="mt-1" />
                          <div className={`flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                            creationOption === "customize"
                              ? "bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] shadow-lg rotate-0"
                              : "bg-gradient-to-br from-[#7C3AED]/80 to-[#5B21B6]/80 shadow-sm -rotate-6 group-hover:rotate-0"
                          }`}>
                            <Settings2 className="w-7 h-7 text-white" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 space-y-2">
                          <h4 className="text-lg text-[var(--foreground)]">
                            Full Control
                          </h4>
                          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                            Build your perfect workspace from the ground up. Choose every tab, template, and workflow to match your exact needs.
                          </p>
                        </div>

                        {/* Features List */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "customize" ? "bg-[#7C3AED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>Handpick tabs & features</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "customize" ? "bg-[#7C3AED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>AI-powered recommendations</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              creationOption === "customize" ? "bg-[#7C3AED]" : "bg-[var(--muted-foreground)]/40"
                            }`} />
                            <span>Duplicate existing spaces</span>
                          </div>
                        </div>

                        {/* Best For Badge */}
                        <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--muted-foreground)]">Best for:</span>
                            <Badge variant="outline" className="text-xs bg-[var(--muted)]/30 text-[var(--foreground)] border-[var(--border)]">
                              Advanced users
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Helper Text */}
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)]/70">
                  You can modify your space configuration anytime
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Customize Options */}
          {step === "customize-option" && (
            <div className="space-y-4">
              <RadioGroup
                value={customizeMethod}
                onValueChange={(value: any) => setCustomizeMethod(value)}
                className="space-y-3"
              >
                {/* Duplicate from Existing */}
                <label
                  htmlFor="duplicate"
                  className={`group relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    customizeMethod === "duplicate"
                      ? "border-[#5B5FED] bg-gradient-to-r from-[#5B5FED]/10 to-transparent shadow-md shadow-[#5B5FED]/10"
                      : "border-[var(--border)] bg-[var(--card)]/30 hover:border-[var(--border)]/60 hover:bg-[var(--card)]/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 transition-all group-hover:scale-150" />
                  <RadioGroupItem value="duplicate" id="duplicate" className="relative z-10" />
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 relative z-10">
                    <Copy className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <div className="space-y-1">
                      <span className="text-base text-[var(--foreground)]">
                        Duplicate from Existing Space
                      </span>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Copy configuration from an existing space to save time
                      </p>
                    </div>
                  </div>
                </label>
                
                {customizeMethod === "duplicate" && (
                  <div className="pl-16 pr-5 pb-2">
                    <Select
                      value={selectedSpaceToDuplicate}
                      onValueChange={setSelectedSpaceToDuplicate}
                    >
                      <SelectTrigger className="bg-[var(--background)]/50 backdrop-blur-sm border-[var(--border)] text-[var(--foreground)] h-11 rounded-lg">
                        <SelectValue placeholder="Select a space to duplicate" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border-[var(--border)] rounded-xl">
                        <SelectItem value="marketing" className="text-[var(--foreground)] rounded-lg">
                          Marketing Team
                        </SelectItem>
                        <SelectItem value="development" className="text-[var(--foreground)] rounded-lg">
                          Development
                        </SelectItem>
                        <SelectItem value="design" className="text-[var(--foreground)] rounded-lg">
                          Design Projects
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Manual Configuration */}
                <label
                  htmlFor="manual"
                  className={`group relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    customizeMethod === "manual"
                      ? "border-[#5B5FED] bg-gradient-to-r from-[#5B5FED]/10 to-transparent shadow-md shadow-[#5B5FED]/10"
                      : "border-[var(--border)] bg-[var(--card)]/30 hover:border-[var(--border)]/60 hover:bg-[var(--card)]/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 transition-all group-hover:scale-150" />
                  <RadioGroupItem value="manual" id="manual" className="relative z-10" />
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 relative z-10">
                    <Sliders className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <div className="space-y-1">
                      <span className="text-base text-[var(--foreground)]">
                        Manual Configuration
                      </span>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Manually select tabs and configure templates with full control
                      </p>
                    </div>
                  </div>
                </label>

                {/* AI-Assisted Setup */}
                <label
                  htmlFor="ai"
                  className={`group relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    customizeMethod === "ai"
                      ? "border-[#5B5FED] bg-gradient-to-r from-[#5B5FED]/10 to-transparent shadow-md shadow-[#5B5FED]/10"
                      : "border-[var(--border)] bg-[var(--card)]/30 hover:border-[var(--border)]/60 hover:bg-[var(--card)]/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 transition-all group-hover:scale-150" />
                  <RadioGroupItem value="ai" id="ai" className="relative z-10" />
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-md shadow-pink-500/20 relative z-10">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <div className="space-y-1">
                      <span className="text-base text-[var(--foreground)]">
                        AI-Assisted Setup
                      </span>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Let AI suggest optimal configuration based on your needs
                      </p>
                    </div>
                  </div>
                </label>

                {customizeMethod === "ai" && (
                  <div className="pl-16 pr-5 pb-2 space-y-3">
                    <Textarea
                      id="ai-description"
                      placeholder="E.g., 'A marketing space for managing campaigns, tracking social media, and coordinating with design team...'"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      className="bg-[var(--background)]/50 backdrop-blur-sm border-[var(--border)] text-[var(--foreground)] min-h-[120px] text-base rounded-lg focus:ring-2 focus:ring-[#5B5FED]/50 transition-all"
                      disabled={isAiGenerating}
                    />
                    {isAiGenerating && (
                      <div className="flex items-center gap-2 text-sm text-[#5B5FED]">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>AI is analyzing your requirements...</span>
                      </div>
                    )}
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Tabs Configuration */}
          {step === "tabs-config" && (
            <div className="space-y-6">
              {aiSuggestions && (
                <div className="relative p-5 rounded-xl border border-[#5B5FED]/30 bg-gradient-to-r from-[#5B5FED]/5 to-transparent overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5B5FED]/20 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#5B5FED] to-[#4B4FDD] shadow-lg shadow-[#5B5FED]/30">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[var(--foreground)]">AI Recommendations Applied</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {tabs.filter(t => t.enabled).length} tabs selected based on your requirements
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleToggleTab(tab.id)}
                      className={`group relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        tab.enabled
                          ? "border-[#5B5FED]/50 bg-gradient-to-r from-[#5B5FED]/8 to-transparent hover:from-[#5B5FED]/12"
                          : "border-[var(--border)] bg-[var(--card)]/20 hover:bg-[var(--card)]/40 hover:border-[var(--border)]/80"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                        tab.enabled 
                          ? "bg-gradient-to-br from-[#5B5FED] to-[#4B4FDD] shadow-md shadow-[#5B5FED]/30" 
                          : "bg-[var(--muted)]/40"
                      }`}>
                        <Icon
                          className={`w-5 h-5 transition-all ${
                            tab.enabled ? "text-white" : "text-[var(--muted-foreground)]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`transition-all ${
                          tab.enabled
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)]"
                        }`}>
                          {tab.label}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {tab.id === "overview" && "Dashboard and analytics for your space"}
                          {tab.id === "board" && "Kanban-style board for visual task management"}
                          {tab.id === "table" && "Spreadsheet view with advanced filtering"}
                          {tab.id === "calendar" && "Schedule and timeline visualization"}
                          {tab.id === "list" && "Simple list view for tasks"}
                          {tab.id === "workflow" && "Custom workflows and automation"}
                          {tab.id === "roadmap" && "Strategic planning and milestones"}
                          {tab.id === "docs" && "Documentation and knowledge base"}
                        </div>
                      </div>
                      <Switch
                        checked={tab.enabled}
                        onCheckedChange={() => handleToggleTab(tab.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#5B5FED]" />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {tabs.filter(t => t.enabled).length} of {tabs.length} tabs enabled
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allEnabled = tabs.every(t => t.enabled);
                    setTabs(tabs.map(t => ({ ...t, enabled: !allEnabled })));
                  }}
                  className="text-[#5B5FED] hover:text-[#4B4FDD] hover:bg-[#5B5FED]/10 h-8 text-xs"
                >
                  {tabs.every(t => t.enabled) ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: AI Wizard */}
          {step === "ai-wizard" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="ai-description" className="text-[var(--foreground)] text-base">
                  Describe Your Space
                </Label>
                <Textarea
                  id="ai-description"
                  placeholder="E.g., 'A marketing space for managing campaigns, tracking social media, and coordinating with design team...'"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="bg-[var(--card)]/50 backdrop-blur-sm border-[var(--border)] text-[var(--foreground)] min-h-[140px] text-base rounded-xl focus:ring-2 focus:ring-[#5B5FED]/50 transition-all"
                  disabled={isAiGenerating}
                />
              </div>

              {aiSuggestions && (
                <div className="relative p-6 rounded-2xl border-2 border-[#5B5FED]/30 bg-gradient-to-br from-[#5B5FED]/10 via-[#5B5FED]/5 to-transparent overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#5B5FED]/30 to-transparent rounded-full blur-3xl -translate-y-20 translate-x-20" />
                  <div className="relative space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B5FED] to-[#4B4FDD] shadow-lg shadow-[#5B5FED]/30">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[var(--foreground)] text-lg">AI Recommendations</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          Based on your description, we recommend:
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions
                        .filter((tab) => tab.enabled)
                        .map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <span
                              key={tab.id}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--card)]/80 backdrop-blur-sm border border-[#5B5FED]/20 text-[var(--foreground)] rounded-xl"
                            >
                              <Icon className="w-4 h-4 text-[#5B5FED]" />
                              {tab.label}
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
                className="w-full bg-gradient-to-r from-[#5B5FED] to-[#7C3AED] hover:from-[#4B4FDD] hover:to-[#6C2BD9] text-white h-14 rounded-xl text-base shadow-lg shadow-[#5B5FED]/20 transition-all"
              >
                {isAiGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 5: Template Setup */}
          {step === "template-setup" && (
            <div className="space-y-6">
              {/* Selected Templates List - Only show when templates are selected */}
              {selectedTemplates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[var(--foreground)]">Selected Templates</h3>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} will be added to your space
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplates([])}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {selectedTemplates.map((templateId) => {
                      const template = allTemplates.find((t) => t.id === templateId);
                      if (!template) return null;
                      
                      const IconComponent = templateIcons[template.category];

                      return (
                        <div
                          key={template.id}
                          className="group relative flex items-center gap-3 p-2.5 rounded-lg border border-[#5B5FED]/30 bg-gradient-to-r from-[#5B5FED]/5 to-transparent overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#5B5FED]/10 to-transparent rounded-full blur-2xl -translate-y-12 translate-x-12" />
                          
                          <div
                            className={`relative p-1.5 rounded-lg bg-gradient-to-br ${categoryColors[template.category]} border ${categoryBorderColors[template.category]} flex-shrink-0`}
                          >
                            <IconComponent
                              className="w-4 h-4"
                              style={{ color: template.color }}
                            />
                          </div>

                          <div className="relative flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[var(--foreground)] truncate">
                                {template.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${categoryBadgeColors[template.category]}`}
                              >
                                {categoryLabels[template.category]}
                              </Badge>
                              {template.id.startsWith('custom-') && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-[#5B5FED]/20 text-[#5B5FED] border-[#5B5FED]/30"
                                >
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="relative flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                              <FileText className="w-3 h-3" />
                              <span>{template.fieldCount}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleTemplate(template.id)}
                              className="h-6 w-6 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider - Only show when templates are selected */}
              {selectedTemplates.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-[var(--muted-foreground)] bg-[var(--background)]">
                      Browse Templates
                    </span>
                  </div>
                </div>
              )}

              {/* Search and Filter Section */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[var(--card)]/50 backdrop-blur-sm border-[var(--border)] text-[var(--foreground)] h-11 rounded-xl focus:ring-2 focus:ring-[#5B5FED]/50"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all flex-shrink-0 ${
                        selectedCategory === cat.id
                          ? "bg-[#5B5FED] text-white shadow-md shadow-[#5B5FED]/20"
                          : "bg-[var(--card)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          selectedCategory === cat.id
                            ? "bg-white/20"
                            : "bg-[var(--muted)]"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const IconComponent = templateIcons[template.category];
                    const isSelected = selectedTemplates.includes(template.id);

                    return (
                      <div
                        key={template.id}
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`group relative bg-[var(--card)] border-2 rounded-xl p-4 cursor-pointer transition-all overflow-hidden ${
                          isSelected
                            ? "border-[#5B5FED] shadow-lg shadow-[#5B5FED]/20"
                            : "border-[var(--border)] hover:border-[var(--border)]/60"
                        }`}
                      >
                        {/* Background Gradient */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${categoryColors[template.category]} transition-opacity ${
                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                          }`}
                        />

                        {/* Content */}
                        <div className="relative space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`p-2.5 rounded-xl bg-gradient-to-br ${categoryColors[template.category]} border ${categoryBorderColors[template.category]} flex-shrink-0`}
                              >
                                <IconComponent
                                  className="w-5 h-5"
                                  style={{ color: template.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[var(--foreground)] truncate">
                                  {template.name}
                                </h4>
                              </div>
                            </div>

                            {/* Selection Indicator */}
                            <div
                              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                                isSelected
                                  ? "bg-[#5B5FED] border-[#5B5FED]"
                                  : "border-[var(--border)] group-hover:border-[#5B5FED]/50"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Badge */}
                          <Badge
                            variant="outline"
                            className={`text-xs ${categoryBadgeColors[template.category]}`}
                          >
                            {categoryLabels[template.category]}
                          </Badge>

                          {/* Description */}
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                            {template.description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{template.fieldCount} fields</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <h3 className="text-[var(--foreground)] mb-2">No templates found</h3>
                    <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm">
                      Try adjusting your search or filter to find the templates you need.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
          {step === "initial" ? (
            <Button
              variant="ghost"
              onClick={() => {
                resetState();
                onCancel();
              }}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

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

          {step === "ai-wizard" && aiSuggestions && (
            <Button
              onClick={handleApplyAiSuggestions}
              className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            >
              Apply Recommendations
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}