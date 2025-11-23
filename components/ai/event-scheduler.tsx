'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Calendar } from 'lucide-react';

interface EventSchedulerProps {
  onScheduled: (eventData: {
    title: string;
    description?: string;
    allDay: boolean;
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    url?: string;
    participants?: string[];
  }) => void;
}

export function EventScheduler({ onScheduled }: EventSchedulerProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!description.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/ai/schedule-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
        }),
      });

      const data = await response.json();

      if (data.success && data.event) {
        onScheduled(data.event);
        setDescription('');
      } else {
        alert(data.message || 'Failed to schedule event');
      }
    } catch (error) {
      console.error('Event scheduling error:', error);
      alert('Failed to schedule event. Please try again.');
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
          placeholder="e.g., Team meeting tomorrow at 2pm in the conference room"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSchedule();
            }
          }}
        />
        <Button
          onClick={handleSchedule}
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
              <Sparkles className="mr-2 h-4 w-4" />
              Schedule
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Describe your event in natural language (e.g., "Team meeting tomorrow at 2pm")
      </p>
    </div>
  );
}











