import { useState } from "react";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Settings,
  Lock,
  Calendar,
  BarChart3,
  Sparkles,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { navigationData, type NavItem } from "../lib/navigation-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DeleteSpaceDialog } from "./delete-space-dialog";
import { toast } from "sonner@2.0.3";

interface NavItemComponentProps {
  item: NavItem;
  depth?: number;
  onSpaceSelect?: (spaceId: string) => void;
  onBoardSelect?: (boardId: string) => void;
  selectedSpace?: string | null;
  selectedBoard?: string | null;
  onDeleteSpace?: (spaceId: string, spaceName: string) => void;
  onDeleteBoard?: (boardId: string, boardName: string) => void;
  onCreateSpace?: () => void;
}

function NavItemComponent({
  item,
  depth = 0,
  onSpaceSelect,
  onBoardSelect,
  selectedSpace,
  selectedBoard,
  onDeleteSpace,
  onDeleteBoard,
  onCreateSpace,
}: NavItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(
    depth === 0 || item.id === "second-space",
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSpace = item.type === "space";
  const isBoard = item.type === "board";
  const isSpacesGroup = item.id === "spaces" && depth === 0;
  const isSelected = (isSpace && selectedSpace === item.id) || (isBoard && selectedBoard === item.id);

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    if (isSpace && onSpaceSelect) {
      onSpaceSelect(item.id);
    }
    if (isBoard && onBoardSelect) {
      onBoardSelect(item.id);
    }
  };

  return (
    <div>
      <div 
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            isSelected
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {hasChildren && (
            <span className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
          )}

          {item.icon && (
            <span className="shrink-0">
              <item.icon
                className="w-4 h-4"
                style={{ color: item.iconColor || "currentColor" }}
              />
            </span>
          )}

          {item.color && !item.icon && (
            <span
              className={`w-2 h-2 rounded-full shrink-0`}
              style={{ backgroundColor: item.color }}
            />
          )}

          <span className="flex-1 text-left truncate">
            {item.label}
          </span>

          {item.count !== undefined && (
            <span className="text-[var(--muted-foreground)] w-6 text-right shrink-0">
              {item.count}
            </span>
          )}
        </button>

        {/* Hover action for Spaces group header - show + icon */}
        {isSpacesGroup && isHovered && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-[var(--muted)]"
              onClick={(e) => {
                e.stopPropagation();
                onCreateSpace?.();
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Hover action for Space items - show ellipsis */}
        {isSpace && (isHovered || isDropdownOpen) && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-[var(--muted)] rounded">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-[var(--accent)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-[var(--card)] border-[var(--border)]"
              >
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSpace?.(item.id, item.label);
                    setIsDropdownOpen(false);
                  }}
                >
                  Delete Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Hover action for Board items - show ellipsis */}
        {isBoard && (isHovered || isDropdownOpen) && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-[var(--muted)] rounded">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-[var(--accent)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-[var(--card)] border-[var(--border)]"
              >
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBoard?.(item.id, item.label);
                    setIsDropdownOpen(false);
                  }}
                >
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              depth={depth + 1}
              onSpaceSelect={onSpaceSelect}
              onBoardSelect={onBoardSelect}
              selectedSpace={selectedSpace}
              selectedBoard={selectedBoard}
              onDeleteSpace={onDeleteSpace}
              onDeleteBoard={onDeleteBoard}
              onCreateSpace={onCreateSpace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ClickUpSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSpaceSelect?: (spaceId: string) => void;
  onBoardSelect?: (boardId: string) => void;
  selectedSpace?: string | null;
  selectedBoard?: string | null;
  onDeleteSpace?: (spaceId: string, spaceName: string) => void;
  onDeleteBoard?: (boardId: string, boardName: string) => void;
  onCreateSpace?: () => void;
}

export function ClickUpSidebar({
  collapsed = false,
  onToggleCollapse,
  onSpaceSelect,
  onBoardSelect,
  selectedSpace,
  selectedBoard,
  onCreateSpace,
}: ClickUpSidebarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteSpace = (spaceId: string, spaceName: string) => {
    setSpaceToDelete({ id: spaceId, name: spaceName });
    setBoardToDelete(null);
    setShowDeleteDialog(true);
  };

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    setBoardToDelete({ id: boardId, name: boardName });
    setSpaceToDelete(null);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (spaceToDelete) {
      // Delete space logic here
      toast.success(`Space "${spaceToDelete.name}" has been deleted`);
      setShowDeleteDialog(false);
      setSpaceToDelete(null);
    } else if (boardToDelete) {
      // Delete board logic here
      toast.success(`Board "${boardToDelete.name}" has been deleted`);
      setShowDeleteDialog(false);
      setBoardToDelete(null);
    }
  };

  const handleCreateSpace = () => {
    onCreateSpace?.();
  };

  return (
    <>
      <div
        className={`hidden lg:flex h-screen bg-[var(--sidebar)] border-r border-[var(--border)] flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
          {collapsed ? (
            <div className="flex items-center justify-center w-full gap-1">
              <span className="text-[var(--primary)] text-xl">
                Y
              </span>
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleCollapse}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <>
              <span className="text-[var(--primary)] flex-1">
                YUMA
              </span>
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleCollapse}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {collapsed ? (
            /* Collapsed view - icons only */
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mb-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                title="Home"
              >
                <Home className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mb-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="Calendar"
              >
                <Calendar className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mb-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="Reports"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mb-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="AI Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mb-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </>
          ) : (
            /* Expanded view - full navigation */
            <>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 mb-2 rounded transition-colors bg-[var(--primary)] text-white"
              >
                <Home
                  className="w-4 h-4"
                  style={{ color: "white" }}
                />
                <span>Home</span>
              </button>

              {navigationData.map((section) => (
                <div key={section.id} className="mb-4">
                  <NavItemComponent
                    item={section}
                    onSpaceSelect={onSpaceSelect}
                    onBoardSelect={onBoardSelect}
                    selectedSpace={selectedSpace}
                    selectedBoard={selectedBoard}
                    onDeleteSpace={handleDeleteSpace}
                    onDeleteBoard={handleDeleteBoard}
                    onCreateSpace={handleCreateSpace}
                  />
                </div>
              ))}

              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded transition-colors">
                <ChevronRight className="w-3 h-3" />
                <Lock
                  className="w-4 h-4"
                  style={{ color: "#EF4444" }}
                />
                <span>Admin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DeleteSpaceDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        spaceName={spaceToDelete?.name || boardToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}