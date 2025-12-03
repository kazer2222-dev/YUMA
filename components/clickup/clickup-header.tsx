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
  searchPlaceholder = 'Search tasks or documents...',
  userInitial = 'A',
  userName = 'admin',
  userAvatar,
  userEmail,
  onLogout,
}: ClickUpHeaderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
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

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    if (!value.trim()) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    searchDebounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch?.(query);
    }
  };

  const handleResultClick = (result: any) => {
    setShowSuggestions(false);
    setQuery('');
    router.push(result.url);
  };

  return (
    <div className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-3 sm:px-6 relative z-50">
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
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim()) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding to allow click on result
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={searchPlaceholder}
              className="pl-9 bg-[var(--input-background)] border-[var(--border)] h-9"
            />

            {/* Search Suggestions Dropdown */}
            {showSuggestions && (query.trim().length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg overflow-hidden max-h-[400px] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {/* Tasks Section */}
                    {results.some(r => r.type === 'task') && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        Tasks
                      </div>
                    )}
                    {results.filter(r => r.type === 'task').map((result) => (
                      <button
                        key={result.id}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--accent)] flex items-center gap-3 transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: result.statusColor || '#ccc' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-[var(--foreground)]">
                            {result.title}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                            <span className="font-mono">{result.subtitle}</span>
                            <span>•</span>
                            <span>{result.space.name}</span>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Documents Section */}
                    {results.some(r => r.type === 'document') && (
                      <>
                        <div className="h-px bg-[var(--border)] my-1" />
                        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          Documents
                        </div>
                      </>
                    )}
                    {results.filter(r => r.type === 'document').map((result) => (
                      <button
                        key={result.id}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--accent)] flex items-center gap-3 transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="shrink-0 text-[var(--muted-foreground)]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-[var(--foreground)]">
                            {result.title}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                            <span>Document</span>
                            <span>•</span>
                            <span>{result.space.name}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                    No results found.
                  </div>
                )}
              </div>
            )}
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
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-t-md flex items-center gap-2 cursor-pointer transition-colors focus:outline-none focus:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserMenuOpen(false);
                  router.push('/profile');
                }}
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-destructive rounded-b-md flex items-center gap-2 cursor-pointer transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/20 active:bg-red-100 dark:active:bg-red-950/30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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

