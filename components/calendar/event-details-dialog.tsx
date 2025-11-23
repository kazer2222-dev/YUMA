'use client';

import { Calendar as CalendarIcon, Clock, FileText, Link2, MapPin, Sparkles, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Participant = {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
};

export type CalendarEventDetails = {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  location?: string | null;
  invitationLink?: string | null;
  url?: string | null;
  color?: string | null;
  space?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  participants?: Participant[];
};

interface EventDetailsDialogProps {
  event: CalendarEventDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (eventId: string) => void | Promise<void>;
  deleting?: boolean;
  onEdit?: (event: CalendarEventDetails) => void;
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  onDelete,
  deleting,
  onEdit,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const eventColor = event?.color || '#6B7280';
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  // Check if all day event
  const isAllDay = event.allDay || 
    (startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
     endDate.getHours() === 23 && endDate.getMinutes() === 59) ||
    Math.abs(endDate.getTime() - startDate.getTime()) >= 1000 * 60 * 60 * 23.5;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRange = () => {
    if (isAllDay) return null;
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] max-w-2xl shadow-2xl overflow-hidden p-0 max-h-[95vh] flex flex-col">
        {/* Header with Gradient Accent */}
        <div className="relative px-5 pt-4 pb-3 border-b border-[var(--border)] bg-gradient-to-r from-[#4353FF]/5 via-transparent to-purple-500/5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4353FF] to-[#6366F1] flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--card)] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-0.5">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Event scheduled for {formatDate(startDate)}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {/* Event Details Card */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--muted)]/30 to-transparent space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 animate-pulse"
                  style={{
                    backgroundColor: eventColor,
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-lg mb-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Clock className="w-4 h-4" />
                    {formatDate(startDate)}
                    {isAllDay ? (
                      <span className="ml-1">
                        (All day)
                      </span>
                    ) : formatTimeRange() ? (
                      <span className="ml-1">
                        • {formatTimeRange()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-4 h-4 mt-0.5 text-[var(--muted-foreground)]" />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Description
                    </span>
                  </div>
                  <p className="text-sm pl-6">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm">
                      {event.location}
                    </span>
                  </div>
                </div>
              )}

              {/* Meeting URL */}
              {(event.invitationLink || event.url) && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <a
                      href={event.invitationLink || event.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4353FF] hover:underline"
                    >
                      {event.invitationLink || event.url}
                    </a>
                  </div>
                </div>
              )}

              {/* Participants */}
              {event.participants && event.participants.length > 0 && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm">
                      {event.participants.map((p, idx) => {
                        const name = p.user?.name || p.user?.email || `Guest ${idx + 1}`;
                        return idx === 0 ? name : `, ${name}`;
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-[#4353FF] hover:bg-[#4353FF]/90 text-white"
                onClick={() => {
                  if (onEdit) {
                    onEdit(event);
                  }
                }}
                disabled={!onEdit}
              >
                Edit Event
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
                onClick={() => {
                  if (onDelete) {
                    onDelete(event.id);
                  }
                }}
                disabled={deleting || !onDelete}
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
