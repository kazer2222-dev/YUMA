'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;

  const toggleTheme = () => {
    setTheme(current === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 relative"
      aria-label="Toggle theme"
    >
      {current === 'dark' ? (
        <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: '#4353FF' }} />
      )}
    </Button>
  );
}





