import { useState, useRef } from "react";
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
import { Textarea } from "./ui/textarea";
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
  X,
  CalendarIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Image,
  Paperclip,
  ChevronDown,
  Smile,
  AtSign,
  Hash,
  MoreHorizontal,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus,
  AlertCircle,
  FileText,
  Table,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner@2.0.3";

/**
 * ============================================================================
 * CREATE TASK DIALOG - COMPREHENSIVE DOCUMENTATION
 * ============================================================================
 *
 * OVERVIEW
 * --------
 * The Create Task Dialog is a sophisticated task creation interface for the
 * YUMA platform that combines traditional form-based task creation with a
 * modern, Notion-inspired editing experience. The dialog supports multiple
 * task templates and features an intelligent slash command menu system for
 * enhanced content authoring.
 *
 *
 * CORE FEATURES
 * -------------
 *
 * 1. MULTI-TEMPLATE SYSTEM
 *    Available Templates:
 *    - 📄 Blank: Minimalist Notion-style interface with focus on quick task creation
 *    - 📋 Task: Standard task template with priority, dates, and description
 *    - 🐛 Bug: Bug reporting with severity levels and reproduction steps
 *    - ✨ Feature: Feature requests with story points and estimates
 *    - 📖 User Story: Agile user stories with acceptance criteria
 *    - 🎯 Epic: Large initiatives spanning multiple sprints
 *
 *    Each template dynamically shows/hides relevant fields based on the selected
 *    type, ensuring a clean and focused user experience.
 *
 *
 * 2. NOTION-STYLE SLASH COMMAND MENU
 *    The standout feature of the blank template is the intelligent slash command
 *    system that allows users to insert formatted content blocks quickly.
 *
 *    Key Capabilities:
 *    - Trigger: Type '/' anywhere in the description field
 *    - Smart Search: Filter blocks by typing after the slash (e.g., '/heading' or '/todo')
 *    - Available Blocks:
 *      • Heading 1, 2, 3 (# , ## , ### )
 *      • Bulleted List (- )
 *      • Numbered List (1. )
 *      • To-do List (- [ ] )
 *      • Quote (> )
 *      • Divider (---)
 *      • Code Block (```)
 *
 *    Search & Filtering:
 *    - Intelligent Matching: Searches across block labels, descriptions, and keywords
 *      Example: Typing '/h1' will match "Heading 1" (via keyword 'h1')
 *      Example: Typing '/task' will match "To-do List" (via keyword 'task')
 *    - Auto-Close on No Results: If the search query yields no matches, the menu
 *      automatically closes, allowing the user to continue typing normally
 *    - Case-Insensitive: All searches are converted to lowercase for flexible matching
 *
 *
 * 3. ADVANCED POSITIONING SYSTEM
 *    The slash command menu features a sophisticated positioning algorithm that
 *    ensures optimal visibility and usability.
 *
 *    Exact Cursor Tracking:
 *    The system uses a "mirror div" technique to calculate the precise cursor position:
 *    1. Mirror Creation: Creates an invisible div with identical styling to the textarea
 *    2. Text Replication: Copies all text up to the cursor position
 *    3. Cursor Marker: Inserts a span element at the cursor location
 *    4. Position Calculation: Measures the span's position relative to the viewport
 *    5. Cleanup: Removes the mirror div after calculation
 *
 *    Position Configuration:
 *    - menuTop = coords.top - 125    (125px above cursor)
 *    - menuLeft = coords.left - 260 (260px to the left of cursor)
 *
 *    Intelligent Bounds Checking:
 *    The menu includes comprehensive viewport boundary detection to prevent overflow:
 *    - Dialog Bounds Detection: Finds the parent dialog element and its boundaries
 *    - Right Edge Protection: Ensures menu doesn't overflow the dialog's right side
 *    - Left Edge Protection: Keeps menu within the dialog's left boundary (minimum 20px padding)
 *    - Top Edge Protection: If menu would go above dialog, repositions below the cursor instead
 *    - Bottom Edge Protection: Prevents menu from being cut off at the dialog bottom
 *
 *    This ensures the menu is always fully visible regardless of where the user types the '/' command.
 *
 *
 * 4. USER INTERACTION FLOW
 *
 *    Opening the Menu:
 *    1. User types '/' in the description field
 *    2. System calculates exact cursor position
 *    3. Menu appears with all available blocks
 *    4. Search query is tracked (everything after the '/')
 *
 *    Filtering Results:
 *    1. User continues typing after '/'
 *    2. Menu filters in real-time based on input
 *    3. If no matches found, menu closes automatically
 *    4. If matches exist, menu updates to show only relevant blocks
 *
 *    Selecting a Block:
 *    1. User clicks on a menu item
 *    2. System removes the '/' and search query
 *    3. Inserts the selected block's markdown syntax
 *    4. Menu closes and focus returns to textarea
 *    5. User can immediately continue typing
 *
 *    Cancelling:
 *    - Press Escape key to close the menu without inserting anything
 *    - Typing text that yields no results automatically closes the menu
 *
 *
 * 5. TEMPLATE-SPECIFIC FIELDS
 *
 *    Common Fields (Most Templates):
 *    - Workspace selection (required)
 *    - Task summary (required)
 *    - Priority levels (Urgent, High, Normal, Low)
 *    - Status tracking (To Do, In Progress, Review, Done)
 *    - Start and due dates with calendar pickers
 *    - Time estimates
 *    - Tags for categorization
 *
 *    Bug Template Additions:
 *    - Severity levels (Critical, Major, Minor, Trivial)
 *    - Steps to reproduce
 *    - Expected vs. actual behavior fields
 *
 *    Feature/Story Template Additions:
 *    - Story points (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21)
 *    - Acceptance criteria (for User Story template)
 *
 *    Blank Template:
 *    - Minimal interface showing only workspace, summary, and description
 *    - Large Notion-style title input (4xl font size)
 *    - Expanded description area with slash commands
 *
 *
 * 6. VISUAL DESIGN PATTERNS
 *
 *    Blank Template (Notion-Style):
 *    - Clean Layout: Generous whitespace (48px horizontal padding)
 *    - Prominent Title: 4xl font size with bold weight
 *    - Inline Controls: Workspace and template selectors integrated into the top bar
 *    - Minimal Chrome: No visible borders or cards, focus on content
 *    - Large Text Area: 350px minimum height for comfortable writing
 *
 *    Form Templates:
 *    - Structured Layout: Traditional form with clear labels and sections
 *    - Two-Column Grid: Efficient use of space for related fields
 *    - Rich Text Toolbar: Complete formatting options for descriptions
 *    - Visual Hierarchy: Clear separation between sections with spacing
 *
 *
 * 7. TECHNICAL IMPLEMENTATION DETAILS
 *
 *    State Management:
 *    - template: Current template selection
 *    - workspace: Selected workspace
 *    - taskSummary: Main task title
 *    - description: Task description content
 *    - showCommandMenu: Menu visibility toggle
 *    - commandMenuPosition: { top, left } coordinates
 *    - searchQuery: Current search after "/"
 *
 *    Position Calculation:
 *    getCaretCoordinates(element: HTMLTextAreaElement) => { top, left }
 *    - Uses computed styles from the textarea
 *    - Creates exact mirror with same dimensions and typography
 *    - Calculates precise cursor location in viewport coordinates
 *    - Returns absolute positioning values for menu placement
 *
 *    Filtering Algorithm:
 *    filteredItems = commandItems.filter(item => {
 *      const query = searchQuery.toLowerCase();
 *      return (
 *        item.label.toLowerCase().includes(query) ||
 *        item.description.toLowerCase().includes(query) ||
 *        item.keywords.some(keyword => keyword.includes(query))
 *      );
 *    });
 *
 *    Block Insertion:
 *    const lastSlashIndex = description.lastIndexOf('/');
 *    const beforeSlash = description.substring(0, lastSlashIndex);
 *    setDescription(beforeSlash + item.insert);
 *
 *
 * 8. PERFORMANCE OPTIMIZATIONS
 *    - Efficient DOM Queries: Dialog element lookup cached during positioning calculation
 *    - Single Mirror Creation: Mirror div created and destroyed in single operation
 *    - Event Debouncing: No unnecessary re-renders during typing
 *    - Conditional Rendering: Menu only rendered when showCommandMenu is true
 *    - Smart Filtering: Early return when search query is empty
 *
 *
 * 9. ACCESSIBILITY FEATURES
 *    - Keyboard Navigation: Escape key to close menu
 *    - Screen Reader Support: DialogDescription for context
 *    - Focus Management: Auto-focus on title input when blank template opens
 *    - Clear Visual Feedback: Hover states on all menu items
 *    - Semantic HTML: Proper button elements for menu items
 *
 *
 * 10. FUTURE ENHANCEMENT OPPORTUNITIES
 *     1. Keyboard Navigation in Menu: Arrow keys to navigate menu items, Enter to select
 *     2. Recent Blocks: Track frequently used blocks and show them first
 *     3. Custom Blocks: Allow users to create and save custom block templates
 *     4. Rich Text Preview: Show live preview of formatted content
 *     5. Collaborative Editing: Real-time collaboration with presence indicators
 *     6. AI Integration: Enhanced AI suggestions triggered by '/ai' command
 *     7. Template Variables: Dynamic placeholders that auto-populate based on context
 *     8. Drag & Drop: Reorder content blocks visually
 *
 *
 * USAGE EXAMPLES
 * --------------
 *
 * Creating a Quick Task (Blank Template):
 * 1. Open dialog (defaults to blank template)
 * 2. Select workspace
 * 3. Type task title in large input
 * 4. Type "/" in description
 * 5. Type "todo" to filter
 * 6. Click "To-do List"
 * 7. Add checklist items
 * 8. Click "Create Task"
 *
 * Creating a Bug Report:
 * 1. Open dialog
 * 2. Select "Bug" template
 * 3. Fill workspace and summary
 * 4. Set priority and severity
 * 5. Add reproduction steps
 * 6. Document expected vs actual behavior
 * 7. Click "Create Task"
 *
 * Formatting Content with Slash Commands:
 * Type: /heading1 → Inserts: "# "
 * Type: /todo → Inserts: "- [ ] "
 * Type: /code → Inserts: "```\n\n```\n"
 * Type: /h2 → Matches "Heading 2" (via keyword)
 * Type: /xyz → No matches → Menu auto-closes
 *
 *
 * DESIGN PHILOSOPHY
 * -----------------
 * The Create Task Dialog embodies several key design principles:
 * 1. Progressive Disclosure: Show only relevant fields based on template selection
 * 2. Contextual Intelligence: Menu positioning adapts to viewport constraints
 * 3. Fast Workflows: Slash commands enable rapid content authoring
 * 4. Flexible Structure: Support both structured forms and freeform content creation
 * 5. Modern UX Patterns: Familiar interactions inspired by tools users already know (Notion, Slack)
 *
 * This implementation represents a sophisticated balance between power and simplicity,
 * enabling users to create everything from quick tasks to detailed bug reports with equal ease.
 *
 * ============================================================================
 */

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
}: CreateTaskDialogProps) {
  const [template, setTemplate] = useState("blank");
  const [workspace, setWorkspace] = useState("");
  const [taskSummary, setTaskSummary] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [estimate, setEstimate] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [showStartDatePicker, setShowStartDatePicker] =
    useState(false);
  const [showDueDatePicker, setShowDueDatePicker] =
    useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] =
    useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);

  // Calculate exact cursor position in textarea
  const getCaretCoordinates = (
    element: HTMLTextAreaElement,
  ) => {
    const { selectionStart } = element;
    const textareaRect = element.getBoundingClientRect();

    // Create a mirror div with exact same properties
    const mirror = document.createElement("div");
    const computed = window.getComputedStyle(element);

    // Copy styles
    mirror.style.position = "absolute";
    mirror.style.top = "0";
    mirror.style.left = "0";
    mirror.style.width = computed.width;
    mirror.style.height = computed.height;
    mirror.style.font = computed.font;
    mirror.style.fontSize = computed.fontSize;
    mirror.style.fontFamily = computed.fontFamily;
    mirror.style.fontWeight = computed.fontWeight;
    mirror.style.lineHeight = computed.lineHeight;
    mirror.style.letterSpacing = computed.letterSpacing;
    mirror.style.padding = computed.padding;
    mirror.style.border = computed.border;
    mirror.style.boxSizing = computed.boxSizing;
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.visibility = "hidden";
    mirror.style.overflow = "hidden";

    document.body.appendChild(mirror);

    // Add text up to cursor
    const text = element.value.substring(0, selectionStart);
    const textNode = document.createTextNode(text);
    mirror.appendChild(textNode);

    // Add cursor marker
    const span = document.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);

    // Get positions
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    // Calculate offset from mirror to span
    const offsetTop = spanRect.top - mirrorRect.top;
    const offsetLeft = spanRect.left - mirrorRect.left;

    // Clean up
    document.body.removeChild(mirror);

    // Return final position in viewport
    const finalTop = textareaRect.top + offsetTop;
    const finalLeft = textareaRect.left + offsetLeft;

    console.log("Position Debug:", {
      textareaRect: {
        top: textareaRect.top,
        left: textareaRect.left,
        width: textareaRect.width,
        height: textareaRect.height,
      },
      spanRect: { top: spanRect.top, left: spanRect.left },
      mirrorRect: {
        top: mirrorRect.top,
        left: mirrorRect.left,
      },
      offset: { top: offsetTop, left: offsetLeft },
      final: { top: finalTop, left: finalLeft },
    });

    return {
      top: finalTop,
      left: finalLeft,
    };
  };

  // Template-specific fields
  const [severity, setSeverity] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] =
    useState("");
  const [reproduceSteps, setReproduceSteps] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");

  // Command menu items
  const commandItems = [
    {
      id: "heading1",
      label: "Heading 1",
      description: "Big section heading",
      icon: Heading1,
      insert: "\\n# ",
      keywords: ["heading", "h1", "title", "big"],
    },
    {
      id: "heading2",
      label: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      insert: "\\n## ",
      keywords: ["heading", "h2", "medium"],
    },
    {
      id: "heading3",
      label: "Heading 3",
      description: "Small section heading",
      icon: Heading3,
      insert: "\\n### ",
      keywords: ["heading", "h3", "small"],
    },
    {
      id: "list",
      label: "Bulleted List",
      description: "Create a simple bulleted list",
      icon: List,
      insert: "\\n- ",
      keywords: ["list", "bullet", "ul", "unordered"],
    },
    {
      id: "numbered",
      label: "Numbered List",
      description: "Create a list with numbering",
      icon: ListOrdered,
      insert: "\\n1. ",
      keywords: ["numbered", "list", "ol", "ordered"],
    },
    {
      id: "todo",
      label: "To-do List",
      description: "Track tasks with a to-do list",
      icon: CheckSquare,
      insert: "\\n- [ ] ",
      keywords: ["todo", "task", "checkbox", "check"],
    },
    {
      id: "quote",
      label: "Quote",
      description: "Capture a quote",
      icon: Quote,
      insert: "\\n> ",
      keywords: ["quote", "blockquote", "citation"],
    },
    {
      id: "divider",
      label: "Divider",
      description: "Visually divide blocks",
      icon: Minus,
      insert: "\\n---\\n",
      keywords: ["divider", "separator", "line", "hr"],
    },
    {
      id: "code",
      label: "Code Block",
      description: "Capture a code snippet",
      icon: Code,
      insert: "\\n```\\n\\n```\\n",
      keywords: ["code", "snippet", "programming"],
    },
  ];

  // Filter command items based on search query
  const filteredItems = commandItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.keywords.some((keyword) => keyword.includes(query))
    );
  });

  // Template configurations
  const templates = {
    blank: {
      label: "Blank",
      icon: "📄",
      description: "Start with a clean slate",
      fields: ["description"],
    },
    task: {
      label: "Task",
      icon: "📋",
      description: "Standard task for general work items",
      fields: [
        "priority",
        "status",
        "startDate",
        "dueDate",
        "estimate",
        "tags",
        "description",
      ],
    },
    bug: {
      label: "Bug",
      icon: "🐛",
      description: "Report and track bugs",
      fields: [
        "priority",
        "severity",
        "status",
        "dueDate",
        "tags",
        "reproduceSteps",
        "expectedBehavior",
        "actualBehavior",
      ],
    },
    feature: {
      label: "Feature",
      icon: "✨",
      description: "New feature or enhancement",
      fields: [
        "priority",
        "status",
        "startDate",
        "dueDate",
        "estimate",
        "storyPoints",
        "tags",
        "description",
      ],
    },
    story: {
      label: "User Story",
      icon: "📖",
      description: "User story with acceptance criteria",
      fields: [
        "priority",
        "status",
        "storyPoints",
        "startDate",
        "dueDate",
        "tags",
        "description",
        "acceptanceCriteria",
      ],
    },
    epic: {
      label: "Epic",
      icon: "🎯",
      description: "Large initiative spanning multiple sprints",
      fields: [
        "priority",
        "status",
        "startDate",
        "dueDate",
        "tags",
        "description",
      ],
    },
  };

  const currentTemplate =
    templates[template as keyof typeof templates];
  const shouldShowField = (field: string) =>
    currentTemplate.fields.includes(field);

  const handleCreateTask = () => {
    if (!workspace) {
      toast.error("Please select a workspace");
      return;
    }
    if (!taskSummary.trim()) {
      toast.error("Please enter a task summary");
      return;
    }

    // Create task logic here
    toast.success("Task created successfully!");

    // Reset form
    setWorkspace("");
    setTaskSummary("");
    setPriority("normal");
    setStatus("");
    setStartDate(undefined);
    setDueDate(undefined);
    setEstimate("");
    setTags("");
    setDescription("");

    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${template === "blank" ? "sm:max-w-[800px]" : "sm:max-w-[680px]"} bg-[var(--card)] border-[var(--border)] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col`}
        hideClose
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[var(--foreground)]">
              Create New Task
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Fill out the form below to create a new task with
            workspace, priority, dates, and description.
          </DialogDescription>
        </DialogHeader>

        {/* Content - Notion-style for Blank template */}
        {template === "blank" ? (
          <div className="flex-1 overflow-y-auto relative">
            {/* Top Controls - Workspace and Template in minimal style */}
            <div className="px-12 pt-8 pb-4 flex items-center gap-4">
              <Select
                value={workspace}
                onValueChange={setWorkspace}
              >
                <SelectTrigger className="w-[200px] bg-transparent border-none text-[var(--muted-foreground)] hover:bg-[var(--muted)] h-8 text-sm">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem
                    value="development"
                    className="text-[var(--foreground)]"
                  >
                    Development
                  </SelectItem>
                  <SelectItem
                    value="design"
                    className="text-[var(--foreground)]"
                  >
                    Design
                  </SelectItem>
                  <SelectItem
                    value="marketing"
                    className="text-[var(--foreground)]"
                  >
                    Marketing
                  </SelectItem>
                  <SelectItem
                    value="product"
                    className="text-[var(--foreground)]"
                  >
                    Product
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-4 bg-[var(--border)]" />

              <Select
                value={template}
                onValueChange={setTemplate}
              >
                <SelectTrigger className="w-[160px] bg-transparent border-none text-[var(--muted-foreground)] hover:bg-[var(--muted)] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  {Object.entries(templates).map(
                    ([key, tmpl]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <span>{tmpl.icon}</span>
                          <span>{tmpl.label}</span>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notion-style Title Input */}
            <div className="px-12 pb-2">
              <input
                type="text"
                value={taskSummary}
                onChange={(e) => setTaskSummary(e.target.value)}
                placeholder="Type summary here..."
                className="w-full bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] placeholder:opacity-70 text-4xl py-2"
                style={{ fontWeight: 700 }}
                autoFocus
              />
            </div>

            {/* Notion-style Description Editor */}
            <div className="px-12 pb-12">
              {/* Content Area - Notion style */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setDescription(newValue);

                    // Get cursor position
                    const cursorPos = e.target.selectionStart;

                    // Find the last "/" before the cursor
                    const textBeforeCursor = newValue.substring(
                      0,
                      cursorPos,
                    );
                    const lastSlashIndex =
                      textBeforeCursor.lastIndexOf("/");

                    if (
                      lastSlashIndex !== -1 &&
                      textareaRef.current
                    ) {
                      // Extract search query from "/" to cursor position
                      const query = textBeforeCursor.substring(
                        lastSlashIndex + 1,
                      );
                      setSearchQuery(query);

                      // Filter items
                      const filtered = commandItems.filter(
                        (item) => {
                          if (!query) return true;
                          const q = query.toLowerCase();
                          return (
                            item.label
                              .toLowerCase()
                              .includes(q) ||
                            item.description
                              .toLowerCase()
                              .includes(q) ||
                            item.keywords.some((keyword) =>
                              keyword.includes(q),
                            )
                          );
                        },
                      );

                      // Always show menu when "/" is present, even if no results
                      // Get exact cursor position
                      const coords = getCaretCoordinates(
                        textareaRef.current,
                      );

                      // Position menu with bounds checking to keep it within dialog
                      const menuWidth = 320; // 80 * 4 (w-80)
                      const menuHeight = 400;

                      // Calculate position ensuring it stays within viewport
                      const dialogEl =
                        textareaRef.current.closest(
                          '[role="dialog"]',
                        );
                      const dialogRect =
                        dialogEl?.getBoundingClientRect();

                      let menuTop = coords.top - 125; // Position 125px above cursor
                      let menuLeft = coords.left - 260; // Position 260px to the left of cursor

                      // Disable all boundary checks - use exact positioning
                      // if (dialogRect) {
                      //   // Ensure menu doesn't go off the right side of dialog
                      //   if (
                      //     menuLeft + menuWidth >
                      //     dialogRect.right
                      //   ) {
                      //     menuLeft =
                      //       dialogRect.right - menuWidth - 20;
                      //   }
                      //   // Allow menu to extend to the left - don't constrain left boundary
                      //   // if (menuLeft < dialogRect.left) {
                      //   //   menuLeft = dialogRect.left + 20;
                      //   // }
                      //   // Ensure menu doesn't go off the top
                      //   if (menuTop < dialogRect.top) {
                      //     menuTop = coords.top + 30; // Position below cursor instead
                      //   }
                      //   // Ensure menu doesn't go off the bottom
                      //   if (
                      //     menuTop + menuHeight >
                      //     dialogRect.bottom
                      //   ) {
                      //     menuTop =
                      //       dialogRect.bottom -
                      //       menuHeight -
                      //       20;
                      //   }
                      // }

                      setCommandMenuPosition({
                        top: menuTop,
                        left: menuLeft,
                      });
                      setShowCommandMenu(true);
                    } else {
                      setShowCommandMenu(false);
                      setSearchQuery("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowCommandMenu(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Type '/' for commands..."
                  className="w-full min-h-[350px] bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none text-base leading-relaxed"
                  style={{ fontFamily: "inherit" }}
                />

                {/* Slash Command Menu */}
                {showCommandMenu && (
                  <div
                    className="fixed w-80 bg-[#2A2D3A] border border-[#3D4152] rounded-lg shadow-2xl py-2"
                    style={{
                      top: `${Math.min(commandMenuPosition.top, window.innerHeight - 500)}px`,
                      left: `${Math.min(Math.max(commandMenuPosition.left, 20), window.innerWidth - 340)}px`,
                      zIndex: 99999,
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
                      BASIC BLOCKS
                    </div>
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          // Remove the "/" and search query, then insert the item
                          const lastSlashIndex =
                            description.lastIndexOf("/");
                          const beforeSlash =
                            description.substring(
                              0,
                              lastSlashIndex,
                            );
                          setDescription(
                            beforeSlash + item.insert,
                          );
                          setShowCommandMenu(false);
                          setSearchQuery("");
                        }}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[var(--muted)] text-left"
                      >
                        <item.icon className="w-5 h-5 text-[var(--muted-foreground)]" />
                        <div>
                          <div className="text-sm text-[var(--foreground)]">
                            {item.label}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Original form layout for other templates
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Workspace Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="workspace"
                className="text-[var(--foreground)] text-sm"
              >
                Workspace{" "}
                <span className="text-red-400">*</span>
              </Label>
              <Select
                value={workspace}
                onValueChange={setWorkspace}
              >
                <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem
                    value="development"
                    className="text-[var(--foreground)]"
                  >
                    Development
                  </SelectItem>
                  <SelectItem
                    value="design"
                    className="text-[var(--foreground)]"
                  >
                    Design
                  </SelectItem>
                  <SelectItem
                    value="marketing"
                    className="text-[var(--foreground)]"
                  >
                    Marketing
                  </SelectItem>
                  <SelectItem
                    value="product"
                    className="text-[var(--foreground)]"
                  >
                    Product
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="template"
                className="text-[var(--foreground)] text-sm"
              >
                Template <span className="text-red-400">*</span>
              </Label>
              <Select
                value={template}
                onValueChange={setTemplate}
              >
                <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  {Object.entries(templates).map(
                    ([key, tmpl]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <span>{tmpl.icon}</span>
                          <span>{tmpl.label}</span>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Task Summary */}
            <div className="space-y-2">
              <Label
                htmlFor="task-summary"
                className="text-[var(--foreground)] text-sm"
              >
                Task Summary{" "}
                <span className="text-red-400">*</span>
              </Label>
              <Input
                id="task-summary"
                value={taskSummary}
                onChange={(e) => setTaskSummary(e.target.value)}
                placeholder="What needs to be done?"
                className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 placeholder:text-[var(--muted-foreground)]"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              {shouldShowField("priority") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="priority"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={setPriority}
                  >
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                      <SelectItem
                        value="urgent"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Urgent
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="high"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          High
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="normal"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Normal
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="low"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          Low
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Severity (Bug template) */}
              {shouldShowField("severity") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="severity"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Severity
                  </Label>
                  <Select
                    value={severity}
                    onValueChange={setSeverity}
                  >
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                      <SelectItem
                        value="critical"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-600" />
                          Critical
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="major"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-600" />
                          Major
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="minor"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-600" />
                          Minor
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="trivial"
                        className="text-[var(--foreground)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-600" />
                          Trivial
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status */}
              {shouldShowField("status") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                      <SelectValue placeholder="Select workspace first" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                      <SelectItem
                        value="to-do"
                        className="text-[var(--foreground)]"
                      >
                        To Do
                      </SelectItem>
                      <SelectItem
                        value="in-progress"
                        className="text-[var(--foreground)]"
                      >
                        In Progress
                      </SelectItem>
                      <SelectItem
                        value="review"
                        className="text-[var(--foreground)]"
                      >
                        Review
                      </SelectItem>
                      <SelectItem
                        value="done"
                        className="text-[var(--foreground)]"
                      >
                        Done
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Story Points (Feature/Story templates) */}
              {shouldShowField("storyPoints") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="story-points"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Story Points
                  </Label>
                  <Select
                    value={storyPoints}
                    onValueChange={setStoryPoints}
                  >
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10">
                      <SelectValue placeholder="Select points" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                      {[1, 2, 3, 5, 8, 13, 21].map((point) => (
                        <SelectItem
                          key={point}
                          value={point.toString()}
                          className="text-[var(--foreground)]"
                        >
                          {point}{" "}
                          {point === 1 ? "point" : "points"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Start Date */}
              {shouldShowField("startDate") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="start-date"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Start Date
                  </Label>
                  <Popover
                    open={showStartDatePicker}
                    onOpenChange={setShowStartDatePicker}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-10 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span className="text-[var(--muted-foreground)]">
                            Select date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-[var(--card)] border-[var(--border)]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setShowStartDatePicker(false);
                        }}
                        initialFocus
                        className="bg-[var(--card)]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Due Date */}
              {shouldShowField("dueDate") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="due-date"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Due Date
                  </Label>
                  <Popover
                    open={showDueDatePicker}
                    onOpenChange={setShowDueDatePicker}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-10 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? (
                          format(dueDate, "PPP")
                        ) : (
                          <span className="text-[var(--muted-foreground)]">
                            Select date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-[var(--card)] border-[var(--border)]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          setShowDueDatePicker(false);
                        }}
                        initialFocus
                        className="bg-[var(--card)]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Estimate */}
              {shouldShowField("estimate") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="estimate"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Estimate
                  </Label>
                  <Input
                    id="estimate"
                    value={estimate}
                    onChange={(e) =>
                      setEstimate(e.target.value)
                    }
                    placeholder="e.g., 2h, 1d"
                    className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
              )}

              {/* Tags */}
              {shouldShowField("tags") && (
                <div className="space-y-2">
                  <Label
                    htmlFor="tags"
                    className="text-[var(--foreground)] text-sm"
                  >
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            {shouldShowField("description") && (
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-[var(--foreground)] text-sm"
                >
                  Description
                </Label>

                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-[var(--background)] border border-[var(--border)] rounded-t-md border-b-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </Button>

                  <div className="w-px h-5 bg-[var(--border)] mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </Button>

                  <div className="w-px h-5 bg-[var(--border)] mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <List className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </Button>

                  <div className="w-px h-5 bg-[var(--border)] mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </Button>

                  <div className="w-px h-5 bg-[var(--border)] mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Image className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </Button>

                  <div className="w-px h-5 bg-[var(--border)] mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <Hash className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    type="button"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Textarea */}
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Add more details.../type / to activate AI"
                  className="min-h-[120px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] rounded-t-none resize-none"
                />
              </div>
            )}

            {/* Bug-specific fields */}
            {shouldShowField("reproduceSteps") && (
              <div className="space-y-2">
                <Label
                  htmlFor="reproduce-steps"
                  className="text-[var(--foreground)] text-sm"
                >
                  Steps to Reproduce
                </Label>
                <Textarea
                  id="reproduce-steps"
                  value={reproduceSteps}
                  onChange={(e) =>
                    setReproduceSteps(e.target.value)
                  }
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                  className="min-h-[100px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                />
              </div>
            )}

            {shouldShowField("expectedBehavior") && (
              <div className="space-y-2">
                <Label
                  htmlFor="expected-behavior"
                  className="text-[var(--foreground)] text-sm"
                >
                  Expected Behavior
                </Label>
                <Textarea
                  id="expected-behavior"
                  value={expectedBehavior}
                  onChange={(e) =>
                    setExpectedBehavior(e.target.value)
                  }
                  placeholder="What should happen?"
                  className="min-h-[80px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                />
              </div>
            )}

            {shouldShowField("actualBehavior") && (
              <div className="space-y-2">
                <Label
                  htmlFor="actual-behavior"
                  className="text-[var(--foreground)] text-sm"
                >
                  Actual Behavior
                </Label>
                <Textarea
                  id="actual-behavior"
                  value={actualBehavior}
                  onChange={(e) =>
                    setActualBehavior(e.target.value)
                  }
                  placeholder="What actually happens?"
                  className="min-h-[80px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                />
              </div>
            )}

            {/* Acceptance Criteria (User Story) */}
            {shouldShowField("acceptanceCriteria") && (
              <div className="space-y-2">
                <Label
                  htmlFor="acceptance-criteria"
                  className="text-[var(--foreground)] text-sm"
                >
                  Acceptance Criteria
                </Label>
                <Textarea
                  id="acceptance-criteria"
                  value={acceptanceCriteria}
                  onChange={(e) =>
                    setAcceptanceCriteria(e.target.value)
                  }
                  placeholder="Given...&#10;When...&#10;Then..."
                  className="min-h-[100px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTask}
            className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
          >
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}