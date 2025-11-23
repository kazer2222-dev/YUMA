import { useState } from "react";
import {
  Plus,
  MoreVertical,
  GripVertical,
  Trash2,
  X,
  Bug,
  Lightbulb,
  ListTodo,
  Rocket,
  FileText,
  Zap,
  Star,
  Copy,
  Eye,
  Sparkles,
  User,
  Search,
  Bot,
  Loader2,
  Settings,
  CalendarIcon,
  Clock,
  ShieldCheck,
  Info,
  ArrowLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { WorkflowEditor } from "./workflow-editor";
import { WorkflowPage } from "./workflow-page";
import { toast } from "sonner@2.0.3";

interface Template {
  id: string;
  name: string;
  fieldCount: number;
  updatedDate: string;
  category: "bug" | "feature" | "task" | "epic" | "custom";
  color: string;
  icon: string;
  description?: string;
  createdDate: string;
  isCustom?: boolean;
  author?: string;
  workflow?: "default" | "custom";
}

interface TemplateField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string;
  icon?: string;
}

interface ClickUpTemplatesProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  standalone?: boolean;
  onSuccess?: () => void;
}

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

// Mock data for template fields based on category
const getTemplateFieldsForCategory = (
  category: string,
): TemplateField[] => {
  const commonFields = [
    {
      id: "1",
      name: "Task Summary",
      type: "Multi-line Text",
      required: true,
      description: "Required",
    },
    {
      id: "2",
      name: "Priority Level",
      type: "Select List Single Choice",
      required: true,
      description: "Required",
    },
    {
      id: "3",
      name: "Due Date",
      type: "Date Picker",
      required: false,
      description: "Target completion date",
    },
    {
      id: "4",
      name: "Assignee",
      type: "User Picker Field",
      required: false,
      description: "Responsible person",
    },
  ];

  if (category === "bug") {
    return [
      ...commonFields,
      {
        id: "5",
        name: "Steps to Reproduce",
        type: "Multi-line Text",
        required: true,
        description: "How to reproduce the issue",
      },
      {
        id: "6",
        name: "Severity",
        type: "Select List Single Choice",
        required: true,
        description: "Critical, High, Medium, Low",
      },
      {
        id: "7",
        name: "Environment",
        type: "Multi-line Text",
        required: false,
        description: "Browser, OS, etc.",
      },
    ];
  } else if (category === "feature") {
    return [
      ...commonFields,
      {
        id: "5",
        name: "User Story",
        type: "Multi-line Text",
        required: true,
        description:
          "As a [role], I want [feature] so that [benefit]",
      },
      {
        id: "6",
        name: "Acceptance Criteria",
        type: "Checkbox List",
        required: true,
        description: "Definition of done",
      },
    ];
  } else if (category === "epic") {
    return [
      ...commonFields,
      {
        id: "5",
        name: "Epic Goal",
        type: "Multi-line Text",
        required: true,
        description: "High-level objective",
      },
      {
        id: "6",
        name: "Success Metrics",
        type: "Multi-line Text",
        required: false,
        description: "How to measure success",
      },
      {
        id: "7",
        name: "Linked Stories",
        type: "Multi-line Text",
        required: false,
        description: "Related user stories",
      },
    ];
  }

  return [
    ...commonFields,
    {
      id: "5",
      name: "Story Points",
      type: "Number Field",
      required: false,
      description: "Effort estimation",
    },
    {
      id: "6",
      name: "Labels",
      type: "Labels",
      required: false,
      description: "Categorization tags",
    },
  ];
};

export function ClickUpTemplates({
  open = false,
  onOpenChange,
  standalone = false,
  onSuccess,
}: ClickUpTemplatesProps) {
  const [currentView, setCurrentView] = useState<
    | "activeTemplates"
    | "list"
    | "create"
    | "workflow"
    | "workflowList"
  >("activeTemplates");
  const [activeTemplateIds, setActiveTemplateIds] = useState<
    string[]
  >(["1", "2", "3"]); // Templates active in the current space
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] =
    useState("");
  const [templateCategory, setTemplateCategory] = useState<
    "bug" | "feature" | "task" | "epic" | "custom"
  >("custom");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFieldDialog, setShowAddFieldDialog] =
    useState(false);
  const [fieldConfig, setFieldConfig] = useState({
    type: "",
    label: "",
    required: false,
    defaultValue: "",
    helpText: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState({
    hours: "12",
    minutes: "00",
  });
  const [listValues, setListValues] = useState<string[]>([]);
  const [currentListValue, setCurrentListValue] = useState("");
  const [fieldTitleError, setFieldTitleError] = useState(false);

  // Multi-step creation state
  const [creationStep, setCreationStep] = useState<
    "basics" | "fields" | "workflow"
  >("basics");
  const [selectedWorkflow, setSelectedWorkflow] = useState<
    "default" | "custom" | "bug-tracking" | "feature-dev" | null
  >("default");
  const [editingTemplateId, setEditingTemplateId] = useState<
    string | null
  >(null);

  // Delete confirmation state
  const [templateToDelete, setTemplateToDelete] =
    useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  // Enhanced mock data with more templates
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Bug Report",
      fieldCount: 12,
      updatedDate: "11/9/2025",
      category: "bug",
      color: "#ef4444",
      icon: "bug",
      description: "Report and track software bugs",
      createdDate: "10/15/2024",
      isCustom: false,
      workflow: "default",
    },
    {
      id: "2",
      name: "Feature Request",
      fieldCount: 11,
      updatedDate: "11/8/2025",
      category: "feature",
      color: "#3b82f6",
      icon: "lightbulb",
      description: "Submit new feature ideas",
      createdDate: "09/22/2024",
      isCustom: false,
      workflow: "default",
    },
    {
      id: "3",
      name: "Sprint Task",
      fieldCount: 8,
      updatedDate: "11/7/2025",
      category: "task",
      color: "#10b981",
      icon: "task",
      description: "Standard sprint task template",
      createdDate: "08/10/2024",
      isCustom: false,
      workflow: "default",
    },
    {
      id: "4",
      name: "Epic Planning",
      fieldCount: 15,
      updatedDate: "11/9/2025",
      category: "epic",
      color: "#8b5cf6",
      icon: "epic",
      description: "Large initiatives and epics",
      createdDate: "11/01/2024",
      isCustom: false,
      workflow: "custom",
    },
    {
      id: "5",
      name: "User Story",
      fieldCount: 9,
      updatedDate: "11/6/2025",
      category: "task",
      color: "#10b981",
      icon: "task",
      description: "User-centered requirements",
      createdDate: "07/18/2024",
      isCustom: false,
      workflow: "default",
    },
    {
      id: "6",
      name: "Technical Debt",
      fieldCount: 7,
      updatedDate: "11/5/2025",
      category: "bug",
      color: "#ef4444",
      icon: "bug",
      description: "Track technical improvements",
      createdDate: "06/30/2024",
      isCustom: false,
      workflow: "default",
    },
    // Custom Templates
    {
      id: "7",
      name: "Client Onboarding",
      fieldCount: 14,
      updatedDate: "11/8/2025",
      category: "custom",
      color: "#64748b",
      icon: "custom",
      description: "Streamlined process for new client setup",
      createdDate: "11/01/2025",
      isCustom: true,
      author: "Sarah Chen",
      workflow: "custom",
    },
    {
      id: "8",
      name: "Design Review",
      fieldCount: 10,
      updatedDate: "11/7/2025",
      category: "custom",
      color: "#64748b",
      icon: "custom",
      description:
        "Template for design feedback and iterations",
      createdDate: "10/28/2025",
      isCustom: true,
      author: "Marcus Rodriguez",
      workflow: "default",
    },
    {
      id: "9",
      name: "Security Audit",
      fieldCount: 18,
      updatedDate: "11/9/2025",
      category: "custom",
      color: "#64748b",
      icon: "custom",
      description:
        "Comprehensive security assessment checklist",
      createdDate: "10/20/2025",
      isCustom: true,
      author: "Alex Thompson",
      workflow: "custom",
    },
    {
      id: "10",
      name: "Release Checklist",
      fieldCount: 12,
      updatedDate: "11/6/2025",
      category: "custom",
      color: "#64748b",
      icon: "custom",
      description:
        "Pre-release verification and deployment steps",
      createdDate: "10/15/2025",
      isCustom: true,
      author: "Jamie Park",
      workflow: "default",
    },
    {
      id: "11",
      name: "Team Retrospective",
      fieldCount: 8,
      updatedDate: "11/5/2025",
      category: "custom",
      color: "#64748b",
      icon: "custom",
      description: "Sprint retrospective discussion points",
      createdDate: "10/10/2025",
      isCustom: true,
      author: "Sarah Chen",
      workflow: "default",
    },
  ]);

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Template fields
  const [templateFields, setTemplateFields] = useState<
    TemplateField[]
  >([]);

  const handleOpenTemplate = (template: Template) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateCategory(template.category);
    setSelectedWorkflow(template.workflow || "default");
    setTemplateFields(
      getTemplateFieldsForCategory(template.category),
    );
    setCreationStep("workflow"); // Go directly to workflow selection for existing templates
    setCurrentView("create");
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateDescription("");
    setTemplateCategory("custom");
    setSelectedWorkflow(null);
    setTemplateFields([
      {
        id: "1",
        name: "Task Summary",
        type: "Multi-line Text",
        required: true,
        description: "Required",
      },
    ]);
    setCreationStep("fields");
    setCurrentView("create");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setCreationStep("fields");
    setEditingTemplateId(null);
    setAiPrompt("");
  };

  const handleFinalizeTemplate = () => {
    if (!selectedWorkflow) return;

    console.log(
      editingTemplateId
        ? "Updating template:"
        : "Creating template:",
      {
        id: editingTemplateId,
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        fields: templateFields,
        workflow: selectedWorkflow,
      },
    );

    // Show success message
    toast.success(
      editingTemplateId
        ? "Template updated successfully!"
        : "Template created successfully!",
      {
        description: `Your template "${templateName || "New Template"}" is ready to use.`,
      },
    );

    // Call success callback to navigate to board FIRST
    if (onSuccess) {
      onSuccess();
    }

    // Close dialog after a small delay to ensure state update completes
    setTimeout(() => {
      if (onOpenChange) {
        onOpenChange(false);
      }
      handleBackToList();
    }, 50);
  };

  const handleDeleteField = (fieldId: string) => {
    setTemplateFields(
      templateFields.filter((f) => f.id !== fieldId),
    );
  };

  const handleAddField = () => {
    if (!fieldConfig.label.trim()) {
      setFieldTitleError(true);
      return;
    }
    if (!fieldConfig.type) return;

    const newField: TemplateField = {
      id: Date.now().toString(),
      name: fieldConfig.label,
      type: fieldConfig.type,
      required: fieldConfig.required,
      description:
        fieldConfig.helpText ||
        (fieldConfig.required ? "Required" : ""),
    };

    setTemplateFields([...templateFields, newField]);

    // Reset form
    setFieldConfig({
      type: "",
      label: "",
      required: false,
      defaultValue: "",
      helpText: "",
    });
    setSelectedDate(undefined);
    setSelectedTime({ hours: "12", minutes: "00" });
    setListValues([]);
    setCurrentListValue("");
    setFieldTitleError(false);
    setShowAddFieldDialog(false);
  };

  const fieldTypes = [
    { value: "Multi-line Text", label: "Multi-line Text" },
    { value: "Single-line Text", label: "Single-line Text" },
    { value: "Number Field", label: "Number Field" },
    { value: "Date Picker", label: "Date Picker" },
    { value: "Date Time Picker", label: "Date Time Picker" },
    {
      value: "Select List Single Choice",
      label: "Select List Single Choice",
    },
    {
      value: "Select List Multiple Choice",
      label: "Select List Multiple Choice",
    },
    { value: "Radio Button", label: "Radio Button" },
    { value: "Checkbox List", label: "Checkbox List" },
    { value: "User Picker Field", label: "User Picker Field" },
    { value: "Labels", label: "Labels" },
    { value: "File Attachment", label: "File Attachment" },
    { value: "URL Field", label: "URL Field" },
    { value: "Email Field", label: "Email Field" },
  ];

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI-generated fields based on common keywords in the prompt
    const prompt = aiPrompt.toLowerCase();
    const generatedFields: TemplateField[] = [
      {
        id: Date.now().toString(),
        name: "Task Summary",
        type: "Multi-line Text",
        required: true,
        description: "Required",
      },
    ];

    // Add fields based on prompt content
    if (prompt.includes("bug") || prompt.includes("issue")) {
      generatedFields.push({
        id: (Date.now() + 1).toString(),
        name: "Steps to Reproduce",
        type: "Multi-line Text",
        required: true,
        description: "How to reproduce the issue",
      });
      generatedFields.push({
        id: (Date.now() + 2).toString(),
        name: "Severity",
        type: "Select List Single Choice",
        required: true,
        description: "Critical, High, Medium, Low",
      });
      generatedFields.push({
        id: (Date.now() + 3).toString(),
        name: "Environment",
        type: "Multi-line Text",
        required: false,
        description: "Browser, OS, etc.",
      });
    }

    if (
      prompt.includes("feature") ||
      prompt.includes("enhancement")
    ) {
      generatedFields.push({
        id: (Date.now() + 4).toString(),
        name: "User Story",
        type: "Multi-line Text",
        required: true,
        description:
          "As a [role], I want [feature] so that [benefit]",
      });
      generatedFields.push({
        id: (Date.now() + 5).toString(),
        name: "Acceptance Criteria",
        type: "Checkbox List",
        required: true,
        description: "Definition of done",
      });
    }

    if (
      prompt.includes("sprint") ||
      prompt.includes("agile") ||
      prompt.includes("scrum")
    ) {
      generatedFields.push({
        id: (Date.now() + 6).toString(),
        name: "Story Points",
        type: "Number Field",
        required: false,
        description: "Effort estimation",
      });
      generatedFields.push({
        id: (Date.now() + 7).toString(),
        name: "Sprint",
        type: "Select List Single Choice",
        required: false,
        description: "Sprint assignment",
      });
    }

    if (
      prompt.includes("design") ||
      prompt.includes("ui") ||
      prompt.includes("mockup")
    ) {
      generatedFields.push({
        id: (Date.now() + 8).toString(),
        name: "Design Files",
        type: "File Attachment",
        required: false,
        description: "Figma, Sketch, or other design files",
      });
      generatedFields.push({
        id: (Date.now() + 9).toString(),
        name: "Design Review Status",
        type: "Select List Single Choice",
        required: false,
        description: "Pending, In Review, Approved",
      });
    }

    // Always add common fields
    generatedFields.push(
      {
        id: (Date.now() + 10).toString(),
        name: "Priority",
        type: "Select List Single Choice",
        required: true,
        description: "Urgent, High, Normal, Low",
      },
      {
        id: (Date.now() + 11).toString(),
        name: "Assignee",
        type: "User Picker Field",
        required: false,
        description: "Responsible person",
      },
      {
        id: (Date.now() + 12).toString(),
        name: "Due Date",
        type: "Date Picker",
        required: false,
        description: "Target completion date",
      },
      {
        id: (Date.now() + 13).toString(),
        name: "Labels",
        type: "Labels",
        required: false,
        description: "Categorization tags",
      },
    );

    setTemplateFields(generatedFields);

    // Auto-generate template name if not set
    if (!templateName.trim()) {
      const name = aiPrompt.split(" ").slice(0, 4).join(" ");
      setTemplateName(
        name.charAt(0).toUpperCase() + name.slice(1),
      );
    }

    setIsGenerating(false);
    setAiPrompt("");
  };

  const systemTemplates = templates.filter((t) => !t.isCustom);
  const customTemplates = templates.filter((t) => t.isCustom);

  // Apply search filter
  const searchFilter = (template: Template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      false
    );
  };

  const filteredSystemTemplates = systemTemplates
    .filter(
      (t) =>
        selectedCategory === "all" ||
        selectedCategory === "custom" ||
        t.category === selectedCategory,
    )
    .filter(searchFilter);

  const filteredCustomTemplates = (
    selectedCategory === "all" || selectedCategory === "custom"
      ? customTemplates
      : []
  ).filter(searchFilter);

  const categories = [
    {
      id: "all",
      label: "All Templates",
      count: templates.length,
    },
    {
      id: "bug",
      label: "Bug Reports",
      count: systemTemplates.filter((t) => t.category === "bug")
        .length,
    },
    {
      id: "feature",
      label: "Features",
      count: systemTemplates.filter(
        (t) => t.category === "feature",
      ).length,
    },
    {
      id: "task",
      label: "Tasks",
      count: systemTemplates.filter(
        (t) => t.category === "task",
      ).length,
    },
    {
      id: "epic",
      label: "Epics",
      count: systemTemplates.filter(
        (t) => t.category === "epic",
      ).length,
    },
    {
      id: "custom",
      label: "Custom",
      count: customTemplates.length,
    },
  ];

  // Render active templates view (Space templates)
  const renderActiveTemplatesView = () => {
    return (
      <>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-[#4353ff]" />
                <h2 className="text-[var(--foreground)] m-0">
                  Space Templates
                </h2>
                <Button
                  onClick={() => setCurrentView("list")}
                  className="group relative gap-2 h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-xs shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all duration-300 ml-auto overflow-hidden border border-[#4353ff]/50 hover:border-[#4353ff]/70"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Plus className="relative w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative">Add Template</span>
                </Button>
              </div>
              <p className="text-[var(--muted-foreground)] text-xs leading-relaxed m-0">
                Manage templates in this space. Toggle templates
                on or off to control availability.
              </p>
            </div>
            {!standalone && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange?.(false)}
                className="h-7 w-7 p-0 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)]/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-[var(--foreground)] mb-2">
                No Templates
              </h3>
              <p className="text-[var(--muted-foreground)] text-sm text-center max-w-sm mb-4">
                This space doesn't have any templates yet. Add
                templates to streamline task creation.
              </p>
              <Button
                onClick={() => setCurrentView("list")}
                className="h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {templates.map((template) => {
                const Icon = templateIcons[template.category];
                const isActive = activeTemplateIds.includes(
                  template.id,
                );

                return (
                  <div
                    key={template.id}
                    className={`group relative bg-[var(--card)] rounded-lg border transition-all duration-200 p-4 ${
                      isActive
                        ? "border-[var(--border)] hover:border-[#4353ff]/50"
                        : "border-[var(--border)]/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[template.category]} ${categoryBorderColors[template.category]} border flex items-center justify-center`}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: template.color }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[var(--foreground)] text-sm m-0">
                              {template.name}
                            </h3>
                            <Badge
                              className={`h-5 px-1.5 text-[10px] ${categoryBadgeColors[template.category]}`}
                            >
                              {
                                categoryLabels[
                                  template.category
                                ]
                              }
                            </Badge>
                            {isActive && (
                              <Badge className="h-5 px-1.5 text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-[var(--muted-foreground)] text-xs mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {template.fieldCount} fields
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {template.updatedDate}
                          </span>
                          {template.workflow && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {template.workflow === "default"
                                ? "Default"
                                : "Custom"}{" "}
                              workflow
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Toggle and Delete */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`template-toggle-${template.id}`}
                            className="text-xs text-[var(--muted-foreground)] cursor-pointer"
                          >
                            {isActive ? "Active" : "Inactive"}
                          </Label>
                          <Switch
                            id={`template-toggle-${template.id}`}
                            checked={isActive}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setActiveTemplateIds((prev) => [
                                  ...prev,
                                  template.id,
                                ]);
                                toast.success(
                                  `${template.name} activated`,
                                );
                              } else {
                                setActiveTemplateIds((prev) =>
                                  prev.filter(
                                    (id) => id !== template.id,
                                  ),
                                );
                                toast.success(
                                  `${template.name} deactivated`,
                                );
                              }
                            }}
                          />
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTemplateToDelete(template);
                                  setShowDeleteDialog(true);
                                }}
                                className="h-8 w-8 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] text-xs"
                            >
                              Delete from space
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  // Render template list view
  const renderTemplateList = () => (
    <>
      {/* Header with Back Button and Gradient */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("activeTemplates")}
            className="h-8 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Active Templates</span>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-[#4353ff]" />
              <h2 className="text-[var(--foreground)] m-0">
                Template Library
              </h2>
              <Button
                onClick={handleCreateNewTemplate}
                className="group relative gap-2 h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-xs shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all duration-300 ml-auto overflow-hidden border border-[#4353ff]/50 hover:border-[#4353ff]/70"
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Icon with rotation animation */}
                <div className="relative">
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Text */}
                <span className="relative hidden sm:inline">
                  Create New Template
                </span>
                <span className="relative sm:hidden">
                  Create
                </span>

                {/* Plus icon */}
                <Plus className="relative w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
            <p className="text-[var(--muted-foreground)] text-xs leading-relaxed m-0">
              Streamline task creation with pre-configured
              templates. Choose from our library or create
              custom templates tailored to your workflow.
            </p>
          </div>
          {!standalone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange?.(false)}
              className="h-7 w-7 p-0 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Search Field */}
        <div className="mt-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff] h-9 text-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-[#4353ff] text-white shadow-lg shadow-[#4353ff]/20"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
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

        {/* System Templates Section */}
        {selectedCategory !== "custom" &&
          (filteredSystemTemplates.length > 0 ||
            filteredCustomTemplates.length === 0) && (
            <div className="mb-6">
              {filteredSystemTemplates.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[var(--foreground)] text-sm mb-1">
                      System Templates
                    </h3>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {filteredSystemTemplates.length} template
                      {filteredSystemTemplates.length !== 1
                        ? "s"
                        : ""}{" "}
                      {selectedCategory !== "all" &&
                        selectedCategory !== "custom" &&
                        "in this category"}
                    </div>
                  </div>
                </div>
              )}

              {/* System Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSystemTemplates.map((template) => {
                  const IconComponent =
                    templateIcons[template.category];

                  return (
                    <div
                      key={template.id}
                      className="relative group bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 hover:border-[#4353ff]/50 transition-all cursor-pointer overflow-hidden"
                      onClick={() =>
                        handleOpenTemplate(template)
                      }
                    >
                      {/* Background Gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${categoryColors[template.category]} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />

                      {/* Content */}
                      <div className="relative">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[template.category]} border ${categoryBorderColors[template.category]} flex-shrink-0`}
                            >
                              <IconComponent
                                className="w-4 h-4"
                                style={{
                                  color: template.color,
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[var(--foreground)] text-sm mb-1 truncate">
                                {template.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 ${categoryBadgeColors[template.category]}`}
                              >
                                {
                                  categoryLabels[
                                    template.category
                                  ]
                                }
                              </Badge>
                            </div>
                          </div>

                          {/* Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[var(--card)] border-[var(--border)] w-48"
                            >
                              {!activeTemplateIds.includes(
                                template.id,
                              ) ? (
                                <DropdownMenuItem
                                  className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTemplateIds(
                                      (prev) => [
                                        ...prev,
                                        template.id,
                                      ],
                                    );
                                    toast.success(
                                      `${template.name} added to space`,
                                    );
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add to Space
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="cursor-pointer text-green-400 hover:bg-[var(--muted)] gap-2"
                                  disabled
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Active in Space
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTemplate(template);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Template
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2">
                                <Copy className="w-3.5 h-3.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[var(--border)]" />
                              <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-[var(--muted)] gap-2">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Description */}
                        {template.description && (
                          <p className="text-xs text-[var(--muted-foreground)] mb-3 line-clamp-2">
                            {template.description}
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {template.fieldCount} fields
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {template.updatedDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State - Only show when BOTH system and custom are empty */}
              {filteredSystemTemplates.length === 0 &&
                filteredCustomTemplates.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-3">
                      {searchQuery ? (
                        <Search className="w-7 h-7 text-[#4353ff]" />
                      ) : (
                        <FileText className="w-7 h-7 text-[#4353ff]" />
                      )}
                    </div>
                    <p className="text-[var(--muted-foreground)] text-sm mb-2">
                      {searchQuery
                        ? `No templates found for "${searchQuery}"`
                        : "No templates in this category"}
                    </p>
                    {searchQuery && (
                      <p className="text-[var(--muted-foreground)] text-xs">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}

        {/* Custom Templates Section */}
        {(selectedCategory === "all" ||
          selectedCategory === "custom") &&
          (filteredCustomTemplates.length > 0 ||
            filteredSystemTemplates.length === 0) && (
            <div>
              {filteredCustomTemplates.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-[var(--foreground)] text-sm mb-1">
                    Custom Templates
                  </h3>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {filteredCustomTemplates.length}{" "}
                    user-created template
                    {filteredCustomTemplates.length !== 1
                      ? "s"
                      : ""}
                  </div>
                </div>
              )}

              {/* Custom Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCustomTemplates.map((template) => {
                  const IconComponent =
                    templateIcons[template.category];

                  return (
                    <div
                      key={template.id}
                      className="relative group bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 hover:border-[#4353ff]/50 transition-all cursor-pointer overflow-hidden"
                      onClick={() =>
                        handleOpenTemplate(template)
                      }
                    >
                      {/* Background Gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${categoryColors[template.category]} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />

                      {/* Content */}
                      <div className="relative">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[template.category]} border ${categoryBorderColors[template.category]} flex-shrink-0`}
                            >
                              <IconComponent
                                className="w-4 h-4"
                                style={{
                                  color: template.color,
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm mb-1 truncate">
                                {template.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 ${categoryBadgeColors[template.category]}`}
                              >
                                {
                                  categoryLabels[
                                    template.category
                                  ]
                                }
                              </Badge>
                            </div>
                          </div>

                          {/* Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[var(--card)] border-[var(--border)] w-48"
                            >
                              {!activeTemplateIds.includes(
                                template.id,
                              ) ? (
                                <DropdownMenuItem
                                  className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTemplateIds(
                                      (prev) => [
                                        ...prev,
                                        template.id,
                                      ],
                                    );
                                    toast.success(
                                      `${template.name} added to space`,
                                    );
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add to Space
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="cursor-pointer text-green-400 hover:bg-[var(--muted)] gap-2"
                                  disabled
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Active in Space
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTemplate(template);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Edit Template
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-[var(--foreground)] hover:bg-[var(--muted)] gap-2">
                                <Copy className="w-3.5 h-3.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[var(--border)]" />
                              <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-[var(--muted)] gap-2">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Description */}
                        {template.description && (
                          <p className="text-xs text-[var(--muted-foreground)] mb-3 line-clamp-2">
                            {template.description}
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] max-w-[60%]">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {template.author}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] text-xs"
                              >
                                {template.author}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {template.fieldCount} fields
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State - Only show when BOTH system and custom are empty */}
              {filteredCustomTemplates.length === 0 &&
                filteredSystemTemplates.length === 0 &&
                selectedCategory === "custom" && (
                  <div className="text-center py-8 px-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-3">
                      {searchQuery ? (
                        <Search className="w-7 h-7 text-[#4353ff]" />
                      ) : (
                        <FileText className="w-7 h-7 text-[#4353ff]" />
                      )}
                    </div>
                    <p className="text-[var(--muted-foreground)] text-sm mb-2">
                      {searchQuery
                        ? `No templates found for "${searchQuery}"`
                        : "No custom templates yet"}
                    </p>
                    {searchQuery ? (
                      <p className="text-[var(--muted-foreground)] text-xs">
                        Try adjusting your search terms
                      </p>
                    ) : (
                      <p className="text-[var(--muted-foreground)] text-xs">
                        Create your first custom template using
                        the button above
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}
      </div>
    </>
  );

  // Render multi-step creation/edit view
  const renderStepBasics = () => (
    <div className="space-y-4">
      {/* Template Name */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground)] text-sm">
          Template Name <span className="text-red-400">*</span>
        </Label>
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g., Sprint Task, Bug Report, Feature Request"
          className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-2 focus:ring-[#4353ff]/30"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground)] text-sm">
          Description
        </Label>
        <Textarea
          value={templateDescription}
          onChange={(e) =>
            setTemplateDescription(e.target.value)
          }
          placeholder="Brief description of what this template is for..."
          className="min-h-[80px] bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-2 focus:ring-[#4353ff]/30 resize-none"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground)] text-sm">
          Category
        </Label>
        <Select
          value={templateCategory}
          onValueChange={(value: any) =>
            setTemplateCategory(value)
          }
        >
          <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--card)] border-[var(--border)]">
            <SelectItem
              value="bug"
              className="text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-400" />
                Bug Reports
              </div>
            </SelectItem>
            <SelectItem
              value="feature"
              className="text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                Features
              </div>
            </SelectItem>
            <SelectItem
              value="task"
              className="text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-green-400" />
                Tasks
              </div>
            </SelectItem>
            <SelectItem
              value="epic"
              className="text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-400" />
                Epics
              </div>
            </SelectItem>
            <SelectItem
              value="custom"
              className="text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Custom
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Generation Section - Only for new templates */}
      {!editingTemplateId && (
        <div className="relative p-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4353ff]/20 border border-[#4353ff]/30">
              <Bot className="w-3.5 h-3.5 text-[#4353ff]" />
              <span className="text-xs text-[var(--foreground)]">
                AI Assistant
              </span>
              <Sparkles className="w-3 h-3 text-[#7c5ff0] animate-pulse" />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Generate fields automatically
            </span>
          </div>

          <div className="relative group mb-3">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Create a bug report template with fields for reproduction steps, severity, and environment details..."
              className="min-h-[80px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-2 focus:ring-[#4353ff]/30 text-sm resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--muted-foreground)]">
              {isGenerating ? (
                <span className="flex items-center gap-2 text-[#4353ff]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating fields...
                </span>
              ) : (
                <span>
                  Tip: Be specific about the fields you need
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateWithAI}
              disabled={!aiPrompt.trim() || isGenerating}
              className="gap-2 h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-xs shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Generate</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStepFields = () => (
    <div className="space-y-4">
      {/* Fields Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--foreground)] text-sm mb-1">
            Template Fields
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Define the fields that will be available when using
            this template
          </p>
        </div>
        <Button
          onClick={() => setShowAddFieldDialog(true)}
          className="gap-2 h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-xs shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Field</span>
        </Button>
      </div>

      {/* Fields List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {templateFields.map((field, index) => (
          <div
            key={field.id}
            className="group flex items-center gap-3 p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-[#4353ff]/30 transition-all"
          >
            {/* Drag Handle */}
            <button className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[#4353ff] cursor-grab active:cursor-grabbing transition-colors">
              <GripVertical className="w-4 h-4" />
            </button>

            {/* Field Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[var(--foreground)] text-sm truncate">
                  {field.name}
                </span>
                {field.required && (
                  <Badge className="h-5 px-1.5 bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                    Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)] text-xs">
                  {field.type}
                </span>
                {field.description && (
                  <>
                    <span className="text-[var(--muted-foreground)]">
                      •
                    </span>
                    <span className="text-[var(--muted-foreground)] text-xs truncate">
                      {field.description}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 text-xs hover:bg-[var(--muted)] rounded-md transition-colors">
                Edit
              </button>
              <button
                onClick={() => handleDeleteField(field.id)}
                className="text-[var(--muted-foreground)] hover:text-red-400 p-1.5 hover:bg-[var(--muted)] rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templateFields.length === 0 && (
        <div className="text-center py-8 px-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4353ff]/10 border border-[#4353ff]/30 mb-3">
            <FileText className="w-6 h-6 text-[#4353ff]" />
          </div>
          <p className="text-[var(--muted-foreground)] text-sm mb-2">
            No fields added yet
          </p>
          <p className="text-[var(--muted-foreground)] text-xs">
            Click "Add Field" to start building your template
          </p>
        </div>
      )}
    </div>
  );

  const renderStepWorkflow = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-[var(--foreground)] text-sm mb-2">
          Select Workflow
        </h3>
        <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
          Choose whether to use the default workflow or attach a
          custom workflow to this template. You can change this
          later in the template settings.
        </p>
      </div>

      <div className="space-y-3">
        {/* Default Workflow Option */}
        <div
          onClick={() => {
            setSelectedWorkflow("default");
            handleFinalizeTemplate();
          }}
          className="w-full text-left p-4 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] hover:border-[#4353ff]/50 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#4353ff]" />
                <span className="text-[var(--foreground)]">
                  Default Workflow
                </span>
                <Badge className="h-5 px-1.5 bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                  Recommended
                </Badge>
              </div>
              <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                Automatically adapts to any statuses you add or
                remove from the board. Starts with typical
                statuses (To Do, In Progress, In Review, Done)
                but remains flexible as your workflow evolves.
                Perfect for most use cases.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]"></div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    To Do
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    In Progress
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    In Review
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    Done
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Workflow Option */}
        <div
          onClick={() => {
            setSelectedWorkflow("custom");
            setCurrentView("workflowList");
          }}
          className="w-full text-left p-4 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] hover:border-[#4353ff]/50 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-[#7c5ff0]" />
                <span className="text-[var(--foreground)]">
                  Custom Workflow
                </span>
                {selectedWorkflow !== "default" &&
                  selectedWorkflow !== "custom" && (
                    <Badge className="h-5 px-1.5 bg-[#4353ff]/20 text-[#4353ff] border-[#4353ff]/30 text-[10px]">
                      {selectedWorkflow === "bug-tracking"
                        ? "Bug Tracking"
                        : selectedWorkflow === "feature-dev"
                          ? "Feature Development"
                          : selectedWorkflow}
                    </Badge>
                  )}
              </div>
              <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                {selectedWorkflow !== "default" &&
                selectedWorkflow !== "custom" ? (
                  <>
                    Selected workflow:{" "}
                    <span className="text-[var(--foreground)]">
                      {selectedWorkflow === "bug-tracking"
                        ? "Bug Tracking"
                        : selectedWorkflow === "feature-dev"
                          ? "Feature Development"
                          : selectedWorkflow}
                    </span>
                    . Click Configure to change or create a new
                    workflow.
                  </>
                ) : (
                  <>
                    Create or select a custom workflow with your
                    own statuses, transitions, and automation
                    rules. Ideal for specialized processes that
                    require specific approval flows or
                    automation.
                  </>
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-3 text-xs text-[#4353ff] hover:text-white hover:bg-[#4353ff]/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView("workflowList");
                  }}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configure Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-xs mb-1">
              Workflow Flexibility
            </p>
            <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
              You can always change the workflow later or switch
              between default and custom workflows from the
              template settings page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreationView = () => (
    <>
      {/* Header with Step Indicator and Back Button */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--border)] bg-[var(--background)]">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (creationStep === "fields") {
                handleBackToList();
              } else if (creationStep === "workflow") {
                setCreationStep("fields");
              }
            }}
            className="h-8 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              Back
              {creationStep === "fields" ? " to Templates" : ""}
            </span>
          </Button>
        </div>

        <div className="text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="relative">
              <div
                className={`p-2 rounded-lg ${
                  creationStep === "fields"
                    ? "bg-[#4353ff]"
                    : creationStep === "workflow"
                      ? "bg-[#4353ff]/30"
                      : "bg-[var(--card)]"
                } border border-[#4353ff]/40`}
              >
                <ListTodo
                  className={`w-4 h-4 ${
                    creationStep === "fields"
                      ? "text-white"
                      : creationStep === "workflow"
                        ? "text-[#4353ff]"
                        : "text-[var(--muted-foreground)]"
                  }`}
                />
              </div>
              {creationStep === "fields" && (
                <div className="absolute inset-0 bg-[#4353ff] rounded-lg blur-md opacity-50 animate-pulse" />
              )}
            </div>

            <div
              className={`w-12 h-[2px] ${
                creationStep === "workflow"
                  ? "bg-[#4353ff]"
                  : "bg-[var(--border)]"
              }`}
            />

            <div className="relative">
              <div
                className={`p-2 rounded-lg ${
                  creationStep === "workflow"
                    ? "bg-[#4353ff]"
                    : "bg-[var(--card)]"
                } border border-[#4353ff]/40`}
              >
                <Zap
                  className={`w-4 h-4 ${
                    creationStep === "workflow"
                      ? "text-white"
                      : "text-[var(--muted-foreground)]"
                  }`}
                />
              </div>
              {creationStep === "workflow" && (
                <div className="absolute inset-0 bg-[#4353ff] rounded-lg blur-md opacity-50 animate-pulse" />
              )}
            </div>
          </div>

          <h3 className="text-[var(--foreground)] mb-1">
            {editingTemplateId
              ? "Edit Template"
              : "Create Template"}{" "}
            -{" "}
            {creationStep === "fields"
              ? "Configure Fields"
              : "Select Workflow"}
          </h3>
          <div className="text-xs text-[var(--muted-foreground)]">
            {templateName || "New Template"}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {creationStep === "fields" && renderStepFields()}
        {creationStep === "workflow" && renderStepWorkflow()}
      </div>

      {/* Footer - Fixed (hidden for workflow step) */}
      {creationStep !== "workflow" && (
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]">
          <div className="text-xs text-[var(--muted-foreground)]">
            {creationStep === "fields"
              ? `${templateFields.length} field${templateFields.length !== 1 ? "s" : ""} configured`
              : "Choose your workflow type"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="h-9 px-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (creationStep === "basics") {
                  if (!templateName.trim()) return;
                  setCreationStep("fields");
                } else if (creationStep === "fields") {
                  setCreationStep("workflow");
                }
              }}
              disabled={
                creationStep === "basics" &&
                !templateName.trim()
              }
              className="group relative h-10 px-6 bg-[#4353ff] hover:bg-[#3343ef] text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#4353ff]/30 hover:shadow-2xl hover:shadow-[#4353ff]/50 transition-all duration-300 overflow-hidden border border-[#4353ff]/50 disabled:hover:shadow-[#4353ff]/30"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative">Continue</span>
              <ChevronRight className="relative w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  const renderWorkflowList = () => (
    <>
      {/* Header with Back Button */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("create")}
            className="h-8 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Template</span>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#4353ff]" />
            <div>
              <h2 className="text-[var(--foreground)] m-0">
                Select Workflow
              </h2>
              <p className="text-[var(--muted-foreground)] text-xs m-0 mt-1">
                Choose an existing workflow or create a new one
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCurrentView("workflow")}
            className="gap-2 bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white"
          >
            <Plus className="w-4 h-4" />
            Create New Workflow
          </Button>
        </div>
      </div>

      {/* Workflow List Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Default Workflow */}
          <div
            onClick={() => {
              setSelectedWorkflow("default");

              // Show success message
              toast.success("Workflow selected successfully!", {
                description:
                  "Default Workflow has been applied to your board.",
              });

              // Call success callback to navigate to board
              if (onSuccess) {
                onSuccess();
              }

              // Close dialog
              setTimeout(() => {
                if (onOpenChange) {
                  onOpenChange(false);
                }
              }, 50);
            }}
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
              selectedWorkflow === "default"
                ? "border-[#4353ff] bg-[#4353ff]/10 shadow-lg shadow-[#4353ff]/20"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[#4353ff]/50"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#4353ff]/20">
                <Zap className="w-5 h-5 text-[#4353ff]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--foreground)] mb-1">
                  Default Workflow
                </h3>
                <p className="text-[var(--muted-foreground)] text-xs">
                  Standard task workflow with To Do, In
                  Progress, and Done states
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <span className="text-xs px-2 py-1 rounded bg-[#4353ff]/20 text-[#4353ff] border border-[#4353ff]/30">
                To Do
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                In Progress
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                Done
              </span>
            </div>
          </div>

          {/* Bug Tracking Workflow */}
          <div
            onClick={() => {
              setSelectedWorkflow("bug-tracking");

              // Show success message
              toast.success("Workflow selected successfully!", {
                description:
                  "Bug Tracking Workflow has been applied to your board.",
              });

              // Call success callback to navigate to board
              if (onSuccess) {
                onSuccess();
              }

              // Close dialog
              setTimeout(() => {
                if (onOpenChange) {
                  onOpenChange(false);
                }
              }, 50);
            }}
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
              selectedWorkflow === "bug-tracking"
                ? "border-[#4353ff] bg-[#4353ff]/10 shadow-lg shadow-[#4353ff]/20"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[#4353ff]/50"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#EF4444]/20">
                <Bug className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--foreground)] mb-1">
                  Bug Tracking
                </h3>
                <p className="text-[var(--muted-foreground)] text-xs">
                  Bug workflow with Reported, In Review, In
                  Progress, Testing, and Resolved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <span className="text-xs px-2 py-1 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                Reported
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                In Progress
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                Resolved
              </span>
            </div>
          </div>

          {/* Feature Development Workflow */}
          <div
            onClick={() => {
              setSelectedWorkflow("feature-dev");

              // Show success message
              toast.success("Workflow selected successfully!", {
                description:
                  "Feature Development Workflow has been applied to your board.",
              });

              // Call success callback to navigate to board
              if (onSuccess) {
                onSuccess();
              }

              // Close dialog
              setTimeout(() => {
                if (onOpenChange) {
                  onOpenChange(false);
                }
              }, 50);
            }}
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
              selectedWorkflow === "feature-dev"
                ? "border-[#4353ff] bg-[#4353ff]/10 shadow-lg shadow-[#4353ff]/20"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[#4353ff]/50"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#8B5CF6]/20">
                <Lightbulb className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--foreground)] mb-1">
                  Feature Development
                </h3>
                <p className="text-[var(--muted-foreground)] text-xs">
                  Complete feature workflow with Design,
                  Development, QA, and Deploy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <span className="text-xs px-2 py-1 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                Design
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                Development
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs px-2 py-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                Deploy
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderWorkflowEditor = () => (
    <WorkflowPage
      onBack={() => setCurrentView("workflowList")}
      onSave={() => {
        // Call success callback to navigate to board FIRST
        if (onSuccess) {
          onSuccess();
        }

        // Close dialog after a small delay to ensure state update completes
        setTimeout(() => {
          if (onOpenChange) {
            onOpenChange(false);
          }
          handleBackToList();
        }, 50);
      }}
    />
  );

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent className="sm:max-w-[450px] bg-[var(--card)] border-[var(--border)] p-0 gap-0">
          <DialogHeader className="px-6 py-5 border-b border-[var(--border)]">
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              Delete Template from Space
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)] mt-2">
              Are you sure you want to delete "
              {templateToDelete?.name}" from this space? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 bg-amber-500/5 border-y border-amber-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-400 mb-1">
                  Warning
                </p>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  All tasks created with this template will
                  remain unchanged, but you won't be able to
                  create new tasks with this template in this
                  space.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setTemplateToDelete(null);
              }}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (templateToDelete) {
                  setTemplates((prev) =>
                    prev.filter(
                      (t) => t.id !== templateToDelete.id,
                    ),
                  );
                  setActiveTemplateIds((prev) =>
                    prev.filter(
                      (id) => id !== templateToDelete.id,
                    ),
                  );
                  toast.success(
                    `${templateToDelete.name} deleted from space`,
                  );
                  setShowDeleteDialog(false);
                  setTemplateToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {standalone ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
          {currentView === "activeTemplates"
            ? renderActiveTemplatesView()
            : currentView === "list"
              ? renderTemplateList()
              : currentView === "workflowList"
                ? renderWorkflowList()
                : currentView === "workflow"
                  ? renderWorkflowEditor()
                  : renderCreationView()}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            className="sm:max-w-[900px] max-h-[85vh] bg-[var(--background)] border-[var(--border)] p-0 gap-0 overflow-hidden flex flex-col"
            hideClose
          >
            <DialogDescription className="sr-only">
              Manage task templates and workflows for your space
            </DialogDescription>
            {currentView === "activeTemplates"
              ? renderActiveTemplatesView()
              : currentView === "list"
                ? renderTemplateList()
                : currentView === "workflowList"
                  ? renderWorkflowList()
                  : currentView === "workflow"
                    ? renderWorkflowEditor()
                    : renderCreationView()}
          </DialogContent>
        </Dialog>
      )}

      {/* Configure Field Dialog */}
      <Dialog
        open={showAddFieldDialog}
        onOpenChange={setShowAddFieldDialog}
      >
        <DialogContent
          className="sm:max-w-[500px] bg-[var(--background)] border-[var(--border)] p-0 gap-0 overflow-hidden"
          hideClose
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <Settings className="w-5 h-5 text-[#4353ff]" />
                  <DialogTitle className="text-[var(--foreground)] m-0">
                    Configure Field
                  </DialogTitle>
                </div>
                <DialogDescription className="text-[var(--muted-foreground)] text-xs m-0">
                  Define the field properties and settings
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddFieldDialog(false)}
                className="h-7 w-7 p-0 hover:bg-[#2a2d3a] text-[#8b8d98] hover:text-white rounded-lg flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Field Type */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                Field Type
              </Label>
              <Select
                value={fieldConfig.type}
                onValueChange={(value) => {
                  setFieldConfig({
                    ...fieldConfig,
                    type: value,
                    defaultValue: "",
                  });
                  setListValues([]);
                  setCurrentListValue("");
                  setSelectedDate(undefined);
                  setSelectedTime({
                    hours: "12",
                    minutes: "00",
                  });
                }}
              >
                <SelectTrigger className="bg-[#23262f] border-[#2a2d3a] text-white focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff]">
                  <SelectValue placeholder="Select a field type" />
                </SelectTrigger>
                <SelectContent className="bg-[#23262f] border-[#2a2d3a]">
                  {fieldTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-[#2a2d3a] focus:bg-[#2a2d3a]"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Title */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                Field Title{" "}
                <span className="text-red-400">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter field title"
                value={fieldConfig.label}
                onChange={(e) => {
                  setFieldConfig({
                    ...fieldConfig,
                    label: e.target.value,
                  });
                  if (fieldTitleError)
                    setFieldTitleError(false);
                }}
                className={`bg-[#23262f] border-[#2a2d3a] text-white placeholder:text-[#6b6d78] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff] ${
                  fieldTitleError
                    ? "border-red-500/50 focus:border-red-500"
                    : ""
                }`}
              />
              {fieldTitleError && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                  Field title is required
                </p>
              )}
            </div>

            {/* Required Field Switch */}
            <div className="flex items-center justify-between py-3">
              <Label
                htmlFor="required"
                className="text-white text-sm cursor-pointer select-none"
              >
                Required field
              </Label>
              <button
                type="button"
                role="switch"
                aria-checked={fieldConfig.required}
                onClick={() =>
                  setFieldConfig({
                    ...fieldConfig,
                    required: !fieldConfig.required,
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4353ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1c24] ${
                  fieldConfig.required
                    ? "bg-[#4353ff]"
                    : "bg-[#3a3d4a]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    fieldConfig.required
                      ? "translate-x-[18px]"
                      : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>

            {/* Help Text */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                Help Text
              </Label>
              <Input
                type="text"
                placeholder="Add descriptive help text (optional)"
                value={fieldConfig.helpText}
                onChange={(e) =>
                  setFieldConfig({
                    ...fieldConfig,
                    helpText: e.target.value,
                  })
                }
                className="bg-[#23262f] border-[#2a2d3a] text-white placeholder:text-[#6b6d78] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#2a2d3a] bg-[#1a1d29]">
            <Button
              variant="ghost"
              onClick={() => setShowAddFieldDialog(false)}
              className="h-9 px-4 text-[#8b8d98] hover:text-white hover:bg-[#23262f]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddField}
              disabled={
                !fieldConfig.type || !fieldConfig.label.trim()
              }
              className="h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}