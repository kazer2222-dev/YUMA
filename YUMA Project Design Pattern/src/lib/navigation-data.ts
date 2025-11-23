import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  count?: number;
  color?: string;
  children?: NavItem[];
  type?: "space" | "board" | "tool";
}

import {
  Calendar,
  BarChart3,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

export const navigationData: NavItem[] = [
  {
    id: "spaces",
    label: "Spaces",
    children: [
      {
        id: "second-space",
        label: "Second space",
        count: 5,
        type: "space",
        children: [
          { id: "board", label: "Board", type: "board" },
          { id: "scrum", label: "Scrum", type: "board" },
          { id: "scrum2", label: "Scrum 2", type: "board" },
          { id: "test", label: "test", type: "board" },
          { id: "2", label: "2", type: "board" },
        ],
      },
      {
        id: "first-project",
        label: "First project",
        count: 4,
        type: "space",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    children: [
      {
        id: "calendar",
        label: "Global Calendar",
        type: "tool",
        icon: Calendar,
        iconColor: "#10B981",
      },
      {
        id: "reports",
        label: "Reports",
        type: "tool",
        icon: BarChart3,
        iconColor: "#F59E0B",
      },
      {
        id: "ai-assistant",
        label: "AI Assistant",
        type: "tool",
        icon: Sparkles,
        iconColor: "#8B5CF6",
      },
    ],
  },
];

// Helper function to find a space by ID
export function findSpaceById(spaceId: string): NavItem | undefined {
  const spacesGroup = navigationData.find(item => item.id === "spaces");
  return spacesGroup?.children?.find(space => space.id === spaceId);
}

// Helper function to get boards for a space
export function getBoardsForSpace(spaceId: string): NavItem[] {
  const space = findSpaceById(spaceId);
  return space?.children?.filter(item => item.type === "board") || [];
}

// Helper function to find which space a board belongs to
export function findSpaceForBoard(boardId: string): NavItem | undefined {
  const spacesGroup = navigationData.find(item => item.id === "spaces");
  return spacesGroup?.children?.find(space => 
    space.children?.some(board => board.id === boardId && board.type === "board")
  );
}