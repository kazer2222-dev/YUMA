import { useState, useRef, useEffect } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Trash2,
  Copy,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { useTheme } from "./theme-provider";
import { toast } from "sonner@2.0.3";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  AddStatusDialog,
  StatusFormData,
} from "./add-status-dialog";

const PRESET_COLORS = [
  "#6B7280", // Gray
  "#3B82F6", // Blue
  "#22C55E", // Green
];

interface WorkflowNode {
  id: string;
  type: "start" | "status" | "end";
  label: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  wipLimit?: number;
  isDone?: boolean;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  fromSide?: "left" | "right" | "top" | "bottom";
  toSide?: "left" | "right" | "top" | "bottom";
  customPoints?: { x: number; y: number }[]; // Custom control points for path
}

interface WorkflowPageProps {
  onBack?: () => void;
  workflowName?: string;
  onSave?: () => void;
}

export function WorkflowPage({
  onBack,
  workflowName = "Task Workflow",
  onSave,
}: WorkflowPageProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(workflowName);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<
    string | null
  >(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(
    null,
  );
  const [draggingNode, setDraggingNode] = useState<
    string | null
  >(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [configPopoverOpen, setConfigPopoverOpen] =
    useState(false);
  const [statusDialogOpen, setStatusDialogOpen] =
    useState(false);
  const [editingStatus, setEditingStatus] =
    useState<WorkflowNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingConnection, setIsDraggingConnection] =
    useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    side: "left" | "right" | "top" | "bottom";
    x: number;
    y: number;
  } | null>(null);
  const [connectionEnd, setConnectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<{
    nodeId: string;
    side: "left" | "right" | "top" | "bottom";
  } | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<
    string | null
  >(null);
  const [connectionPopoverOpen, setConnectionPopoverOpen] =
    useState(false);
  const [draggingControlPoint, setDraggingControlPoint] =
    useState<{ connId: string; pointIndex: number } | null>(
      null,
    );
  const [draggingEndpoint, setDraggingEndpoint] = useState<{
    connId: string;
    end: "from" | "to";
    originalConnection: WorkflowConnection;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initial workflow nodes
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: "start",
      type: "start",
      label: "START",
      x: 150,
      y: 250,
      color: "#4353FF",
      width: 80,
      height: 80,
    },
    {
      id: "todo",
      type: "status",
      label: "To Do",
      x: 300,
      y: 250,
      color: "#4353FF",
      width: 140,
      height: 70,
    },
    {
      id: "in-progress",
      type: "status",
      label: "In Progress",
      x: 500,
      y: 250,
      color: "#F59E0B",
      width: 140,
      height: 70,
    },
    {
      id: "done",
      type: "status",
      label: "Done",
      x: 700,
      y: 250,
      color: "#10B981",
      width: 140,
      height: 70,
    },
  ]);

  const [connections, setConnections] = useState<
    WorkflowConnection[]
  >([
    { id: "conn-1", from: "start", to: "todo" },
    { id: "conn-2", from: "todo", to: "in-progress" },
    { id: "conn-3", from: "in-progress", to: "done" },
  ]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleGenerateWorkflow = () => {
    if (!aiPrompt.trim()) return;
    console.log("Generating workflow from prompt:", aiPrompt);
    // AI generation logic would go here
  };

  const handleAddStatus = () => {
    // Open dialog in create mode
    setEditingStatus(null);
    setStatusDialogOpen(true);
  };

  const handleSave = () => {
    console.log("Saving workflow:", {
      name,
      nodes,
      connections,
    });

    // Show success message
    toast.success("Workflow created successfully!", {
      description: `Your workflow "${name}" has been saved and is ready to use.`,
    });

    // Call onSave callback if provided
    if (onSave) {
      onSave();
    }
  };

  // Handle status dialog save
  const handleStatusDialogSave = (status: StatusFormData) => {
    if (editingStatus) {
      // Update existing node
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingStatus.id
            ? {
                ...n,
                label: status.name,
                color: status.color,
                wipLimit: status.wipLimit,
                isDone: status.isDone,
              }
            : n,
        ),
      );
    } else {
      // Create new node
      const newNode: WorkflowNode = {
        id: `status-${Date.now()}`,
        type: "status",
        label: status.name,
        x: 400,
        y: 400,
        color: status.color,
        width: 140,
        height: 70,
        wipLimit: status.wipLimit,
        isDone: status.isDone,
      };
      setNodes([...nodes, newNode]);
    }
    setStatusDialogOpen(false);
    setEditingStatus(null);
  };

  // Get connection point coordinates based on side
  const getConnectionPointBySide = (
    nodeId: string,
    side: "left" | "right" | "top" | "bottom",
  ) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    switch (side) {
      case "left":
        return { x: node.x, y: node.y + node.height / 2 };
      case "right":
        return {
          x: node.x + node.width,
          y: node.y + node.height / 2,
        };
      case "top":
        return { x: node.x + node.width / 2, y: node.y };
      case "bottom":
        return {
          x: node.x + node.width / 2,
          y: node.y + node.height,
        };
      default:
        return null;
    }
  };

  // Get connection point coordinates - now uses stored sides or calculates default
  const getConnectionPoint = (
    conn: WorkflowConnection,
    isFrom: boolean,
  ) => {
    const nodeId = isFrom ? conn.from : conn.to;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Use stored side if available
    const storedSide = isFrom ? conn.fromSide : conn.toSide;
    if (storedSide) {
      return getConnectionPointBySide(nodeId, storedSide);
    }

    // Default to right/left middle points
    if (isFrom) {
      return {
        x: node.x + node.width,
        y: node.y + node.height / 2,
      };
    } else {
      return { x: node.x, y: node.y + node.height / 2 };
    }
  };

  // Theme-aware colors
  const isDark = theme === "dark";
  const canvasBg = isDark ? "#1a1a1a" : "#f8f9fa";
  const gridDotColor = isDark ? "#3f3f46" : "#e5e7eb";
  const connectionColor = isDark ? "#64748b" : "#334155";
  const endpointFillSelected = isDark ? "#FFFFFF" : "#f0f9ff";
  const ringOffsetColor = isDark ? "#1a1a1a" : "#f8f9fa";

  // Generate arrow polygon points based on the side it's pointing to
  const getArrowPoints = (
    point: { x: number; y: number },
    side: "left" | "right" | "top" | "bottom" | undefined,
  ): string => {
    const arrowSize = 14;
    const arrowWidth = 8;
    // Offset the arrow so it doesn't overlap with the endpoint circle
    const offset = 10;

    switch (side) {
      case "left":
        // Arrow pointing left - offset to the right
        const leftTip = { x: point.x + offset, y: point.y };
        return `${leftTip.x},${leftTip.y} ${leftTip.x + arrowSize},${leftTip.y - arrowWidth} ${leftTip.x + arrowSize},${leftTip.y + arrowWidth}`;
      case "right":
        // Arrow pointing right - offset to the left
        const rightTip = { x: point.x - offset, y: point.y };
        return `${rightTip.x},${rightTip.y} ${rightTip.x - arrowSize},${rightTip.y - arrowWidth} ${rightTip.x - arrowSize},${rightTip.y + arrowWidth}`;
      case "top":
        // Arrow pointing up - offset down
        const topTip = { x: point.x, y: point.y + offset };
        return `${topTip.x},${topTip.y} ${topTip.x - arrowWidth},${topTip.y + arrowSize} ${topTip.x + arrowWidth},${topTip.y + arrowSize}`;
      case "bottom":
        // Arrow pointing down - offset up
        const bottomTip = { x: point.x, y: point.y - offset };
        return `${bottomTip.x},${bottomTip.y} ${bottomTip.x - arrowWidth},${bottomTip.y - arrowSize} ${bottomTip.x + arrowWidth},${bottomTip.y - arrowSize}`;
      default:
        // Default to pointing left
        const defaultTip = { x: point.x + offset, y: point.y };
        return `${defaultTip.x},${defaultTip.y} ${defaultTip.x + arrowSize},${defaultTip.y - arrowWidth} ${defaultTip.x + arrowSize},${defaultTip.y + arrowWidth}`;
    }
  };

  // Draw connections between nodes
  const renderConnections = () => {
    return connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);

      if (!fromNode || !toNode) return null;

      // Use stored points or calculate defaults
      const fromPoint = getConnectionPoint(conn, true);
      const toPoint = getConnectionPoint(conn, false);

      if (!fromPoint || !toPoint) return null;

      const pathId = `path-${conn.id}`;

      // Calculate path with JIRA-style logic or custom points
      let path: string;
      let controlPoints: { x: number; y: number }[] = [];

      if (conn.customPoints && conn.customPoints.length > 0) {
        // Use custom control points if they exist
        const points = [
          fromPoint,
          ...conn.customPoints,
          toPoint,
        ];
        path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          path += ` L ${points[i].x} ${points[i].y}`;
        }
        controlPoints = conn.customPoints;
      } else {
        // Auto-generate path with default control points
        const yDiff = Math.abs(fromPoint.y - toPoint.y);
        const xDiff = toPoint.x - fromPoint.x;

        // Check if connecting from same side (e.g., top to top, bottom to bottom)
        const isSameSideConnection =
          conn.fromSide &&
          conn.toSide &&
          conn.fromSide === conn.toSide;

        if (isSameSideConnection) {
          // Create U-turn path for same-side connections
          const isTopConnection = conn.fromSide === "top";
          const isBottomConnection = conn.fromSide === "bottom";

          if (isTopConnection || isBottomConnection) {
            // For top-to-top: go up, across, down
            // For bottom-to-bottom: go down, across, up
            const uTurnDistance = isTopConnection ? -60 : 60; // Negative for up, positive for down
            const midX = (fromPoint.x + toPoint.x) / 2;

            path = `M ${fromPoint.x} ${fromPoint.y}
                    L ${fromPoint.x} ${fromPoint.y + uTurnDistance}
                    L ${toPoint.x} ${fromPoint.y + uTurnDistance}
                    L ${toPoint.x} ${toPoint.y}`;

            // Control point at the middle of the horizontal segment
            controlPoints = [
              { x: midX, y: fromPoint.y + uTurnDistance },
            ];
          } else {
            // For left-to-left or right-to-right: create horizontal U-turn
            const isLeftConnection = conn.fromSide === "left";
            const uTurnDistance = isLeftConnection ? -60 : 60; // Negative for left, positive for right
            const midY = (fromPoint.y + toPoint.y) / 2;

            path = `M ${fromPoint.x} ${fromPoint.y}
                    L ${fromPoint.x + uTurnDistance} ${fromPoint.y}
                    L ${fromPoint.x + uTurnDistance} ${toPoint.y}
                    L ${toPoint.x} ${toPoint.y}`;

            // Control point at the middle of the vertical segment
            controlPoints = [
              { x: fromPoint.x + uTurnDistance, y: midY },
            ];
          }
        } else {
          // Direct path for different-side connections (shortest route)
          // Check if it's a simple horizontal or vertical connection
          if (Math.abs(xDiff) < 10) {
            // Nearly vertical - direct vertical line
            path = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
            controlPoints = [
              {
                x: (fromPoint.x + toPoint.x) / 2,
                y: (fromPoint.y + toPoint.y) / 2,
              },
            ];
          } else if (yDiff < 10) {
            // Nearly horizontal - direct horizontal line
            path = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
            controlPoints = [
              {
                x: (fromPoint.x + toPoint.x) / 2,
                y: (fromPoint.y + toPoint.y) / 2,
              },
            ];
          } else {
            // Standard orthogonal path - choose based on connection sides
            const fromSide = conn.fromSide || "right";
            const toSide = conn.toSide || "left";

            // Determine if we should go horizontal first or vertical first
            const isHorizontalFirst =
              (fromSide === "left" || fromSide === "right") &&
              (toSide === "left" || toSide === "right");

            if (isHorizontalFirst) {
              // Horizontal then vertical
              const midX = (fromPoint.x + toPoint.x) / 2;
              path = `M ${fromPoint.x} ${fromPoint.y} L ${midX} ${fromPoint.y} L ${midX} ${toPoint.y} L ${toPoint.x} ${toPoint.y}`;
              controlPoints = [
                { x: midX, y: (fromPoint.y + toPoint.y) / 2 },
              ];
            } else {
              // Vertical then horizontal
              const midY = (fromPoint.y + toPoint.y) / 2;
              path = `M ${fromPoint.x} ${fromPoint.y} L ${fromPoint.x} ${midY} L ${toPoint.x} ${midY} L ${toPoint.x} ${toPoint.y}`;
              controlPoints = [
                { x: (fromPoint.x + toPoint.x) / 2, y: midY },
              ];
            }
          }
        }
      }

      return (
        <g key={conn.id}>
          {/* Invisible wider path for easier clicking */}
          <path
            id={pathId}
            d={path}
            stroke="transparent"
            strokeWidth="20"
            fill="none"
            style={{
              cursor: "pointer",
              pointerEvents: "stroke",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConnection(conn.id);
              setConnectionPopoverOpen(true);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setSelectedConnection(conn.id);
            }}
          />
          {/* Visible connection line */}
          <path
            d={path}
            stroke={
              selectedConnection === conn.id
                ? "#4353FF"
                : connectionColor
            }
            strokeWidth={
              selectedConnection === conn.id ? "3" : "2"
            }
            fill="none"
            markerEnd={selectedConnection === conn.id ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
            style={{ pointerEvents: "none" }}
          />
          {/* Connection point dots - draggable when connection is selected */}
          <circle
            cx={fromPoint.x}
            cy={fromPoint.y}
            r={selectedConnection === conn.id ? "6" : "4"}
            fill={selectedConnection === conn.id ? endpointFillSelected : "#4353FF"}
            stroke={selectedConnection === conn.id ? "#4353FF" : "none"}
            strokeWidth={selectedConnection === conn.id ? "2" : "0"}
            style={{
              cursor: selectedConnection === conn.id ? "grab" : "pointer",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              if (selectedConnection === conn.id) {
                handleEndpointMouseDown(conn.id, "from", e);
              }
            }}
          />
          <circle
            cx={toPoint.x}
            cy={toPoint.y}
            r={selectedConnection === conn.id ? "6" : "4"}
            fill={selectedConnection === conn.id ? endpointFillSelected : "#4353FF"}
            stroke={selectedConnection === conn.id ? "#4353FF" : "none"}
            strokeWidth={selectedConnection === conn.id ? "2" : "0"}
            style={{
              cursor: selectedConnection === conn.id ? "grab" : "pointer",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              if (selectedConnection === conn.id) {
                handleEndpointMouseDown(conn.id, "to", e);
              }
            }}
          />

          {/* Draggable control points - only show when connection is selected */}
          {selectedConnection === conn.id &&
            controlPoints.map((point, idx) => (
              <circle
                key={`control-${idx}`}
                cx={point.x}
                cy={point.y}
                r="6"
                fill={endpointFillSelected}
                stroke="#4353FF"
                strokeWidth="2"
                style={{
                  cursor: "move",
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingControlPoint({
                    connId: conn.id,
                    pointIndex: idx,
                  });
                }}
              />
            ))}
        </g>
      );
    });
  };

  // Draw temporary connection while dragging
  const renderTemporaryConnection = () => {
    if (
      !isDraggingConnection ||
      !connectionStart ||
      !connectionEnd
    )
      return null;

    const midX = (connectionStart.x + connectionEnd.x) / 2;

    // Create squared path instead of curved
    const path = `M ${connectionStart.x} ${connectionStart.y} L ${midX} ${connectionStart.y} L ${midX} ${connectionEnd.y} L ${connectionEnd.x} ${connectionEnd.y}`;

    return (
      <g>
        <path
          d={path}
          stroke="#4353FF"
          strokeWidth="2"
          strokeDasharray="5,5"
          fill="none"
          style={{ pointerEvents: "none" }}
        />
        <circle
          cx={connectionStart.x}
          cy={connectionStart.y}
          r="4"
          fill="#4353FF"
          style={{ pointerEvents: "none" }}
        />
      </g>
    );
  };

  // Check if a handle has any connections
  const handleHasConnection = (
    nodeId: string,
    side: "left" | "right" | "top" | "bottom"
  ) => {
    return connections.some(
      (c) =>
        (c.from === nodeId && c.fromSide === side) ||
        (c.to === nodeId && c.toSide === side)
    );
  };

  // Handle connection handle mouse down
  const handleConnectionHandleMouseDown = (
    nodeId: string,
    side: "left" | "right" | "top" | "bottom",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if this is the start node and if there's already a connection from it
    if (nodeId === "start") {
      const existingConnectionFromStart = connections.find((c) => c.from === "start");
      if (existingConnectionFromStart) {
        // Don't allow creating a new connection from start if one already exists
        return;
      }
    }

    const point = getConnectionPointBySide(nodeId, side);
    if (!point) return;

    setIsDraggingConnection(true);
    setConnectionStart({
      nodeId,
      side,
      x: point.x,
      y: point.y,
    });
    setConnectionEnd(point);
  };

  // Handle endpoint drag to reattach connection
  const handleEndpointMouseDown = (
    connId: string,
    end: "from" | "to",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const conn = connections.find((c) => c.id === connId);
    if (!conn) return;

    // Store the connection we're detaching
    setDraggingEndpoint({
      connId,
      end,
      originalConnection: conn,
    });

    // Get the point we're dragging FROM (the opposite end)
    const keepEndNodeId = end === "from" ? conn.to : conn.from;
    const keepEndSide = end === "from" ? conn.toSide : conn.fromSide;
    const keepPoint = getConnectionPointBySide(
      keepEndNodeId,
      keepEndSide || "right",
    );

    if (!keepPoint) return;

    // Start a new connection from the end we're keeping
    setIsDraggingConnection(true);
    setConnectionStart({
      nodeId: keepEndNodeId,
      side: keepEndSide || "right",
      x: keepPoint.x,
      y: keepPoint.y,
    });
    setConnectionEnd(keepPoint);

    // Remove the old connection
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  // Handle canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on the canvas background (not a node)
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("workflow-canvas-background") ||
      target.tagName === "svg" ||
      target.tagName === "SVG"
    ) {
      // Deselect any selected node when clicking on canvas
      setSelectedNode(null);

      // Deselect any selected connection when clicking on canvas
      if (selectedConnection) {
        setSelectedConnection(null);
        setConnectionPopoverOpen(false);
      }

      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleCanvasPanEnd = () => {
    setIsPanning(false);
  };

  // Handle wheel/trackpad events for zoom and pan
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    // Check if it's a pinch gesture (ctrlKey is set for pinch-to-zoom on trackpads)
    if (e.ctrlKey) {
      // Pinch to zoom
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.05 : 0.95;
      const newZoom = Math.min(
        Math.max(zoom * zoomFactor, 0.5),
        2,
      );

      // Zoom towards the mouse position
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the point in canvas coordinates before zoom
        const canvasX = (mouseX - panOffset.x) / zoom;
        const canvasY = (mouseY - panOffset.y) / zoom;

        // Calculate new pan offset to keep the point under the mouse
        const newPanX = mouseX - canvasX * newZoom;
        const newPanY = mouseY - canvasY * newZoom;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
    } else {
      // Two-finger scroll to pan
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
  };

  const handleCanvasPan = (e: MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();

    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  // Handle node dragging - optimized for smooth dragging
  const handleNodeMouseDown = (
    nodeId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    setDraggingNode(nodeId);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the mouse position relative to the canvas, accounting for zoom and pan
    const canvasX =
      (e.clientX - rect.left - panOffset.x) / zoom;
    const canvasY = (e.clientY - rect.top - panOffset.y) / zoom;

    // Store the offset from the mouse to the node's top-left corner
    setDragOffset({
      x: canvasX - node.x,
      y: canvasY - node.y,
    });
  };

  const handleNodeDrag = (e: MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position relative to canvas, accounting for zoom and pan
    const canvasX =
      (e.clientX - rect.left - panOffset.x) / zoom;
    const canvasY = (e.clientY - rect.top - panOffset.y) / zoom;

    // Directly update the node position without transition
    const newX = Math.max(0, canvasX - dragOffset.x);
    const newY = Math.max(0, canvasY - dragOffset.y);

    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingNode ? { ...n, x: newX, y: newY } : n,
      ),
    );
  };

  const handleConnectionDrag = (e: MouseEvent) => {
    if (!isDraggingConnection || !canvasRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const canvasX =
      (e.clientX - rect.left - panOffset.x) / zoom;
    const canvasY = (e.clientY - rect.top - panOffset.y) / zoom;

    setConnectionEnd({ x: canvasX, y: canvasY });
  };

  // Handle control point dragging
  const handleControlPointDrag = (e: MouseEvent) => {
    if (!draggingControlPoint || !canvasRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const canvasX =
      (e.clientX - rect.left - panOffset.x) / zoom;
    const canvasY = (e.clientY - rect.top - panOffset.y) / zoom;

    const { connId, pointIndex } = draggingControlPoint;

    setConnections((prev) =>
      prev.map((conn) => {
        if (conn.id !== connId) return conn;

        const fromPoint = getConnectionPoint(conn, true);
        const toPoint = getConnectionPoint(conn, false);

        if (!fromPoint || !toPoint) return conn;

        // Check if this is a same-side connection (U-turn)
        const isSameSideConnection =
          conn.fromSide &&
          conn.toSide &&
          conn.fromSide === conn.toSide;

        // Create orthogonal path with custom control point
        const customPoints: { x: number; y: number }[] = [];

        if (isSameSideConnection) {
          // Maintain U-turn structure for same-side connections
          const isTopConnection = conn.fromSide === "top";
          const isBottomConnection = conn.fromSide === "bottom";
          const isLeftConnection = conn.fromSide === "left";
          const isRightConnection = conn.fromSide === "right";

          if (isTopConnection || isBottomConnection) {
            // For top/bottom connections: maintain horizontal U-turn
            // User can only control the vertical offset (how far up/down the U goes)
            const uTurnY = canvasY; // Use the dragged Y position
            const midX = (fromPoint.x + toPoint.x) / 2;

            // Create U-turn: down from start, across, down to end
            customPoints.push(
              { x: fromPoint.x, y: uTurnY }, // Vertical from start to U-level
              { x: toPoint.x, y: uTurnY }, // Horizontal across at U-level
            );
          } else if (isLeftConnection || isRightConnection) {
            // For left/right connections: maintain vertical U-turn
            // User can only control the horizontal offset (how far left/right the U goes)
            const uTurnX = canvasX; // Use the dragged X position
            const midY = (fromPoint.y + toPoint.y) / 2;

            // Create U-turn: out from start, down/up, in to end
            customPoints.push(
              { x: uTurnX, y: fromPoint.y }, // Horizontal from start to U-level
              { x: uTurnX, y: toPoint.y }, // Vertical across at U-level
            );
          }
        } else {
          // For non-same-side connections, maintain orthogonal path
          // Determine if we should go horizontal first or vertical first
          // based on the drag position relative to start/end points
          const dragDistX = Math.abs(canvasX - fromPoint.x);
          const dragDistY = Math.abs(canvasY - fromPoint.y);

          if (dragDistX > dragDistY) {
            // Horizontal movement is dominant - create horizontal then vertical path
            // Path: from -> horizontal to dragX -> vertical to dragY -> horizontal to end
            customPoints.push(
              { x: canvasX, y: fromPoint.y }, // Horizontal from start
              { x: canvasX, y: canvasY }, // Vertical to drag point
              { x: canvasX, y: toPoint.y }, // Continue vertical to end level
            );
          } else {
            // Vertical movement is dominant - create vertical then horizontal path
            // Path: from -> vertical to dragY -> horizontal to dragX -> vertical to end
            customPoints.push(
              { x: fromPoint.x, y: canvasY }, // Vertical from start
              { x: canvasX, y: canvasY }, // Horizontal to drag point
              { x: toPoint.x, y: canvasY }, // Continue horizontal to end position
            );
          }
        }

        return { ...conn, customPoints };
      }),
    );
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (
      isDraggingConnection &&
      connectionStart &&
      canvasRef.current
    ) {
      let targetNodeId: string | null = null;
      let targetSide:
        | "left"
        | "right"
        | "top"
        | "bottom"
        | null = null;

      // First, try to use the hovered handle if it exists
      if (hoveredHandle && hoveredHandle.nodeId !== connectionStart.nodeId) {
        targetNodeId = hoveredHandle.nodeId;
        targetSide = hoveredHandle.side;
      } else {
        // Fallback: Check if we dropped near a connection handle
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const canvasX =
          (e.clientX - rect.left - panOffset.x) / zoom;
        const canvasY =
          (e.clientY - rect.top - panOffset.y) / zoom;

        const sides: ("left" | "right" | "top" | "bottom")[] = [
          "left",
          "right",
          "top",
          "bottom",
        ];

        // Check all nodes and all sides to find the closest connection point
        let minDistance = 20; // Maximum distance to snap

        for (const node of nodes) {
          for (const side of sides) {
            const point = getConnectionPointBySide(node.id, side);
            if (point) {
              const distance = Math.sqrt(
                Math.pow(canvasX - point.x, 2) +
                  Math.pow(canvasY - point.y, 2),
              );
              if (distance < minDistance) {
                minDistance = distance;
                targetNodeId = node.id;
                targetSide = side;
              }
            }
          }
        }
      }

      // Create connection if we found a target node and it's not the same as source
      if (
        targetNodeId &&
        targetSide &&
        targetNodeId !== connectionStart.nodeId
      ) {
        // Always allow creating new connections - no duplicate check
        // This allows multiple transitions to the same place
        const newConnection: WorkflowConnection = {
          id: `conn-${Date.now()}`,
          from: connectionStart.nodeId,
          to: targetNodeId,
          fromSide: connectionStart.side,
          toSide: targetSide,
        };
        setConnections([...connections, newConnection]);
      }
    }

    setDraggingNode(null);
    setIsPanning(false);
    setIsDraggingConnection(false);
    setConnectionStart(null);
    setConnectionEnd(null);
    setHoveredHandle(null);
    setDraggingControlPoint(null);
    setDraggingEndpoint(null);
  };

  useEffect(() => {
    if (draggingNode) {
      document.addEventListener("mousemove", handleNodeDrag);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleNodeDrag,
        );
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingNode, dragOffset, zoom, panOffset]);

  useEffect(() => {
    if (isPanning) {
      document.addEventListener("mousemove", handleCanvasPan);
      document.addEventListener("mouseup", handleCanvasPanEnd);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleCanvasPan,
        );
        document.removeEventListener(
          "mouseup",
          handleCanvasPanEnd,
        );
      };
    }
  }, [isPanning, panStart]);

  useEffect(() => {
    if (isDraggingConnection) {
      document.addEventListener(
        "mousemove",
        handleConnectionDrag,
      );
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleConnectionDrag,
        );
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDraggingConnection,
    connectionStart,
    zoom,
    panOffset,
    nodes,
    connections,
  ]);

  useEffect(() => {
    if (draggingControlPoint) {
      document.addEventListener(
        "mousemove",
        handleControlPointDrag,
      );
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleControlPointDrag,
        );
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    draggingControlPoint,
    zoom,
    panOffset,
    nodes,
    connections,
  ]);

  // Add wheel event listener for trackpad/mouse wheel support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, panOffset]);

  // Handle keyboard shortcuts for deleting transitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedConnection
      ) {
        // Prevent default browser behavior (e.g., going back in history)
        e.preventDefault();

        // Check if this connection is from start node - don't allow deletion
        const connection = connections.find((c) => c.id === selectedConnection);
        if (connection && connection.from === "start") {
          return; // Don't delete connections from start
        }

        // Delete the selected connection
        setConnections((prev) =>
          prev.filter((c) => c.id !== selectedConnection),
        );
        setSelectedConnection(null);
        setConnectionPopoverOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedConnection, connections]);

  const handleNodeClick = (
    nodeId: string,
    e: React.MouseEvent,
  ) => {
    if (draggingNode) return; // Don't select while dragging
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.type === "start") return; // Don't open popover for start node

    // If clicking the same node, toggle the popover
    if (selectedNode === nodeId) {
      setConfigPopoverOpen(!configPopoverOpen);
    } else {
      // If clicking a different node, select it and open popover
      setSelectedNode(nodeId);
      setConfigPopoverOpen(true);
    }
  };

  const handleNodeDoubleClick = (
    nodeId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.type === "status") {
      // Open full dialog in edit mode
      setEditingStatus(node);
      setStatusDialogOpen(true);
      setConfigPopoverOpen(false);
    }
  };

  // Get currently selected node
  const currentNode = selectedNode
    ? nodes.find((n) => n.id === selectedNode)
    : null;

  const handleStatusUpdate = () => {
    setSelectedNode(null);
    setConfigPopoverOpen(false);
  };

  const handleStatusDelete = () => {
    if (!selectedNode) return;
    // Delete the node
    setNodes((prev) =>
      prev.filter((n) => n.id !== selectedNode),
    );
    // Delete all connections related to this node
    setConnections((prev) =>
      prev.filter(
        (c) => c.from !== selectedNode && c.to !== selectedNode,
      ),
    );
    setSelectedNode(null);
    setConfigPopoverOpen(false);
  };

  const ConfigPopover = ({ node }: { node: WorkflowNode }) => (
    <PopoverContent className="w-80 bg-[var(--popover)] border-[var(--border)] p-0">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-[var(--popover-foreground)] font-medium">
          Configure Status
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Update the status configuration for your workflow.
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-[var(--foreground)] text-sm">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={node.label}
            onChange={(e) => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === node.id
                    ? { ...n, label: e.target.value }
                    : n,
                ),
              );
            }}
            className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--foreground)] text-sm">
            Color
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-7 h-7 rounded-md transition-all ${
                    node.color === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--popover)]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === node.id ? { ...n, color } : n,
                      ),
                    );
                  }}
                />
              ))}
            </div>
            <Input
              value={node.color}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith("#")) {
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === node.id
                        ? { ...n, color: value }
                        : n,
                    ),
                  );
                }
              }}
              className="w-24 bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] text-xs font-mono focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF]"
              placeholder="#6B7FED"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-[var(--input)] border-red-900/50 text-red-400 hover:bg-red-950 hover:text-red-300"
          onClick={handleStatusDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedNode(null);
              setConfigPopoverOpen(false);
            }}
            className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleStatusUpdate}
            className="bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white"
          >
            Update Status
          </Button>
        </div>
      </div>
    </PopoverContent>
  );

  const ConnectionPopover = () => {
    const connection = connections.find(
      (c) => c.id === selectedConnection,
    );
    if (!connection) return null;

    const fromNode = nodes.find(
      (n) => n.id === connection.from,
    );
    const toNode = nodes.find((n) => n.id === connection.to);

    // Calculate the middle point of the connection for popover positioning
    const fromPoint = getConnectionPoint(connection, true);
    const toPoint = getConnectionPoint(connection, false);

    if (!fromPoint || !toPoint) return null;

    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;

    return (
      <Popover
        open={connectionPopoverOpen}
        onOpenChange={setConnectionPopoverOpen}
      >
        <PopoverTrigger asChild>
          <div
            style={{
              position: "absolute",
              left: midX,
              top: midY,
              width: 1,
              height: 1,
              pointerEvents: "none",
            }}
          />
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 bg-[var(--popover)] border-[var(--border)] p-4"
          side="right"
          align="start"
          sideOffset={20}
        >
          <div className="space-y-4">
            <h3 className="text-[var(--popover-foreground)] text-sm">
              Transition
            </h3>
            <div className="space-y-2">
              <div className="text-xs text-[var(--muted-foreground)]">
                <span className="text-[var(--foreground)]">
                  {fromNode?.label}
                </span>
                <span className="mx-2">→</span>
                <span className="text-[var(--foreground)]">
                  {toNode?.label}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--muted-foreground)] text-xs">
                  Transition Label
                </Label>
                <Input
                  value={connection.label || ""}
                  onChange={(e) => {
                    setConnections((prev) =>
                      prev.map((c) =>
                        c.id === selectedConnection
                          ? { ...c, label: e.target.value }
                          : c,
                      ),
                    );
                  }}
                  placeholder="Optional label"
                  className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)]">
              {connection.from === "start" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="outline"
                        className="w-full gap-2 h-9 bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50"
                        disabled
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Transition
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start transition cannot be deleted. You can move it to another status.</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2 h-9 bg-[var(--input)] border-red-900/50 text-red-400 hover:bg-red-950 hover:text-red-300"
                  onClick={() => {
                    setConnections((prev) =>
                      prev.filter(
                        (c) => c.id !== selectedConnection,
                      ),
                    );
                    setSelectedConnection(null);
                    setConnectionPopoverOpen(false);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Transition
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff] h-9 w-[300px]"
            placeholder="Workflow name"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-4 bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all"
          >
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* AI Panel Toggle Button - On Border */}
        {!showAiPanel && (
          <button
            onClick={() => setShowAiPanel(true)}
            className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-[#4353ff] to-[#5b5fed] hover:from-[#3343ef] hover:to-[#4b4fdd] border-r border-[#7c5ff0] z-50 flex flex-col items-center justify-center gap-2 transition-all group shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40"
          >
            <ChevronRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span
                className="text-white text-[9px] font-medium writing-mode-vertical transform rotate-180"
                style={{ writingMode: "vertical-rl" }}
              >
                AI
              </span>
            </div>
          </button>
        )}

        {/* AI Prompt Panel - Left Sidebar - Toggleable */}
        <div
          className={`bg-[var(--card)] border-r border-[var(--border)] transition-all duration-300 flex flex-col relative ${
            showAiPanel ? "w-[280px]" : "w-0"
          }`}
        >
          {showAiPanel && (
            <>
              <div className="flex-1 flex flex-col p-4 pr-9 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[var(--foreground)] flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-[#4353FF]" />
                    AI workflow prompt
                  </h3>
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) =>
                      setAiPrompt(e.target.value)
                    }
                    placeholder="Describe the workflow you want..."
                    className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] resize-y text-sm"
                    rows={3}
                    style={{ minHeight: "60px" }}
                  />

                  <Button
                    onClick={handleGenerateWorkflow}
                    disabled={!aiPrompt.trim()}
                    className="group relative gap-2 h-9 px-4 bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white shadow-lg shadow-[#4353ff]/30 hover:shadow-[#4353ff]/50 transition-all duration-300 overflow-hidden border border-[#5b5fed]/30 hover:border-[#7c5ff0]/50 w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <Sparkles className="relative w-3.5 h-3.5" />
                    <span className="relative">
                      Generate workflow
                    </span>
                  </Button>

                  <div className="border-t border-[var(--border)] pt-3">
                    <Button
                      onClick={handleAddStatus}
                      variant="outline"
                      className="w-full gap-2 h-9 bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] text-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Status
                    </Button>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] bg-[var(--input)] p-2.5 rounded-lg border border-[var(--border)]">
                    <p className="mb-1.5">
                      <strong className="text-[var(--foreground)]">
                        Tips:
                      </strong>
                    </p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Drag canvas to pan</li>
                      <li>Drag nodes to reposition</li>
                      <li>Drag from borders to connect</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Collapse Button - Right Edge of Sidebar */}
              <button
                onClick={() => setShowAiPanel(false)}
                className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-r from-[#4353ff] to-[#5b5fed] hover:from-[#3343ef] hover:to-[#4b4fdd] border-l border-[#7c5ff0] z-50 flex flex-col items-center justify-center gap-2 transition-all group shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white group-hover:-translate-x-0.5 transition-transform" />
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span
                    className="text-white text-[9px] font-medium writing-mode-vertical transform rotate-180"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    AI
                  </span>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: canvasBg }}>
          {/* Canvas Toolbar */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddStatus}
                size="sm"
                variant="outline"
                className="gap-2 h-9 bg-[var(--accent)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Status
              </Button>
              <Button
                onClick={handleFitToView}
                size="sm"
                variant="outline"
                className="gap-2 h-9 bg-[var(--accent)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Fit to view
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleZoomOut}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-[var(--muted-foreground)] text-sm min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                onClick={handleZoomIn}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className={`flex-1 overflow-hidden relative workflow-canvas-background ${
              isPanning ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              backgroundColor: canvasBg,
              backgroundImage: `radial-gradient(circle, ${gridDotColor} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
            onMouseDown={handleCanvasMouseDown}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                minWidth: "1400px",
                minHeight: "900px",
                width: "fit-content",
                height: "fit-content",
                position: "relative",
                padding: "50px",
                pointerEvents: "none",
              }}
            >
              <svg
                width="1400"
                height="900"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="2.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0 0, 5 2.5, 0 5"
                      fill={connectionColor}
                    />
                  </marker>
                  <marker
                    id="arrowhead-selected"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="2.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0 0, 5 2.5, 0 5"
                      fill="#4353FF"
                    />
                  </marker>
                </defs>
                {renderConnections()}
                {renderTemporaryConnection()}
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute select-none ${
                    draggingNode !== node.id
                      ? "cursor-move"
                      : "cursor-grabbing"
                  } ${node.type === "start" ? "rounded-full" : ""} shadow-lg hover:shadow-xl`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                    zIndex: 10,
                    transition:
                      draggingNode === node.id
                        ? "none"
                        : "box-shadow 0.2s",
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onDoubleClick={(e) =>
                    handleNodeDoubleClick(node.id, e)
                  }
                  onMouseDown={(e) =>
                    handleNodeMouseDown(node.id, e)
                  }
                  onMouseEnter={() => {
                    // Only set hovered node if not dragging
                    if (!draggingNode && !isDraggingConnection) {
                      setHoveredNode(node.id);
                    }
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {node.type === "start" ? (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white relative overflow-hidden"
                      style={{
                        backgroundColor: node.color,
                      }}
                    >
                      <span className="font-semibold text-sm">
                        {node.label}
                      </span>
                      {/* Connection handles - show when hovered */}
                      {hoveredNode === node.id && (
                        <>
                          {/* Top connection handle */}
                          <div
                            className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "top",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "top" });
                              } else if (!handleHasConnection(node.id, "top")) {
                                handleConnectionHandleMouseDown(node.id, "top", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Bottom connection handle */}
                          <div
                            className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "bottom",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "bottom" });
                              } else if (!handleHasConnection(node.id, "bottom")) {
                                handleConnectionHandleMouseDown(node.id, "bottom", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Left connection handle */}
                          <div
                            className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "left",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "left" });
                              } else if (!handleHasConnection(node.id, "left")) {
                                handleConnectionHandleMouseDown(node.id, "left", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Right connection handle */}
                          <div
                            className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "right",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "right" });
                              } else if (!handleHasConnection(node.id, "right")) {
                                handleConnectionHandleMouseDown(node.id, "right", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-full h-full rounded-lg flex items-center justify-center text-white px-4 relative overflow-hidden ${
                        selectedNode === node.id
                          ? "ring-2 ring-[#4353FF] ring-offset-2"
                          : ""
                      }`}
                      style={{ 
                        backgroundColor: node.color,
                        ...(selectedNode === node.id && {
                          '--tw-ring-offset-color': ringOffsetColor,
                        } as React.CSSProperties)
                      }}
                    >
                      <span className="truncate font-medium text-sm">
                        {node.label}
                      </span>
                      {/* Connection handles - show when selected OR hovered */}
                      {(selectedNode === node.id ||
                        hoveredNode === node.id) && (
                        <>
                          {/* Top connection handle */}
                          <div
                            className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "top",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "top" });
                              } else if (!handleHasConnection(node.id, "top")) {
                                handleConnectionHandleMouseDown(node.id, "top", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Bottom connection handle */}
                          <div
                            className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "bottom",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "bottom" });
                              } else if (!handleHasConnection(node.id, "bottom")) {
                                handleConnectionHandleMouseDown(node.id, "bottom", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Left connection handle */}
                          <div
                            className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "left",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "left" });
                              } else if (!handleHasConnection(node.id, "left")) {
                                handleConnectionHandleMouseDown(node.id, "left", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                          {/* Right connection handle */}
                          <div
                            className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#4353FF] cursor-crosshair hover:scale-125 transition-transform"
                            style={{ zIndex: 100 }}
                            onMouseDown={(e) =>
                              handleConnectionHandleMouseDown(
                                node.id,
                                "right",
                                e,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle({ nodeId: node.id, side: "right" });
                              } else if (!handleHasConnection(node.id, "right")) {
                                handleConnectionHandleMouseDown(node.id, "right", e as any);
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              if (isDraggingConnection) {
                                setHoveredHandle(null);
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Connection Popover */}
              {connectionPopoverOpen && <ConnectionPopover />}
            </div>
          </div>
          
          {/* Config Popover for selected node - Outside transformed container to prevent flickering */}
          {configPopoverOpen && currentNode && (
            <Popover
              open={configPopoverOpen}
              onOpenChange={setConfigPopoverOpen}
            >
              <PopoverTrigger asChild>
                <div
                  style={{
                    position: "absolute",
                    left: (currentNode.x + currentNode.width / 2) * zoom + panOffset.x,
                    top: (currentNode.y + currentNode.height + 10) * zoom + panOffset.y,
                    width: 1,
                    height: 1,
                    pointerEvents: "none",
                  }}
                />
              </PopoverTrigger>
              <ConfigPopover node={currentNode} />
            </Popover>
          )}
        </div>
      </div>

      {/* Add Status Dialog - Matches Board's design exactly */}
      <AddStatusDialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) setEditingStatus(null);
        }}
        onSave={handleStatusDialogSave}
        editStatus={
          editingStatus
            ? {
                id: editingStatus.id,
                name: editingStatus.label,
                key: editingStatus.id,
                color: editingStatus.color,
                wipLimit: editingStatus.wipLimit,
                isDone: editingStatus.isDone || false,
              }
            : null
        }
      />
    </div>
  );
}