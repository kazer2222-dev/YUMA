'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ClickUpSidebar, type ClickUpSidebarProps } from './clickup-sidebar';

interface MobileSidebarProps
  extends Omit<
    ClickUpSidebarProps,
    'collapsed' | 'onCollapseChange' | 'isMobile'
  > {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
  ...sidebarProps
}: MobileSidebarProps) {
  const handleNavigateHome = () => {
    sidebarProps.onNavigateHome();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='left'
        className='flex w-64 flex-col border-[var(--border)] bg-[var(--sidebar)] p-0 text-[var(--sidebar-foreground)] sm:w-72'
      >
        <SheetHeader className='border-b border-[var(--border)] px-4 py-4 text-left'>
          <SheetTitle asChild>
            <button
              type='button'
              onClick={handleNavigateHome}
              className='text-left text-[var(--primary)] transition-opacity hover:opacity-80'
            >
              YUMA
            </button>
          </SheetTitle>
          <SheetDescription className='sr-only'>
            Navigation sidebar
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto'>
          <ClickUpSidebar
            {...sidebarProps}
            isMobile
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

