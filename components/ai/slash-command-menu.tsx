'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, FileText, Sparkles, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface SlashCommandMenuProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onInsert: (text: string) => void;
  taskTitle?: string;
  position?: { top: number; left: number };
}

export function SlashCommandMenu({ 
  textareaRef, 
  value, 
  onInsert, 
  taskTitle,
  position 
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { error: showError } = useToastHelpers();

  const commands: SlashCommand[] = [
    {
      id: 'generate-requirement',
      label: 'Generate Requirement',
      description: 'Generate detailed requirements using AI',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: 'add-checklist',
      label: 'Add Checklist',
      description: 'Add a checklist template',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'add-tags',
      label: 'Add Tags',
      description: 'Insert tag format',
      icon: <Hash className="h-4 w-4" />,
    },
  ];

  const handleCommand = async (command: SlashCommand) => {
    if (command.id === 'generate-requirement') {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/generate-requirement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskTitle,
            currentDescription: value,
          }),
        });

        const data = await response.json();

        if (data.success && data.requirement) {
          // Find the "/" position and replace it with the requirement
          const slashIndex = value.lastIndexOf('/');
          const beforeSlash = value.substring(0, slashIndex);
          const afterSlash = value.substring(slashIndex);
          // Get text from / to end of line or end of string
          const match = afterSlash.match(/^\/[^\n]*/);
          const textToReplace = match ? match[0] : '/';
          const remainingText = afterSlash.substring(textToReplace.length);
          
          const newText = beforeSlash + data.requirement + (remainingText ? '\n\n' + remainingText : '');
          onInsert(newText);
        } else {
          showError('Failed to generate requirement', data.message || 'An error occurred while generating the requirement.');
        }
      } catch (error) {
        console.error('Requirement generation error:', error);
        showError('Error', 'Failed to generate requirement. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (command.id === 'add-checklist') {
      const checklist = '- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3';
      const slashIndex = value.lastIndexOf('/');
      const beforeSlash = value.substring(0, slashIndex);
      const afterSlash = value.substring(slashIndex);
      const match = afterSlash.match(/^\/[^\n]*/);
      const textToReplace = match ? match[0] : '/';
      const remainingText = afterSlash.substring(textToReplace.length);
      const newText = beforeSlash + checklist + (remainingText ? '\n\n' + remainingText : '');
      onInsert(newText);
    } else if (command.id === 'add-tags') {
      const tags = '#tag1 #tag2 #tag3';
      const slashIndex = value.lastIndexOf('/');
      const beforeSlash = value.substring(0, slashIndex);
      const afterSlash = value.substring(slashIndex);
      const match = afterSlash.match(/^\/[^\n]*/);
      const textToReplace = match ? match[0] : '/';
      const remainingText = afterSlash.substring(textToReplace.length);
      const newText = beforeSlash + tags + (remainingText ? ' ' + remainingText : '');
      onInsert(newText);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!menuRef.current) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleCommand(commands[selectedIndex]);
      } else if (e.key === 'Escape') {
        // Close menu - this will be handled by the parent
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, commands]);

  if (loading) {
    return (
      <div
        ref={menuRef}
        className="absolute z-50 w-64 rounded-md border bg-popover p-1 shadow-md"
        style={position}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating requirement...</span>
        </div>
      </div>
    );
  }

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="slash-command-menu fixed z-[100] w-64 rounded-md border bg-popover p-1 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="space-y-1">
        {commands.map((command, index) => (
          <Button
            key={command.id}
            variant="ghost"
            className={cn(
              "w-full justify-start text-left font-normal",
              selectedIndex === index && "bg-accent"
            )}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => handleCommand(command)}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{command.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm">{command.label}</span>
                <span className="text-xs text-muted-foreground">{command.description}</span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

