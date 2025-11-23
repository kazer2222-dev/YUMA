'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToastHelpers } from '@/components/toast';
import { cn } from '@/lib/utils';

interface TaskBreadcrumbProps {
  spaceName: string;
  spaceSlug: string;
  taskKey: string;
  taskId: string;
  sticky?: boolean;
  className?: string;
}

export function TaskBreadcrumb({
  spaceName,
  spaceSlug,
  taskKey,
  taskId,
  sticky = false,
  className
}: TaskBreadcrumbProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [displaySpaceName, setDisplaySpaceName] = useState(spaceName);
  const { success: showSuccess } = useToastHelpers();

  // Update displayed space name on window resize
  useEffect(() => {
    const updateSpaceName = () => {
      if (typeof window === 'undefined') return;
      
      // On screens smaller than 640px, truncate if longer than 20 chars
      if (window.innerWidth < 640 && spaceName.length > 20) {
        setDisplaySpaceName(spaceName.substring(0, 20) + '…');
      } else {
        setDisplaySpaceName(spaceName);
      }
    };

    updateSpaceName();
    window.addEventListener('resize', updateSpaceName);
    return () => window.removeEventListener('resize', updateSpaceName);
  }, [spaceName]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get the current origin (e.g., http://localhost:3000 or https://app.yuma.io)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const taskUrl = `${origin}/spaces/${spaceSlug}/tasks/${taskId}`;
    
    try {
      await navigator.clipboard.writeText(taskUrl);
      setCopied(true);
      showSuccess('Task link copied!', 'The link has been copied to your clipboard.');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSpaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/spaces/${spaceSlug}`);
  };

  const handleTaskKeyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/spaces/${spaceSlug}/tasks/${taskId}`);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-2 text-sm border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
          sticky && 'sticky top-0 z-10',
          className
        )}
      >
        {/* Space Name - Clickable */}
        <button
          onClick={handleSpaceClick}
          className="text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
          aria-label={`Go to ${spaceName}`}
        >
          {displaySpaceName}
        </button>

        {/* Separator */}
        <span className="text-muted-foreground select-none">›</span>

        {/* Task Key - Clickable */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleTaskKeyClick}
              className="font-bold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
              aria-label={`Open task ${taskKey}`}
            >
              {taskKey}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open full task page</p>
          </TooltipContent>
        </Tooltip>

        {/* Copy Link Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0 ml-2 text-muted-foreground hover:text-foreground',
                'hover:bg-muted transition-colors'
              )}
              onClick={handleCopyLink}
              aria-label="Copy task link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy link to task</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

