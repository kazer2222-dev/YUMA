'use client';

import { useState } from 'react';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface ClickUpHeaderProps {
  onMenuClick?: () => void;
  onCreateTask?: () => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  userInitial?: string;
  userName?: string;
}

export function ClickUpHeader({
  onMenuClick,
  onCreateTask,
  onSearch,
  showSearch = true,
  searchPlaceholder = 'Search tasks...',
  userInitial = 'A',
  userName = 'admin',
}: ClickUpHeaderProps) {
  const [query, setQuery] = useState('');

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
        <div className="flex items-center gap-2 rounded-md p-1.5">
          <Avatar className="h-8 w-8 bg-[var(--primary)] text-white">
            <AvatarFallback className="bg-[var(--primary)] text-white">
              {userInitial ? userInitial[0]?.toUpperCase() : 'A'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{userName}</span>
        </div>
      </div>
    </div>
  );
}

