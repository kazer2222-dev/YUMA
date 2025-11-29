'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  Settings, 
  HelpCircle, 
  User,
  Menu,
  X,
  Plus,
  Share,
  MoreHorizontal,
  LogOut,
  Loader2
} from 'lucide-react';

interface NotionPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ name: string; href?: string }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  user?: {
    name?: string;
    email: string;
    avatar?: string;
  };
  onUserMenuClick?: () => void;
  onCreateTask?: () => void;
  onLogout?: () => void;
  hideTitle?: boolean;
  centerSearchAndCreate?: boolean;
}

export function NotionPageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  showSearch = false,
  onSearch,
  user,
  onUserMenuClick,
  onCreateTask,
  onLogout,
  hideTitle = false,
  centerSearchAndCreate = false
}: NotionPageHeaderProps) {
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuCloseTimer = useRef<NodeJS.Timeout | null>(null);

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

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleInputFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsSearchFocused(true);
    if (searchQuery.trim().length >= 1) {
      performSearch(searchQuery);
    }
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  const handleSearchResultClick = (result: any) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    if (result.space?.slug && result.id) {
      router.push(`/spaces/${result.space.slug}/tasks/${result.id}`);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (userMenuCloseTimer.current) clearTimeout(userMenuCloseTimer.current);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="notion-page-header sticky top-0 z-50" style={{ backgroundColor: '#0f1014', borderBottom: '1px solid #1e1f24', height: '49px', width: '100%' }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[49px] relative" style={{ boxSizing: 'border-box', width: '1297px', marginLeft: '21px' }}>
        {/* Search input - exact Figma positioning from node 17:1906 */}
        {showSearch && !centerSearchAndCreate && (
          <div className="absolute h-[31.5px] left-0 top-[8.25px] w-[588px]">
            <form onSubmit={handleSearch} className="relative h-full w-full">
              <div className="absolute bg-[#1a1b20] border border-[#1e1f24] border-solid h-[31.5px] left-0 rounded-[5px] top-0 w-[588px]">
                <div className="box-border content-stretch flex h-[31.5px] items-center overflow-clip pl-[31.5px] pr-[10.5px] py-[3.5px] relative rounded-[inherit] w-[588px]">
                  <Search className="absolute left-[10.5px] top-[8.75px] h-[14px] w-[14px] text-[#7d8089]" />
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="h-full w-full bg-transparent border-0 pl-0 pr-0 text-[12.25px]"
                    style={{ 
                      color: '#7d8089',
                      paddingLeft: '0',
                      paddingRight: '0',
                      fontSize: '12.25px',
                      lineHeight: 'normal'
                    }}
                  />
                </div>
              </div>
              
              {/* Suggestions Dropdown */}
              {searchQuery && searchQuery.trim().length >= 1 && isSearchFocused && (
                <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
                  {searchLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="py-1">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-foreground font-mono mb-1">
                                {result.key}
                              </div>
                              <div className="text-sm font-medium line-clamp-2">
                                {result.summary}
                              </div>
                            </div>
                            <Badge variant="outline" className="flex-shrink-0 text-xs">
                              {result.space.name}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No results found for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
        
        {/* Right side container - exact Figma positioning from node 17:1912 */}
        {/* From metadata: x=1064.359375, width=253.640625, total header width=1339 */}
        {/* So right position = 1339 - 1064.359375 - 253.640625 = 21px */}
        <div className="absolute h-[31.5px] right-[21px] top-[8.25px] w-[253.641px]">
          {/* Create Task Button */}
          {onCreateTask && !centerSearchAndCreate && (
            <div 
              className="absolute bg-[#4353ff] h-[31.5px] left-0 rounded-[5px] top-0 w-[118.781px] cursor-pointer" 
              onClick={onCreateTask} 
              style={{ transition: 'all 150ms', boxSizing: 'border-box' }} 
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3644cc'} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4353ff'}
            >
              <Plus className="absolute left-[10.5px] top-[8.75px] h-[14px] w-[14px] text-white" />
              <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[17.5px] left-[38.5px] not-italic text-[12.25px] text-nowrap text-white top-[7px] whitespace-pre">
                Create Task
              </p>
            </div>
          )}

          {/* Settings Button - exact Figma positioning from node 17:1924 */}
          <div 
            className="absolute content-stretch flex items-center justify-center left-[129.28px] rounded-[5px] size-[31.5px] top-0 cursor-pointer" 
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1b20'} 
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings className="relative h-[14px] w-[14px] text-[#7d8089]" />
          </div>

          {/* User Menu */}
          {user && (
            <div 
              className="absolute h-[28px] left-[178.28px] top-[1.75px] w-[75.359px]" 
              onMouseEnter={openUserMenu} 
              onMouseLeave={scheduleCloseUserMenu}
            >
              <div className="absolute h-[21px] left-[35px] top-[3.5px] w-[40.359px]">
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#e4e5e7] text-[14px] text-nowrap top-0 whitespace-pre">
                  {user.name || user.email.split('@')[0]}
                </p>
              </div>
              <div className="absolute bg-[#4353ff] content-stretch flex items-start left-0 overflow-clip rounded-[3.35544e+07px] size-[28px] top-0 cursor-pointer">
                <div className="basis-0 bg-[#4353ff] grow h-[28px] min-h-px min-w-px relative rounded-[3.35544e+07px] shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[28px] items-center justify-center relative w-full">
                    {user.avatar ? (
                      <img 
                        alt="" 
                        className="block max-w-none size-full rounded-[3.35544e+07px]" 
                        src={user.avatar} 
                      />
                    ) : (
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] not-italic relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`absolute right-0 top-full mt-3 z-50 min-w-[200px] rounded-md border border-border bg-popover shadow-lg transition ease-out duration-150 transform ${userMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                onMouseEnter={openUserMenu}
                onMouseLeave={scheduleCloseUserMenu}
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-t-md"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/profile');
                  }}
                >
                  <User className="h-4 w-4 inline mr-2" /> Profile
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-md"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  <LogOut className="h-4 w-4 inline mr-2" /> Log out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center - Search (and Create Task if centered) - only for centerSearchAndCreate mode */}
        {centerSearchAndCreate && onCreateTask && (
          <div className="flex items-center justify-center gap-2 h-full">
            {showSearch && (
              <form onSubmit={handleSearch} className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="h-9 pl-9 pr-4 rounded-lg border"
                  style={{ 
                    backgroundColor: '#1A1B20',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
              </form>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={onCreateTask}
              className="h-9 px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: '#4353FF', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        )}

        {/* Left side - Breadcrumbs and Title (optional) - only when not searching */}
        {!showSearch && !centerSearchAndCreate && (
          <div className={`items-center space-x-4 min-w-0 flex flex-1 h-full pl-[21px]`}>
            {!hideTitle && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index > 0 && <span>/</span>}
                    {crumb.href ? (
                      <a href={crumb.href} className="hover:text-foreground transition-colors">
                        {crumb.name}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">{crumb.name}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}
            {!hideTitle && (
              <div className="flex-1 min-w-0">
                <h1 className="notion-heading-1 truncate">{title}</h1>
                {subtitle && (
                  <p className="notion-text-muted mt-1">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
