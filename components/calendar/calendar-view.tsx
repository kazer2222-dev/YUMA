'use client';

import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles,
  Wand2,
  FileText,
  MapPin,
  Link2,
  Users,
  X,
} from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/components/ui/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreateTaskDialog } from '@/components/board/create-task-dialog';
import { CreateEventDialog } from './create-event-dialog';
import { EventDetailsDialog, CalendarEventDetails } from './event-details-dialog';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  status: {
    id: string;
    name: string;
    key: string;
    color?: string;
    isDone: boolean;
  };
  space?: {
    id: string;
    name: string;
    slug: string;
    ticker: string;
  };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  url?: string;
  invitationLink?: string | null;
  participants?: Array<{
    user?: {
      id: string;
      name?: string | null;
      email: string;
      avatar?: string | null;
    };
  }>;
  color?: string | null;
  space?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CalendarViewProps {
  spaceSlug?: string;
  viewMode?: 'month' | 'week' | 'day';
}

const EVENT_ACCENTS = ['#4353FF', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#06B6D4', '#F59E0B'];

const getEventAccent = (seed: string) => {
  if (!seed) return EVENT_ACCENTS[0];
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EVENT_ACCENTS[hash % EVENT_ACCENTS.length];
};

export function CalendarView({ spaceSlug, viewMode = 'month' }: CalendarViewProps) {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>(viewMode);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardStatuses, setBoardStatuses] = useState<Array<{ id: string; name: string; key: string; color?: string; isStart?: boolean }>>([]);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevMonthDay);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Get the calendar date components for the check date (local timezone)
      const checkYear = date.getFullYear();
      const checkMonth = date.getMonth();
      const checkDay = date.getDate();
      
      // For event dates stored as UTC midnight representing a calendar date,
      // we need to extract UTC components to get the intended calendar date
      // Example: 2024-01-22T00:00:00Z represents Jan 22, regardless of timezone
      const startYear = eventStart.getUTCFullYear();
      const startMonth = eventStart.getUTCMonth();
      const startDay = eventStart.getUTCDate();
      
      const endYear = eventEnd.getUTCFullYear();
      const endMonth = eventEnd.getUTCMonth();
      const endDay = eventEnd.getUTCDate();
      
      // Compare calendar dates (year, month, day) directly
      // This ensures events appear on the correct calendar date
      const checkDateNum = checkYear * 10000 + checkMonth * 100 + checkDay;
      const startDateNum = startYear * 10000 + startMonth * 100 + startDay;
      const endDateNum = endYear * 10000 + endMonth * 100 + endDay;
      
      return checkDateNum >= startDateNum && checkDateNum <= endDateNum;
    });
  };

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    return filteredTasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(start);
      weekDay.setDate(start.getDate() + i);
      weekDays.push(weekDay);
    }
    return weekDays;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedEvent(null);
    setEditEvent(null);
    setShowEventDialog(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(new Date(event.startDate));
    setEventDetailsOpen(true);
  };

  const handleEditEvent = (event: CalendarEventDetails) => {
    // Convert CalendarEventDetails to Event format
    const eventForEdit: Event = {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay || false,
      location: event.location || undefined,
      url: event.url || undefined,
      invitationLink: event.invitationLink || undefined,
      participants: event.participants,
      color: event.color,
      space: event.space || undefined,
    };
    setEditEvent(eventForEdit);
    setSelectedDate(new Date(event.startDate));
    setEventDetailsOpen(false);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      setPendingDeleteId(eventId);
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
          setEventDetailsOpen(false);
        }
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (e) {
      alert('Failed to delete event');
    } finally {
      setPendingDeleteId(null);
    }
  }, [selectedEvent]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      const tasksUrl = spaceSlug 
        ? `/api/spaces/${spaceSlug}/tasks`
        : '/api/tasks/global';
      
      const tasksResponse = await fetch(tasksUrl);
      const tasksData = await tasksResponse.json();

      if (tasksData.success) {
        setTasks(tasksData.tasks || []);
        
        if (spaceSlug && tasksData.space && !spaceId) {
          setSpaceId(tasksData.space.id);
        } else if (spaceSlug && !spaceId) {
          fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.space) {
                setSpaceId(data.space.id);
              }
            })
            .catch(console.error);
        }
      } else {
        setError(tasksData.message || 'Failed to fetch tasks');
      }

    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [spaceSlug, spaceId]);

  // Filter tasks based on showCompleted - smooth filtering without refetch
  const filteredTasks = useMemo(() => {
    if (showCompleted) return tasks;
    return tasks.filter((task: Task) => !task.status.isDone);
  }, [tasks, showCompleted]);

  const fetchEvents = useCallback(async () => {
    try {
      const eventsUrl = spaceSlug && spaceId
        ? `/api/events?spaceId=${spaceId}`
        : '/api/events';
      
      const eventsResponse = await fetch(eventsUrl, {
        credentials: 'include'
      });
      const eventsData = await eventsResponse.json();

      if (eventsData.success) {
        const normalizedEvents: Event[] = (eventsData.events || []).map((event: Event) => ({
          ...event,
          color: event.color || getEventAccent(event.id),
        }));
        setEvents(normalizedEvents);
      } else {
        console.error('Failed to fetch events:', eventsData.message);
      }

    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [spaceSlug, spaceId]);

  const fetchData = async () => {
    await fetchTasks();
    await fetchEvents();
  };

  useEffect(() => {
    fetchTasks();
  }, [spaceSlug, spaceId]);

  useEffect(() => {
    const loadBoards = async () => {
      if (!spaceSlug) return;
      try {
        const res = await fetch(`/api/spaces/${spaceSlug}/boards`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBoards(data.boards || []);
          const last = typeof window !== 'undefined' ? localStorage.getItem(`lastBoard_${spaceSlug}`) : null;
          const exists = data.boards?.some((b: any) => b.id === last);
          const chosen = exists ? last : (data.boards && data.boards[0]?.id) || null;
          setSelectedBoardId(chosen);
        }
      } catch (e) {
        // ignore
      }
    };
    loadBoards();
  }, [spaceSlug]);

  useEffect(() => {
    const loadStatuses = async () => {
      if (!selectedBoardId) { setBoardStatuses([]); return; }
      try {
        const res = await fetch(`/api/boards/${selectedBoardId}/statuses`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBoardStatuses(data.statuses || []);
        } else {
          setBoardStatuses([]);
        }
      } catch (e) {
        setBoardStatuses([]);
      }
    };
    loadStatuses();
  }, [selectedBoardId]);

  useEffect(() => {
    if (spaceId || !spaceSlug) {
      fetchEvents();
    }
  }, [fetchEvents, spaceId, spaceSlug]);

  useEffect(() => {
    if (!spaceSlug) {
      setSpacesLoading(true);
      fetch('/api/spaces', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.spaces && data.spaces.length > 0) {
            setSpaces(data.spaces);
            if (data.spaces[0]) {
              setSpaceId(data.spaces[0].id);
            }
          }
          setSpacesLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch spaces:', err);
          setSpacesLoading(false);
        });
    }
  }, [spaceSlug]);

  const resolvedSpaceName = spaceSlug
    ? spaceSlug
    : spaces.find((s) => s.id === spaceId)?.name || spaces[0]?.name || 'Selected Space';
  const resolvedSpaceId = spaceSlug ? (spaceId || '') : (spaceId || spaces[0]?.id || '');
  const eventDialogSpaces = spaceSlug ? [] : spaces;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--background)] to-[var(--card)]/30 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4353FF]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#8B5CF6]/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h1 className="text-2xl mb-1 text-[var(--foreground)] tracking-tight">
            Space Calendar
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Tasks and events for this space
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] flex flex-col md:flex-row gap-3 md:items-center md:justify-between flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-[var(--muted)]/30 rounded-lg p-0.5 md:p-1 flex-shrink-0">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className={
                view === 'month'
                  ? 'bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3'
                  : 'hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3'
              }
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className={
                view === 'week'
                  ? 'bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3'
                  : 'hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3'
              }
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className={
                view === 'day'
                  ? 'bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3'
                  : 'hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3'
              }
            >
              Day
            </Button>
          </div>

          {/* Show Completed Toggle - Hidden on mobile */}
          {!isMobile && (
            <Button
              variant={showCompleted ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className={
                showCompleted
                  ? 'bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md'
                  : 'hover:bg-[var(--muted)]'
              }
            >
              Show Completed
            </Button>
          )}
        </div>

        {/* Add Event Button */}
        <Button
          size="sm"
          onClick={() => setShowEventDialog(true)}
          className="gap-2 bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md hover:shadow-lg transition-all hover:scale-105 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          {isMobile ? 'Add' : 'Add Event'}
        </Button>
      </div>

      {/* Navigation */}
      <div className="px-4 md:px-6 py-3 border-b border-[var(--border)] flex flex-col md:flex-row gap-2 md:items-center md:justify-between bg-gradient-to-r from-[var(--card)]/50 via-[var(--background)] to-[var(--card)]/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between md:justify-start gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={
                view === 'day'
                  ? previousDay
                  : view === 'week'
                    ? previousWeek
                    : previousMonth
              }
              className="h-8 w-8 md:h-9 md:w-9 hover:bg-[var(--muted)] hover:scale-110 transition-all rounded-lg shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="hover:bg-[#4353FF]/10 hover:text-[#4353FF] min-w-[60px] md:min-w-[70px] transition-all hover:scale-105 rounded-lg border border-transparent hover:border-[#4353FF]/30 text-xs md:text-sm h-8 md:h-9"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={
                view === 'day'
                  ? nextDay
                  : view === 'week'
                    ? nextWeek
                    : nextMonth
              }
              className="h-8 w-8 md:h-9 md:w-9 hover:bg-[var(--muted)] hover:scale-110 transition-all rounded-lg shadow-sm hover:shadow-md"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            </div>
          <h2 className="text-base md:text-xl text-[var(--foreground)] tracking-tight md:hidden">
            {view === 'day'
              ? `${monthNames[currentDate.getMonth()].slice(0, 3)} ${currentDate.getDate()}`
              : view === 'week'
                ? `${monthNames[weekDays[0].getMonth()].slice(0, 3)} ${weekDays[0].getDate()} - ${weekDays[6].getDate()}`
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
        </div>
        <h2 className="text-xl text-[var(--foreground)] tracking-tight hidden md:block">
          {view === 'day'
            ? `${fullDayNames[currentDate.getDay()]}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
            : view === 'week'
              ? `${monthNames[weekDays[0].getMonth()]} ${weekDays[0].getDate()} - ${monthNames[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
              : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </h2>
        </div>
        
      {/* Calendar Grid */}
      <div className="flex-1 p-2 md:p-6 overflow-auto bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
        {/* Decorative Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {view === 'week' ? (
          /* Week View */
          <div className="grid grid-cols-7 gap-3 relative z-10 calendar-grid h-full">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isTodayCell = isToday(day);
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 border border-[var(--border)] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl group cursor-pointer ${
                    isTodayCell
                      ? 'ring-2 ring-[#4353FF] shadow-[0_0_20px_rgba(67,83,255,0.3)]'
                      : ''
                  }`}
                  style={{
                    animation: `fadeInScale 0.4s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Day Header */}
                  <div
                    className={`px-4 py-3 border-b border-[var(--border)] text-center ${
                      isTodayCell
                        ? 'bg-[#4353FF]'
                        : 'bg-gradient-to-b from-[var(--muted)]/30 to-transparent'
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${isTodayCell ? 'text-white/70' : 'text-[var(--muted-foreground)]'}`}
                    >
                      {dayNames[day.getDay()]}
                          </div>
                    <div
                      className={`text-2xl ${isTodayCell ? 'text-white' : 'text-[var(--foreground)]'}`}
                    >
                      {day.getDate()}
                      </div>
                  </div>
                    
                  {/* Events Container */}
                  <div className="p-3 space-y-2 min-h-[300px]">
                    {/* Events */}
                    {dayEvents.map((event, eventIndex) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)]/70 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 border border-[var(--border)]"
                        style={{
                          backgroundColor: event.color
                            ? `${event.color}15`
                            : 'var(--muted)',
                          borderLeftWidth: '4px',
                          borderLeftColor: event.color || '#6B7280',
                          animation: `slideInEvent 0.3s ease-out ${eventIndex * 0.1}s both`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 animate-pulse"
                            style={{
                              backgroundColor: event.color || '#6B7280',
                            }}
                          />
                          <span className="text-sm leading-tight">
                            {event.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === 'day' ? (
          /* Day View */
          <div className="relative z-10 max-w-4xl mx-auto w-full">
            {/* Day Header */}
            <div className="text-center mb-8 py-8 border-b border-[var(--border)] bg-gradient-to-r from-transparent via-[var(--muted)]/20 to-transparent">
              <h2 className="text-3xl text-[var(--foreground)] mb-2">
                {fullDayNames[currentDate.getDay()]},{' '}
                {monthNames[currentDate.getMonth()]} {currentDate.getDate()},{' '}
                {currentDate.getFullYear()}
              </h2>
              <Button
                size="sm"
                onClick={() => setShowEventDialog(true)}
                className="mt-4 gap-2 bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
      </div>

            {/* Events Container */}
            <div className="space-y-3 mt-6">
              {getEventsForDate(currentDate).length > 0 ? (
                getEventsForDate(currentDate).map((event, index) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="px-5 py-4 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)]/70 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:scale-[1.02] border border-[var(--border)]"
                    style={{
                      backgroundColor: event.color
                        ? `${event.color}15`
                        : 'var(--muted)',
                      borderLeftWidth: '6px',
                      borderLeftColor: event.color || '#6B7280',
                      animation: `slideInEvent 0.3s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                        style={{
                          backgroundColor: event.color || '#6B7280',
                        }}
                      />
                      <span className="text-base">{event.title}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-[var(--muted-foreground)] text-base">
                    No tasks for this day
                  </p>
                        </div>
                        )}
                      </div>
                    </div>
        ) : (
          /* Month View */
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 relative z-10 calendar-grid">
            {/* Day Headers */}
            {dayNames.map((day, index) => (
              <div
                key={day}
                className="bg-gradient-to-b from-[var(--card)] to-[var(--muted)]/30 px-1 md:px-4 py-1.5 md:py-3.5 text-xs md:text-sm text-[var(--muted-foreground)] text-center rounded-t-lg border border-[var(--border)] border-b-0 backdrop-blur-sm"
                style={{
                  animation: `slideDown 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                {isMobile ? day.slice(0, 1) : day}
                </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isTodayCell = isToday(day);
              const isCurrentMonthCell = isCurrentMonth(day);
              const isWeekend = day && (day.getDay() === 0 || day.getDay() === 6);
              const dayKey = day ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : '';
              const isExpanded = expandedDays.has(dayKey);
              const maxVisible = 3;
              const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, maxVisible);
              const hiddenCount = dayEvents.length - maxVisible;
    
    return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 min-h-[60px] md:min-h-[120px] p-1 md:p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:z-10 relative border border-[var(--border)] group cursor-pointer ${
                    isTodayCell
                      ? 'ring-1 md:ring-2 ring-[#4353FF] ring-inset shadow-[0_0_20px_rgba(67,83,255,0.3)] bg-gradient-to-br from-[#4353FF]/5 to-[#4353FF]/10'
                      : ''
                  } ${
                    isWeekend && isCurrentMonthCell
                      ? 'bg-gradient-to-br from-[var(--muted)]/20 to-[var(--muted)]/10'
                      : ''
                  }`}
                  style={{
                    animation: `fadeInScale 0.4s ease-out ${index * 0.01}s both`,
                  }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/5 group-hover:to-[var(--primary)]/10 transition-all duration-300 rounded pointer-events-none" />

                  {/* "+" button appears on hover in top-right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDateClick(day);
                    }}
                    className="absolute top-1 right-1 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#4353FF] text-white opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center hover:bg-[#4353FF]/90 hover:scale-110 shadow-md hover:shadow-lg z-20"
                    aria-label="Add event"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>

                  {/* Date number */}
                  <div className="relative z-10">
                    <div
                      className={`inline-flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full mb-0.5 md:mb-2 transition-all duration-200 text-xs md:text-sm ${
                        isTodayCell
                          ? 'bg-[#4353FF] text-white shadow-lg scale-110'
                          : isCurrentMonthCell
                            ? 'text-[var(--foreground)] group-hover:bg-[var(--muted)] group-hover:scale-110'
                            : 'text-[var(--muted-foreground)] opacity-50'
                      }`}
                    >
                      {day?.getDate()}
                      </div>

                    {/* Events */}
                    <div className="space-y-0.5 md:space-y-1.5">
                      {visibleEvents.map((event, eventIndex) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className="text-[10px] md:text-xs px-1 md:px-2.5 py-0.5 md:py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70 cursor-pointer transition-all duration-200 flex items-center gap-0.5 md:gap-1.5 truncate shadow-sm hover:shadow-md hover:scale-105 group/event border border-transparent hover:border-[var(--border)]"
                          style={{
                            borderLeft: event.color
                              ? `2px solid ${event.color}`
                              : undefined,
                            animation: `slideInEvent 0.3s ease-out ${eventIndex * 0.1}s both`,
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 animate-pulse"
                        style={{ 
                              backgroundColor: event.color || '#6B7280',
                            }}
                          />
                          <span className="truncate group-/event:text-[var(--foreground)]">
                            {isMobile
                              ? event.title.slice(0, 8) + (event.title.length > 8 ? '...' : '')
                              : event.title}
                          </span>
                        </div>
                      ))}
                      {hiddenCount > 0 && !isExpanded && (
                        <div
                          className="text-[10px] md:text-xs text-[var(--muted-foreground)] px-1 md:px-2.5 py-0.5 md:py-1.5 cursor-pointer hover:text-[var(--foreground)] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDays(prev => new Set(prev).add(dayKey));
                          }}
                        >
                          +{hiddenCount} more
                      </div>
                    )}
                      {isExpanded && hiddenCount > 0 && (
                        <div
                          className="text-[10px] md:text-xs text-[var(--muted-foreground)] px-1 md:px-2.5 py-0.5 md:py-1.5 cursor-pointer hover:text-[var(--foreground)] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDays(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(dayKey);
                              return newSet;
                            });
                          }}
                        >
                          Show less
                      </div>
                    )}
                  </div>
                </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInEvent {
          from {
            opacity: 0;
            transform: translateX(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .calendar-grid {
          perspective: 1000px;
        }

        /* Custom scrollbar for calendar */
        .flex-1::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .flex-1::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }

        .flex-1::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .flex-1::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>

      {/* Event Dialogs */}
        <CreateEventDialog 
        spaceId={resolvedSpaceId}
        spaceName={resolvedSpaceName}
        onEventCreated={async (newEvent?: any) => {
          // If we have the new event, add it optimistically for immediate display
          if (newEvent) {
            const normalizedEvent: Event = {
              ...newEvent,
              color: newEvent.color || getEventAccent(newEvent.id),
            };
            setEvents(prev => {
              // Check if event already exists (in case of edit)
              const existingIndex = prev.findIndex(e => e.id === normalizedEvent.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = normalizedEvent;
                return updated;
              }
              // Add new event
              return [...prev, normalizedEvent];
            });
          } else {
            // Fallback: fetch events if event data not provided
            await fetchEvents();
          }
          setEditEvent(null);
        }}
        open={showEventDialog}
        onOpenChange={(open) => {
          setShowEventDialog(open);
          if (!open) {
            setEditEvent(null);
          }
        }}
        initialDate={selectedDate}
        spaces={eventDialogSpaces}
        editEvent={editEvent ? {
          id: editEvent.id,
          title: editEvent.title,
          description: editEvent.description || null,
          startDate: editEvent.startDate,
          endDate: editEvent.endDate,
          allDay: editEvent.allDay,
          location: editEvent.location || null,
          url: editEvent.url || null,
          participants: editEvent.participants,
        } : null}
      />

      <EventDetailsDialog
        event={
          selectedEvent
            ? {
                ...selectedEvent,
                color: selectedEvent.color || getEventAccent(selectedEvent.id),
              }
            : null
        }
        open={eventDetailsOpen}
        onOpenChange={(open) => {
          setEventDetailsOpen(open);
          if (!open) {
            setSelectedEvent(null);
          }
        }}
        onDelete={(id) => handleDeleteEvent(id)}
        deleting={pendingDeleteId === selectedEvent?.id}
        onEdit={(event) => handleEditEvent(event)}
      />
    </div>
  );
}
