import { useState } from "react";
import {
  Plus,
  GripVertical,
  Filter,
  ChevronDown,
  Package,
  PackageCheck,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface Release {
  id: string;
  taskId: string;
  title: string;
  status: "new" | "backlog" | "to-do" | "in-progress" | "done";
  isPending: boolean;
}

const mockReleases: Release[] = [
  {
    id: "1",
    taskId: "TIT-10",
    title: "bqbqhbh",
    status: "new",
    isPending: true,
  },
  {
    id: "2",
    taskId: "TIT-9",
    title: "azaza",
    status: "backlog",
    isPending: true,
  },
  {
    id: "3",
    taskId: "TIT-8",
    title: "cdcd",
    status: "to-do",
    isPending: true,
  },
  {
    id: "4",
    taskId: "TIT-7",
    title: "sddsd",
    status: "in-progress",
    isPending: true,
  },
  {
    id: "5",
    taskId: "TIT-6",
    title: "bhhbh",
    status: "done",
    isPending: true,
  },
  {
    id: "6",
    taskId: "TIT-5",
    title: "completed release",
    status: "done",
    isPending: false,
  },
  {
    id: "7",
    taskId: "TIT-4",
    title: "shipped feature",
    status: "done",
    isPending: false,
  },
];

export function ClickUpReleases() {
  const [activeTab, setActiveTab] = useState<
    "pending" | "released"
  >("pending");
  const [selectedStatuses, setSelectedStatuses] = useState<
    string[]
  >([]);
  const [releases] = useState<Release[]>(mockReleases);

  // Create Release Dialog State
  const [showCreateDialog, setShowCreateDialog] =
    useState(false);
  const [releaseVersion, setReleaseVersion] = useState("");
  const [releaseDescription, setReleaseDescription] =
    useState("");
  const [releaseDate, setReleaseDate] = useState("");

  const filteredReleases = releases.filter((release) => {
    // Filter by tab
    if (activeTab === "pending" && !release.isPending)
      return false;
    if (activeTab === "released" && release.isPending)
      return false;

    // Filter by status
    if (
      selectedStatuses.length > 0 &&
      !selectedStatuses.includes(release.status)
    ) {
      return false;
    }

    return true;
  });

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "New",
      backlog: "Backlog",
      "to-do": "To Do",
      "in-progress": "In Progress",
      done: "Done",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<
      string,
      { bg: string; border: string; text: string }
    > = {
      new: {
        bg: "bg-[#8B5CF6]/10",
        border: "border-[#8B5CF6]/50",
        text: "text-[#8B5CF6]",
      },
      backlog: {
        bg: "bg-[#EF4444]/10",
        border: "border-[#EF4444]/50",
        text: "text-[#EF4444]",
      },
      "to-do": {
        bg: "bg-[#3B82F6]/10",
        border: "border-[#3B82F6]/50",
        text: "text-[#3B82F6]",
      },
      "in-progress": {
        bg: "bg-[#F59E0B]/10",
        border: "border-[#F59E0B]/50",
        text: "text-[#F59E0B]",
      },
      done: {
        bg: "bg-[#10B981]/10",
        border: "border-[#10B981]/50",
        text: "text-[#10B981]",
      },
    };
    return (
      colors[status] || {
        bg: "bg-[var(--muted)]/10",
        border: "border-[var(--border)]",
        text: "text-[var(--muted-foreground)]",
      }
    );
  };

  const handleCreateRelease = () => {
    if (!releaseVersion.trim()) return;

    // Here you would create the release
    console.log("Creating release:", {
      version: releaseVersion,
      description: releaseDescription,
      date: releaseDate,
    });

    // Reset and close
    setShowCreateDialog(false);
    setReleaseVersion("");
    setReleaseDescription("");
    setReleaseDate("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EC4899]/10 to-transparent rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl animate-pulse-slow-delayed pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl relative z-10 shadow-sm flex-wrap sm:flex-nowrap">
        {/* Left side - Tabs and Filter */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
          {/* Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[var(--muted)]/30 p-1 rounded-lg backdrop-blur-sm border border-[var(--border)]/30">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                activeTab === "pending"
                  ? "bg-gradient-to-r from-[#EC4899] to-[#DB2777] text-white shadow-lg shadow-[#EC4899]/30"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              }`}
            >
              <Package className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden sm:inline">Pending</span>
              <Badge
                variant="secondary"
                className={`${activeTab === "pending" ? "bg-white/20 text-white" : ""} text-xs px-1.5 py-0`}
              >
                {releases.filter((r) => r.isPending).length}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab("released")}
              className={`px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                activeTab === "released"
                  ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/30"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              }`}
            >
              <PackageCheck className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden sm:inline">Released</span>
              <Badge
                variant="secondary"
                className={`${activeTab === "released" ? "bg-white/20 text-white" : ""} text-xs px-1.5 py-0`}
              >
                {releases.filter((r) => !r.isPending).length}
              </Badge>
            </button>
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-1 sm:gap-2 bg-[var(--background)]/80 hover:bg-[var(--muted)] hover:scale-105 hover:shadow-md transition-all h-9 border-[var(--border)] flex-shrink-0"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter by status</span>
                {selectedStatuses.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-xs bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white border-0">
                    {selectedStatuses.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-48 backdrop-blur-xl bg-[var(--card)]/95 border-[var(--border)]/50"
            >
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("new")}
                onCheckedChange={() =>
                  handleStatusToggle("new")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  New
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("backlog")}
                onCheckedChange={() =>
                  handleStatusToggle("backlog")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  Backlog
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("to-do")}
                onCheckedChange={() =>
                  handleStatusToggle("to-do")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  To Do
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes(
                  "in-progress",
                )}
                onCheckedChange={() =>
                  handleStatusToggle("in-progress")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  In Progress
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("done")}
                onCheckedChange={() =>
                  handleStatusToggle("done")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  Done
                </div>
              </DropdownMenuCheckboxItem>

              {selectedStatuses.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    className="text-red-500"
                    onCheckedChange={() =>
                      setSelectedStatuses([])
                    }
                  >
                    Clear All Filters
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Create Release Button */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-1 sm:gap-2 bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden group flex-shrink-0"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          <Plus className="w-4 h-4 relative z-10" />
          <span className="relative z-10 hidden sm:inline">Create Release</span>
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-4 sm:py-6 relative">
        {/* Decorative Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          {/* Section Card */}
          <div
            className="bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/60 border border-[var(--border)]/50 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(236,72,153,0.3)] transition-all duration-500 overflow-hidden backdrop-blur-sm relative"
            style={{
              animation: `fadeInScale 0.4s ease-out both`,
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Section Header with Enhanced Gradient Bar */}
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden">
                <div
                  className="h-full w-full animate-gradient-x"
                  style={{
                    backgroundImage:
                      activeTab === "pending"
                        ? `linear-gradient(90deg, #EC4899, #DB2777, #EC4899, #DB2777)`
                        : `linear-gradient(90deg, #10B981, #059669, #10B981, #059669)`,
                    backgroundSize: "200% 100%",
                    boxShadow:
                      activeTab === "pending"
                        ? `0 0 20px #EC489960, 0 0 40px #EC489930`
                        : `0 0 20px #10B98160, 0 0 40px #10B98130`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]/30 mt-1.5 bg-gradient-to-b from-[var(--muted)]/30 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full relative"
                      style={{
                        backgroundColor:
                          activeTab === "pending"
                            ? "#EC4899"
                            : "#10B981",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor:
                            activeTab === "pending"
                              ? "#EC4899"
                              : "#10B981",
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-[var(--foreground)] font-semibold">
                    All Tasks
                  </h3>
                  <div
                    className="text-xs px-2.5 py-1 rounded-full font-medium shadow-lg flex items-center gap-1.5"
                    style={{
                      background:
                        activeTab === "pending"
                          ? `linear-gradient(135deg, #EC489915, #DB277715)`
                          : `linear-gradient(135deg, #10B98115, #05966915)`,
                      color:
                        activeTab === "pending"
                          ? "#EC4899"
                          : "#10B981",
                      border:
                        activeTab === "pending"
                          ? `1px solid #EC489930`
                          : `1px solid #10B98130`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{
                        backgroundColor:
                          activeTab === "pending"
                            ? "#EC4899"
                            : "#10B981",
                      }}
                    />
                    {filteredReleases.length}{" "}
                    {filteredReleases.length === 1
                      ? "task"
                      : "tasks"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="p-4">
              {filteredReleases.length > 0 ? (
                <div className="space-y-2">
                  {filteredReleases.map((release, index) => {
                    const statusColor = getStatusColor(
                      release.status,
                    );
                    return (
                      <div
                        key={release.id}
                        className="relative flex items-center gap-3 px-3.5 py-3 rounded-lg bg-[var(--card)] hover:bg-[var(--primary)]/10 transition-all duration-200 group/task cursor-move border border-[var(--border)]/30 hover:border-[var(--primary)]/40 hover:shadow-md"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        {/* Drag Handle */}
                        <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] opacity-50 group-hover/task:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0" />

                        {/* Task Content */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[var(--foreground)] font-semibold text-sm w-20 flex-shrink-0 font-mono px-2.5 py-1.5 rounded-md bg-[var(--muted)]/50 border border-[var(--border)]/30 shadow-sm">
                            {release.taskId}
                          </span>
                          <span className="flex-1 text-[var(--foreground)] text-sm truncate font-medium">
                            {release.title}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-2.5 py-0.5 flex-shrink-0 font-medium ${statusColor.bg} ${statusColor.border} ${statusColor.text} opacity-0 group-hover/task:opacity-100 transition-opacity`}
                                >
                                  {getStatusLabel(
                                    release.status,
                                  )}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Status:{" "}
                                {getStatusLabel(release.status)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--muted)]/30 mb-4">
                    {activeTab === "pending" ? (
                      <Package className="w-8 h-8 text-[var(--muted-foreground)]" />
                    ) : (
                      <PackageCheck className="w-8 h-8 text-[var(--muted-foreground)]" />
                    )}
                  </div>
                  <p className="text-lg mb-2">
                    No {activeTab} releases found
                  </p>
                  <p className="text-sm">
                    {selectedStatuses.length > 0
                      ? "Try adjusting your filters"
                      : `Create a new release to get started`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Release Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent className="sm:max-w-[500px] bg-[var(--card)] border-[var(--border)] p-0 gap-0">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b border-[var(--border)]">
            <DialogTitle className="text-[var(--foreground)] m-0">
              Create Release
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new release with version, description,
              and date
            </DialogDescription>
          </div>

          {/* Dialog Body */}
          <div className="px-6 py-6 space-y-5">
            {/* Release Version */}
            <div className="space-y-2">
              <Label
                htmlFor="release-version"
                className="text-[var(--foreground)]"
              >
                Release Version{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="release-version"
                value={releaseVersion}
                onChange={(e) =>
                  setReleaseVersion(e.target.value)
                }
                placeholder=""
                className="bg-[var(--background)] border-[#4353FF] focus:border-[#4353FF] focus:ring-2 focus:ring-[#4353FF]/20 text-[var(--foreground)]"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="release-description"
                className="text-[var(--foreground)]"
              >
                Description
              </Label>
              <Textarea
                id="release-description"
                value={releaseDescription}
                onChange={(e) =>
                  setReleaseDescription(e.target.value)
                }
                placeholder="Release description..."
                rows={4}
                className="bg-[var(--background)] border-[var(--border)] focus:border-[#4353FF] focus:ring-2 focus:ring-[#4353FF]/20 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
              />
            </div>

            {/* Release Date */}
            <div className="space-y-2">
              <Label
                htmlFor="release-date"
                className="text-[var(--foreground)]"
              >
                Release Date
              </Label>
              <Input
                id="release-date"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                className="bg-[var(--background)] border-[var(--border)] focus:border-[#4353FF] focus:ring-2 focus:ring-[#4353FF]/20 text-[var(--foreground)]"
              />
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              className="text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRelease}
              disabled={!releaseVersion.trim()}
              className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Release
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}