'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Bell } from 'lucide-react';

interface ReminderSetterProps {
  taskTitle?: string;
  dueDate?: string;
  context?: string;
  onReminderSet: (reminder: {
    reminderTime: string;
    message: string;
    type: 'before' | 'at' | 'after';
    minutesBefore?: number;
  }) => void;
}

export function ReminderSetter({ taskTitle, dueDate, context, onReminderSet }: ReminderSetterProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetReminder = async () => {
    if (!description.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/ai/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          taskTitle,
          dueDate,
          context,
        }),
      });

      const data = await response.json();

      if (data.success && data.reminder) {
        onReminderSet(data.reminder);
        setDescription('');
      } else {
        alert(data.message || 'Failed to set reminder');
      }
    } catch (error) {
      console.error('Reminder setting error:', error);
      alert('Failed to set reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Remind me 30 minutes before, or Tomorrow at 9am"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSetReminder();
            }
          }}
        />
        <Button
          onClick={handleSetReminder}
          disabled={loading || !description.trim()}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Set
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Describe your reminder in natural language
      </p>
    </div>
  );
}











