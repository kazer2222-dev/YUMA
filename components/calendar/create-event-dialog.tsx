'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Calendar as CalendarIcon, Clock, MapPin, Link2, Users, Wand2, Sparkles, Check, X } from 'lucide-react';
import { EventScheduler } from '@/components/ai/event-scheduler';

interface CreateEventDialogProps {
  spaceId: string;
  spaceName: string;
  onEventCreated?: (event?: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDate?: Date | null;
  spaces?: Array<{ id: string; name: string; slug: string }>;
  editEvent?: {
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    allDay: boolean;
    location?: string | null;
    url?: string | null;
    participants?: Array<{ user?: { id: string; name?: string | null; email: string } }>;
  } | null;
}

export function CreateEventDialog({ spaceId, spaceName, onEventCreated, open: controlledOpen, onOpenChange: controlledOnOpenChange, initialDate, spaces = [], editEvent }: CreateEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);
  const [resolvedSpaceId, setResolvedSpaceId] = useState(spaceId);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
    url: '',
  });

  const [members, setMembers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [titleError, setTitleError] = useState<string>('');
  // Single field: tokens of recipient emails (existing members or new emails)
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const recipientInputRef = useRef<HTMLInputElement | null>(null);
  const [recipientError, setRecipientError] = useState<string>('');

  // Update selected space when spaceId prop changes
  useEffect(() => {
    if (spaceId) {
      setSelectedSpaceId(spaceId);
      setResolvedSpaceId(spaceId);
    } else if (spaces.length > 0) {
      setSelectedSpaceId(spaces[0].id);
      setResolvedSpaceId(spaces[0].id);
    }
    // If we have spaceName (slug) but no spaceId, fetch it
    else if (spaceName && !spaceId && spaces.length === 0) {
      fetch(`/api/spaces/${spaceName}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.space) {
            setSelectedSpaceId(data.space.id);
            setResolvedSpaceId(data.space.id);
          }
        })
        .catch(console.error);
    }
  }, [spaceId, spaces, spaceName]);

  // Load members for the selected space (using slug from spaces list or spaceName as slug)
  useEffect(() => {
    const loadMembers = async () => {
      try {
        // Determine slug
        const slug = (spaces.find(s => s.id === (selectedSpaceId || resolvedSpaceId))?.slug) || spaceName;
        if (!slug) return;
        const res = await fetch(`/api/spaces/${slug}/members`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          const parsed = data.members.map((m: any) => ({ id: m.user.id, name: m.user.name, email: m.user.email }));
          setMembers(parsed);
        }
      } catch (e) {
        // ignore
      }
    };
    if (open) {
      loadMembers();
    }
  }, [open, selectedSpaceId, resolvedSpaceId, spaceName, spaces]);

  // Update form when initialDate changes or dialog opens, or when editEvent changes
  useEffect(() => {
    if (open && editEvent) {
      // Populate form with event data for editing
      const start = new Date(editEvent.startDate);
      const end = new Date(editEvent.endDate);
      
      // Format dates in local timezone to avoid timezone shifts
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatLocalDate(start);
      const endDateStr = formatLocalDate(end);
      const startTimeStr = editEvent.allDay ? '' : start.toTimeString().slice(0, 5);
      const endTimeStr = editEvent.allDay ? '' : end.toTimeString().slice(0, 5);
      
      setFormData({
        title: editEvent.title,
        description: editEvent.description || '',
        startDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        allDay: editEvent.allDay,
        location: editEvent.location || '',
        url: editEvent.url || '',
      });
      
      // Set participants
      if (editEvent.participants) {
        const emails = editEvent.participants
          .map(p => p.user?.email)
          .filter((email): email is string => !!email);
        setRecipientEmails(emails);
      }
    } else if (open && initialDate) {
      // Format date in local timezone to avoid timezone shifts
      const year = initialDate.getFullYear();
      const month = String(initialDate.getMonth() + 1).padStart(2, '0');
      const day = String(initialDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        allDay: true,
      }));
    } else if (open && !editEvent && !initialDate) {
      // Reset form when opening for new event
      setFormData({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        allDay: false,
        location: '',
        url: '',
      });
      setRecipientEmails([]);
      setRecipientInput('');
    }
  }, [open, initialDate, editEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate title first with platform-style error
    if (!formData.title.trim()) {
      setTitleError('Title is required');
      setLoading(false);
      return;
    }

    // If we have spaces but no spaceId selected yet, use the first one or resolved spaceId
    const finalSpaceId = selectedSpaceId || resolvedSpaceId || (spaces.length > 0 ? spaces[0].id : spaceId);
    
    if (!finalSpaceId) {
      alert('Please select a space for this event.');
      setLoading(false);
      return;
    }

    try {
      // For all-day events, use UTC dates to avoid timezone shifts
      // For timed events, use local time but convert properly
      let startDateTime: string;
      let endDateTime: string | null = null;
      
      if (formData.allDay) {
        // For all-day events, send the date string directly and let server handle it
        // This ensures the date represents the correct calendar date regardless of timezone
        // The server will interpret this as the local date at midnight
        startDateTime = formData.startDate + 'T00:00:00';
        
        if (formData.endDate) {
          endDateTime = formData.endDate + 'T23:59:59';
        } else {
          endDateTime = formData.startDate + 'T23:59:59';
        }
      } else {
        // For timed events, use local time
        startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
        
        if (formData.endDate) {
          endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
        }
      }

      // Derive participants by matching tokens to known members
      const knownByEmail = new Map(members.map(m => [m.email.toLowerCase(), m.id]));
      const uniqueTokens = Array.from(new Set(recipientEmails.map(e => e.trim().toLowerCase()).filter(Boolean)));
      const participants: string[] = [];
      const participantsEmails: string[] = [];
      uniqueTokens.forEach(email => {
        const id = knownByEmail.get(email);
        if (id) participants.push(id); else participantsEmails.push(email);
      });

      const isEdit = !!editEvent;
      const url = isEdit ? `/api/events/${editEvent.id}` : '/api/events';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          spaceId: finalSpaceId,
          title: formData.title,
          description: formData.description,
          startDate: startDateTime,
          endDate: endDateTime,
          allDay: formData.allDay,
          location: formData.location,
          url: formData.url,
          participants,
          participantsEmails,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`Event ${isEdit ? 'updated' : 'created'} successfully:`, data.event);
        // Call the callback with the new event for immediate update
        if (onEventCreated) {
          console.log('Calling onEventCreated callback with event:', data.event);
          onEventCreated(data.event);
        }
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          allDay: false,
          location: '',
          url: '',
        });
        setRecipientEmails([]);
        setRecipientInput('');
      } else {
        const errorMessage = data.message || `Failed to create event (${response.status})`;
        if (response.status === 401) {
          alert('Your session has expired. Please refresh the page and try again.');
          // Optionally reload the page to refresh the session
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          alert(errorMessage);
        }
        console.error('Event creation failed:', data);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Network error: Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllDayChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allDay: checked,
      startTime: checked ? '' : prev.startTime,
      endTime: checked ? '' : prev.endTime,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md">
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[95vh]">
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
                  {editEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editEvent 
                    ? `Edit event scheduled for ${new Date(editEvent.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                    : 'Schedule and manage your team events with AI-powered assistance'}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="relative mb-4 p-4 rounded-xl bg-gradient-to-br from-[#4353FF]/10 via-[#4353FF]/5 to-purple-500/10 border border-[#4353FF]/20 shadow-lg shadow-[#4353FF]/5 overflow-hidden group">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4353FF]/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4353FF]/20 flex items-center justify-center">
                      <Wand2 className="w-4 h-4 text-[#4353FF]" />
                    </div>
                    <div>
                      <h3 className="text-sm">
                        AI Quick Scheduler
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Describe your event in natural
                        language
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      Beta
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <EventScheduler
                    onScheduled={(eventData) => {
                      setFormData((prev) => ({
                        title: eventData.title ?? prev.title,
                        description:
                          eventData.description !== undefined && eventData.description !== null
                            ? eventData.description
                            : prev.description,
                        startDate: eventData.startDate ?? prev.startDate,
                        startTime:
                          eventData.startTime !== undefined && eventData.startTime !== null
                            ? eventData.startTime
                            : prev.startTime,
                        endDate: eventData.endDate ?? eventData.startDate ?? prev.endDate,
                        endTime:
                          eventData.endTime !== undefined && eventData.endTime !== null
                            ? eventData.endTime
                            : prev.endTime,
                        allDay: eventData.allDay !== undefined ? eventData.allDay : prev.allDay,
                        location:
                          eventData.location !== undefined && eventData.location !== null
                            ? eventData.location
                            : prev.location,
                        url: eventData.url !== undefined && eventData.url !== null ? eventData.url : prev.url,
                      }));
                      if (eventData.participants && eventData.participants.length > 0) {
                        setRecipientEmails(eventData.participants);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Divider with Badge */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative px-4 bg-[var(--card)]">
                <span className="px-3 py-1 rounded-full bg-[var(--muted)] text-xs text-[var(--muted-foreground)] border border-[var(--border)]">
                  Manual Entry
                </span>
              </div>
            </div>

            {/* Compact Form Fields */}
            <div className="space-y-3">

            {spaces.length > 0 && !spaceId && (
              <div className="grid gap-2">
                <Label htmlFor="space" className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  Space *
                </Label>
                <select
                  id="space"
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50"
                  required
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs mb-1.5 block">
                Event Title *
              </Label>
              <Input
                placeholder="Enter event name..."
                className="bg-[var(--background)] border-[var(--border)]"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (titleError && e.target.value.trim()) setTitleError('');
                }}
              />
              {titleError && <p className="text-xs text-destructive mt-1">{titleError}</p>}
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">
                Description
              </Label>
              <Textarea
                placeholder="What's this event about?"
                className="bg-[var(--background)] border-[var(--border)] resize-none"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
              <Label htmlFor="allday" className="text-xs cursor-pointer">
                All day event
              </Label>
              <Switch id="allday" checked={formData.allDay} onCheckedChange={handleAllDayChange} />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                  Start Date *
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    className="bg-[var(--background)] border-[var(--border)] pl-9"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                  Start Time
                </Label>
                <div className="relative">
                  <Input
                    type="time"
                    disabled={formData.allDay}
                    className="bg-[var(--background)] border-[var(--border)] pl-9 disabled:opacity-50"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startTime: e.target.value,
                      })
                    }
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                  End Date
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    className="bg-[var(--background)] border-[var(--border)] pl-9"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value,
                      })
                    }
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                  End Time
                </Label>
                <div className="relative">
                  <Input
                    type="time"
                    disabled={formData.allDay}
                    className="bg-[var(--background)] border-[var(--border)] pl-9 disabled:opacity-50"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endTime: e.target.value,
                      })
                    }
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                Location
              </Label>
              <div className="relative">
                <Input
                  placeholder="Add a location"
                  className="bg-[var(--background)] border-[var(--border)] pl-9"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: e.target.value,
                    })
                  }
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                Meeting URL
              </Label>
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://"
                  className="bg-[var(--background)] border-[var(--border)] pl-9"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      url: e.target.value,
                    })
                  }
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                Participants
              </Label>
              <div className="relative">
                <Input
                  ref={recipientInputRef}
                  placeholder="Enter email addresses..."
                  className="bg-[var(--background)] border-[var(--border)] pl-9"
                  value={recipientInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parts = value.split(/[\s,;]+/).filter(Boolean);
                    if (parts.length > 1 || /[\s,;]$/.test(value)) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      const completeTokens = /[\s,;]$/.test(value) ? parts : parts.slice(0, -1);
                      if (completeTokens.length > 0) {
                        setRecipientEmails((prev) => {
                          const set = new Set(prev.map((e) => e.toLowerCase()));
                          completeTokens.forEach((t) => {
                            const token = t.trim().toLowerCase();
                            if (emailRegex.test(token)) set.add(token);
                          });
                          return Array.from(set);
                        });
                      }
                      const lastPartial = /[\s,;]$/.test(value) ? '' : parts[parts.length - 1] || '';
                      setRecipientInput(lastPartial);
                      setRecipientError('');
                    } else {
                      setRecipientInput(value);
                      if (/^[^\s@]+@[^\s@]*$/.test(value) || value === '') {
                        setRecipientError('');
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    const commit = () => {
                      const token = recipientInput.trim().replace(/[;,]+$/, '');
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (token && emailRegex.test(token) && !recipientEmails.includes(token.toLowerCase())) {
                        setRecipientEmails((prev) => [...prev, token.toLowerCase()]);
                        setRecipientInput('');
                        setRecipientError('');
                      } else if (token && !emailRegex.test(token)) {
                        setRecipientError('Invalid email format. Please correct and try again.');
                      }
                    };
                    const isSpaceKey = e.key === ' ' || e.code === 'Space';
                    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || isSpaceKey) {
                      e.preventDefault();
                      commit();
                    } else if (e.key === 'Backspace' && recipientInput === '' && recipientEmails.length > 0) {
                      setRecipientEmails((prev) => prev.slice(0, -1));
                      setRecipientError('');
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text && /[\s,;]/.test(text)) {
                      e.preventDefault();
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      const tokens = text.split(/[\s,;]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
                      if (tokens.length) {
                        setRecipientEmails((prev) => {
                          const set = new Set(prev.map((email) => email.toLowerCase()));
                          tokens.forEach((t) => {
                            if (emailRegex.test(t)) set.add(t);
                          });
                          return Array.from(set);
                        });
                      }
                      setRecipientInput('');
                      setRecipientError('');
                    }
                  }}
                  onBlur={() => {
                    const token = recipientInput.trim().replace(/[;,]+$/, '');
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (token && emailRegex.test(token) && !recipientEmails.includes(token.toLowerCase())) {
                      setRecipientEmails((prev) => [...prev, token.toLowerCase()]);
                      setRecipientInput('');
                      setRecipientError('');
                    } else if (token && !emailRegex.test(token)) {
                      setRecipientError('Invalid email format. Please correct and try again.');
                    }
                  }}
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
              {recipientEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipientEmails.map((email) => (
                    <span key={email} className="px-2.5 py-1 text-xs rounded-full bg-[var(--muted)] text-[var(--foreground)] flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        onClick={() => setRecipientEmails((prev) => prev.filter((e) => e !== email))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {recipientError && <p className="text-xs text-destructive mt-1">{recipientError}</p>}
            </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--border)] flex-shrink-0 bg-[var(--card)]">
            <div className="text-xs text-[var(--muted-foreground)]">
              * Required fields
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-[var(--border)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#4353FF] to-[#6366F1] hover:from-[#5563FF] hover:to-[#7376F1] text-white shadow-lg hover:shadow-xl transition-all gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

