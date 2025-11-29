'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Bell, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface ClickUpHeaderProps {
  onMenuClick?: () => void;
  onCreateTask?: () => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  userInitial?: string;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export function ClickUpHeader({
  onMenuClick,
  onCreateTask,
  onSearch,
  showSearch = true,
  searchPlaceholder = 'Search tasks...',
  userInitial = 'A',
  userName = 'admin',
  userAvatar,
  userEmail,
  onLogout,
}: ClickUpHeaderProps) {
  const [query, setQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const openUserMenu = () => {
    if (userMenuCloseTimer.current) {
      clearTimeout(userMenuCloseTimer.current);
      userMenuCloseTimer.current = null;
    }
    setUserMenuOpen(true);
  };

  const scheduleCloseUserMenu = () => {
    if (userMenuCloseTimer.current) clearTimeout(userMenuCloseTimer.current);
    userMenuCloseTimer.current = setTimeout(() => setUserMenuOpen(false), 150);
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-3 sm:px-6">
      <Button
        variant='ghost'
        size='icon'
        className="lg:hidden h-9 w-9 mr-2"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {showSearch && (
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 bg-[var(--input-background)] border-[var(--border)] h-9"
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          className="h-9 px-2 sm:px-4 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          onClick={onCreateTask}
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Create Task</span>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" style={{ color: '#4353FF' }} />
        </Button>
        <div 
          className="relative flex items-center gap-2 rounded-md p-1.5 cursor-pointer hover:bg-[var(--hover)] transition-colors"
          onMouseEnter={openUserMenu}
          onMouseLeave={scheduleCloseUserMenu}
        >
          <Avatar className="h-8 w-8 bg-[var(--primary)] text-white">
            <AvatarImage src={userAvatar} alt={userName || userEmail || ''} />
            <AvatarFallback className="bg-[var(--primary)] text-white">
              {userInitial ? userInitial[0]?.toUpperCase() : 'A'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{userName}</span>
          
          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-md border border-border bg-popover shadow-lg transition ease-out duration-150 transform opacity-100 translate-y-0"
              onMouseEnter={openUserMenu}
              onMouseLeave={scheduleCloseUserMenu}
            >
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-t-md flex items-center gap-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push('/profile');
                }}
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-md flex items-center gap-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

