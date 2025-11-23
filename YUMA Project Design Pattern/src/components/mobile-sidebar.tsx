import { useState } from "react";
import {
  Home,
  ChevronRight,
  ChevronDown,
  Plus,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { navigationData, type NavItem } from "../lib/navigation-data";

interface NavItemComponentProps {
  item: NavItem;
  depth?: number;
  onSpaceSelect?: (spaceId: string) => void;
  onBoardSelect?: (boardId: string) => void;
  selectedSpace?: string | null;
  selectedBoard?: string | null;
  onCreateSpace?: () => void;
}

function NavItemComponent({
  item,
  depth = 0,
  onSpaceSelect,
  onBoardSelect,
  selectedSpace,
  selectedBoard,
  onCreateSpace,
}: NavItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(
    depth === 0 || item.id === "second-space",
  );
  const hasChildren = item.children && item.children.length > 0;
  const isSpace = item.type === "space";
  const isBoard = item.type === "board";
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
          <span className="text-[var(--muted-foreground)]">
            {item.count}
          </span>
        )}

        {hasChildren && depth > 0 && (
          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        )}
      </button>

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
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceSelect?: (spaceId: string) => void;
  onBoardSelect?: (boardId: string) => void;
  selectedSpace?: string | null;
  selectedBoard?: string | null;
  onCreateSpace?: () => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
  onSpaceSelect,
  onBoardSelect,
  selectedSpace,
  selectedBoard,
  onCreateSpace,
}: MobileSidebarProps) {

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 bg-[var(--sidebar)] border-[var(--border)]">
        <SheetHeader className="border-b border-[var(--border)] px-4 py-4">
          <SheetTitle className="text-[var(--primary)] text-left">
            YUMA
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu for YUMA task management platform
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2 px-2">
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
                onCreateSpace={onCreateSpace}
              />
            </div>
          ))}

          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded transition-colors">
            <ChevronRight className="w-3 h-3" />
            <Lock className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span>Admin</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}