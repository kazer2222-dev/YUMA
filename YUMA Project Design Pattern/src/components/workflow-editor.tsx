import { useState, useRef, useEffect } from "react";
import {
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface WorkflowNode {
  id: string;
  type: "start" | "status" | "end";
  label: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

interface WorkflowConnection {
  from: string;
  to: string;
}

interface WorkflowEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  workflowName?: string;
  standalone?: boolean;
}

export function WorkflowEditor({
  open = false,
  onOpenChange,
  onClose,
  workflowName = "New Workflow",
  standalone = false,
}: WorkflowEditorProps) {
  const [name, setName] = useState(workflowName);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initial workflow nodes - positioned more visibly in the center
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

  const [connections] = useState<WorkflowConnection[]>([
    { from: "start", to: "todo" },
    { from: "todo", to: "in-progress" },
    { from: "in-progress", to: "done" },
  ]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToView = () => {
    setZoom(1);
  };

  const handleGenerateWorkflow = () => {
    if (!aiPrompt.trim()) return;
    console.log("Generating workflow from prompt:", aiPrompt);
    // AI generation logic would go here
  };

  const handleAddStatus = () => {
    const newNode: WorkflowNode = {
      id: `status-${Date.now()}`,
      type: "status",
      label: "New Status",
      x: 400,
      y: 300,
      color: "#8B5CF6",
      width: 120,
      height: 60,
    };
    setNodes([...nodes, newNode]);
  };

  const handleSave = () => {
    console.log("Saving workflow:", { name, nodes, connections });
    onOpenChange?.(false);
  };

  // Draw connections between nodes
  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);

      if (!fromNode || !toNode) return null;

      const fromX = fromNode.x + fromNode.width;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x;
      const toY = toNode.y + toNode.height / 2;

      const midX = (fromX + toX) / 2;

      return (
        <g key={index}>
          {/* Connection line */}
          <path
            d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
            stroke="#4a4d5a"
            strokeWidth="2"
            fill="none"
          />
          {/* Arrow */}
          <polygon
            points={`${toX},${toY} ${toX - 8},${toY - 5} ${toX - 8},${toY + 5}`}
            fill="#4a4d5a"
          />
          {/* Connection point dots */}
          <circle cx={fromX} cy={fromY} r="4" fill="#4353FF" />
          <circle cx={toX} cy={toY} r="4" fill="#4353FF" />
        </g>
      );
    });
  };

  // Handle node dragging
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x * zoom,
      y: e.clientY - node.y * zoom,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingNode
          ? {
              ...n,
              x: (e.clientX - rect.left - dragOffset.x) / zoom,
              y: (e.clientY - rect.top - dragOffset.y) / zoom,
            }
          : n
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  useEffect(() => {
    if (draggingNode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingNode, dragOffset, zoom]);

  const editorContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff] h-9"
            placeholder="Workflow name"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange?.(false);
              onClose?.();
            }}
            className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            Close
          </Button>
          <Button
            size="sm"
            className="h-8 px-4 bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white"
          >
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Prompt Panel - Left Sidebar */}
        <div
          className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col ${
            showAiPanel ? "w-[380px]" : "w-0"
          }`}
        >
          {showAiPanel && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4353FF]" />
                  AI workflow prompt
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAiPanel(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the workflow you want. Mention stages like design, review, QA, deployment..."
                    className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] resize-none min-h-[200px]"
                  />
                </div>

                <Button
                  onClick={handleGenerateWorkflow}
                  disabled={!aiPrompt.trim()}
                  className="group relative gap-2 h-11 px-6 bg-gradient-to-r from-[#4353ff] via-[#5b5fed] to-[#7c5ff0] hover:from-[#3343ef] hover:via-[#4b4fdd] hover:to-[#6c4fe0] text-white shadow-lg shadow-[#4353ff]/30 hover:shadow-[#4353ff]/50 transition-all duration-300 overflow-hidden border border-[#5b5fed]/30 hover:border-[#7c5ff0]/50 w-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Sparkles className="relative w-4 h-4" />
                  <span className="relative">Generate workflow from prompt</span>
                </Button>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <Button
                    onClick={handleAddStatus}
                    variant="outline"
                    className="w-full gap-2 h-10 bg-white border-gray-300 text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Plus className="w-4 h-4" />
                    Add Status
                  </Button>

                  <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                    <p className="mb-2">
                      <strong className="text-gray-900">Tips:</strong>
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Drag nodes to reposition them</li>
                      <li>Click nodes to configure</li>
                      <li>Use AI to generate complex workflows</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle AI Panel Button */}
        {!showAiPanel && (
          <div className="flex-shrink-0 bg-gray-50 border-r border-gray-200 flex items-center justify-center w-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAiPanel(true)}
              className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddStatus}
                size="sm"
                variant="outline"
                className="gap-2 h-9 bg-white border-gray-300 text-gray-900 hover:bg-gray-100 hover:text-gray-900"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Status
              </Button>
              <Button
                onClick={handleFitToView}
                size="sm"
                variant="outline"
                className="gap-2 h-9 bg-white border-gray-300 text-gray-900 hover:bg-gray-100 hover:text-gray-900"
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
                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-gray-600 text-sm min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                onClick={handleZoomIn}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-auto bg-gray-50 relative"
            style={{
              backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
                minWidth: "1200px",
                minHeight: "800px",
                width: "1200px",
                height: "800px",
                position: "relative",
              }}
            >
              <svg
                width="1200"
                height="800"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                  </marker>
                </defs>
                {renderConnections()}
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute cursor-move transition-all z-10 ${
                    selectedNode === node.id
                      ? "ring-2 ring-[#4353FF] ring-offset-2 ring-offset-gray-50"
                      : ""
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                  }}
                  onClick={() => setSelectedNode(node.id)}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                >
                  {node.type === "start" ? (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white text-xs border-2"
                      style={{ 
                        backgroundColor: node.color,
                        borderColor: node.color,
                      }}
                    >
                      {node.label}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full rounded-lg flex items-center justify-center text-white px-4 shadow-lg relative group"
                      style={{ backgroundColor: node.color }}
                    >
                      <span className="truncate">{node.label}</span>

                      {/* Node action buttons */}
                      {selectedNode === node.id && node.type === "status" && (
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 bg-white hover:bg-gray-100 text-gray-900 rounded-md shadow"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 bg-white hover:bg-red-500 text-gray-900 hover:text-white rounded-md shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
                              setSelectedNode(null);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Configuration */}
        <div className="w-[320px] bg-gray-50 border-l border-gray-200 p-6 overflow-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <h3 className="text-gray-900">
                Configure Status
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Status Name</Label>
                  <Input
                    value={nodes.find((n) => n.id === selectedNode)?.label || ""}
                    onChange={(e) => {
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode
                            ? { ...n, label: e.target.value }
                            : n
                        )
                      );
                    }}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Color</Label>
                  <div className="flex gap-2">
                    {["#4353FF", "#8B5CF6", "#10B981", "#F59E0B", "##EF4444"].map(
                      (color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-md border-2 ${
                            nodes.find((n) => n.id === selectedNode)?.color ===
                            color
                              ? "border-gray-900"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode ? { ...n, color } : n
                              )
                            );
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-9 bg-white border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
                      setSelectedNode(null);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Status
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-gray-200 mb-3">
                <Sparkles className="w-6 h-6 text-[#4353FF]" />
              </div>
              <p className="text-gray-600 text-sm">
                Select a status node or a transition edge to configure details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If standalone mode, render content directly
  if (standalone) {
    return editorContent;
  }

  // Otherwise, wrap in Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] h-[90vh] bg-white border-gray-300 p-0 gap-0 overflow-hidden flex flex-col"
        hideClose
      >
        <DialogHeader className="hidden">
          <DialogTitle>Workflow Editor</DialogTitle>
          <DialogDescription>Edit your workflow diagram</DialogDescription>
        </DialogHeader>

        {editorContent}
      </DialogContent>
    </Dialog>
  );
}