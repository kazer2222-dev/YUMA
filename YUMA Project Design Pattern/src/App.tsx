import { useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { ClickUpSidebar } from "./components/clickup-sidebar";
import { MobileSidebar } from "./components/mobile-sidebar";
import { ClickUpHeader } from "./components/clickup-header";
import { HomePage } from "./components/home-page";
import { SpaceOverview } from "./components/space-overview";
import { CreateSpacePage } from "./components/create-space-page";
import { findSpaceForBoard } from "./lib/navigation-data";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [selectedSpace, setSelectedSpace] = useState<
    string | null
  >(null);
  const [selectedBoard, setSelectedBoard] = useState<
    string | null
  >(null);
  const [showCreateSpacePage, setShowCreateSpacePage] =
    useState(false);

  const handleSpaceSelect = (spaceId: string) => {
    setSelectedSpace(spaceId);
    setSelectedBoard(null); // Clear board selection when space is selected
  };

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoard(boardId);
    // Find which space this board belongs to
    const space = findSpaceForBoard(boardId);
    setSelectedSpace(space?.id || null);
  };

  const handleCreateSpace = () => {
    setShowCreateSpacePage(true);
  };

  const handleSpaceCreated = (spaceName: string) => {
    setShowCreateSpacePage(false);
    // Additional logic to add the new space to navigation can be added here
  };

  const handleCancelCreateSpace = () => {
    setShowCreateSpacePage(false);
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <ClickUpSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() =>
            setSidebarCollapsed(!sidebarCollapsed)
          }
          onSpaceSelect={handleSpaceSelect}
          onBoardSelect={handleBoardSelect}
          selectedSpace={selectedSpace}
          selectedBoard={selectedBoard}
          onCreateSpace={handleCreateSpace}
        />

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          onSpaceSelect={(space) => {
            handleSpaceSelect(space);
            setMobileMenuOpen(false);
          }}
          onBoardSelect={(board) => {
            handleBoardSelect(board);
            setMobileMenuOpen(false);
          }}
          selectedSpace={selectedSpace}
          selectedBoard={selectedBoard}
          onCreateSpace={handleCreateSpace}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <ClickUpHeader
            onMenuClick={() => setMobileMenuOpen(true)}
            currentSpace={selectedSpace}
            currentBoard={selectedBoard}
          />

          {/* Page Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {showCreateSpacePage ? (
              <CreateSpacePage
                onCancel={handleCancelCreateSpace}
                onSpaceCreated={handleSpaceCreated}
              />
            ) : selectedSpace ? (
              <SpaceOverview
                spaceId={selectedSpace}
                boardId={selectedBoard}
              />
            ) : (
              <HomePage />
            )}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}