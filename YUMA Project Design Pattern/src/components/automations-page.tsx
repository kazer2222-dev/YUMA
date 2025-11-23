import { useState } from "react";
import { AutomationsList } from "./automations-list";
import { AutomationBuilder } from "./automation-builder";
import { AutomationAuditLog } from "./automation-audit-log";
import { Button } from "./ui/button";
import { List, History, Plus, Zap } from "lucide-react";

interface AutomationsPageProps {
  onBack?: () => void;
}

export function AutomationsPage({ onBack }: AutomationsPageProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"list" | "audit">("list");

  const handleCreateNew = () => {
    setEditingAutomation(null);
    setShowBuilder(true);
  };

  const handleEdit = (automation: any) => {
    setEditingAutomation(automation);
    setShowBuilder(true);
  };

  const handleSave = () => {
    // Automation saved, go back to list
    setShowBuilder(false);
  };

  const handleBuilderBack = () => {
    setShowBuilder(false);
  };

  // Show builder in full screen or show list
  if (showBuilder) {
    return <AutomationBuilder onBack={handleBuilderBack} onSave={handleSave} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Header with Title and Actions */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[var(--foreground)]">Automations</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Create rules to automate your workflows
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-1 px-6 py-2">
          <Button
            variant={activeTab === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("list")}
            className={
              activeTab === "list"
                ? "bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            }
          >
            <List className="w-4 h-4 mr-2" />
            Automations
          </Button>
          <Button
            variant={activeTab === "audit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("audit")}
            className={
              activeTab === "audit"
                ? "bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            }
          >
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "list" ? (
          <AutomationsList onCreateNew={handleCreateNew} onEdit={handleEdit} />
        ) : (
          <AutomationAuditLog />
        )}
      </div>
    </div>
  );
}