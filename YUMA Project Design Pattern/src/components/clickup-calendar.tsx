import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Users,
  FileText,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useIsMobile } from "./ui/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  participants?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
}

const sampleEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "To check the Slack channel fe reminder",
    date: new Date(2025, 10, 7), // November 7, 2025
    color: "#4353FF",
    description:
      "Review the Slack channel for frontend reminders",
    startTime: "09:00",
    endTime: "09:30",
    isAllDay: false,
  },
  {
    id: "2",
    title: "Team standup meeting",
    date: new Date(2025, 10, 10), // November 10, 2025
    color: "#10B981",
    description: "Daily team sync",
    location: "Conference Room A",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    participants: "team@yuma.com",
    startTime: "10:00",
    endTime: "10:30",
    isAllDay: false,
  },
  {
    id: "3",
    title: "Product demo",
    date: new Date(2025, 10, 10), // November 10, 2025
    color: "#F59E0B",
    description: "Showcase new features to stakeholders",
    meetingUrl: "https://zoom.us/j/123456789",
    participants: "stakeholders@yuma.com",
    startTime: "14:00",
    endTime: "15:00",
    isAllDay: false,
  },
  {
    id: "4",
    title: "Design review",
    date: new Date(2025, 10, 14), // November 14, 2025
    color: "#8B5CF6",
    description: "Review latest design iterations",
    location: "Design Studio",
    startTime: "11:00",
    endTime: "12:00",
    isAllDay: false,
  },
  {
    id: "5",
    title: "Sprint planning",
    date: new Date(2025, 10, 17), // November 17, 2025
    color: "#EF4444",
    isAllDay: true,
  },
  {
    id: "6",
    title: "Code review session",
    date: new Date(2025, 10, 21), // November 21, 2025
    color: "#06B6D4",
    startTime: "15:00",
    endTime: "16:00",
    isAllDay: false,
  },
  {
    id: "7",
    title: "Client presentation",
    date: new Date(2025, 10, 25), // November 25, 2025
    color: "#F59E0B",
    meetingUrl: "https://meet.google.com/xyz-abcd-efg",
    startTime: "13:00",
    endTime: "14:30",
    isAllDay: false,
  },
  {
    id: "8",
    title: "Quarterly review",
    date: new Date(2025, 10, 28), // November 28, 2025
    color: "#8B5CF6",
    location: "Executive Board Room",
    isAllDay: true,
  },
];

interface ClickUpCalendarProps {
  events?: CalendarEvent[];
}

export function ClickUpCalendar({
  events: initialEvents = sampleEvents,
}: ClickUpCalendarProps) {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [events, setEvents] =
    useState<CalendarEvent[]>(initialEvents);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    meetingUrl: "",
    participants: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isAllDay: false,
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];
  const fullDayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(
        year,
        month,
        -startingDayOfWeek + i + 1,
      );
      days.push(prevMonthDay);
    }

    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add empty cells to complete the grid (6 rows x 7 days = 42 cells)
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
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1,
      ),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      ),
    );
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
    // Get the Sunday of the current week
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
    setIsEditMode(false);
    // Reset form for new event
    setFormData({
      title: "",
      description: "",
      location: "",
      meetingUrl: "",
      participants: "",
      startDate: date.toISOString().split("T")[0],
      startTime: "",
      endDate: date.toISOString().split("T")[0],
      endTime: "",
      isAllDay: false,
    });
    setShowEventDialog(true);
  };

  const handleEventClick = (
    event: CalendarEvent,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsEditMode(false);
    setShowEventDialog(true);
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    setIsEditMode(true);
    // Populate form with event data
    setFormData({
      title: selectedEvent.title || "",
      description: selectedEvent.description || "",
      location: selectedEvent.location || "",
      meetingUrl: selectedEvent.meetingUrl || "",
      participants: selectedEvent.participants || "",
      startDate: selectedEvent.date.toISOString().split("T")[0],
      startTime: selectedEvent.startTime || "",
      endDate: selectedEvent.date.toISOString().split("T")[0],
      endTime: selectedEvent.endTime || "",
      isAllDay: selectedEvent.isAllDay || false,
    });
  };

  const handleDeleteClick = () => {
    if (!selectedEvent) return;
    setEvents(events.filter((e) => e.id !== selectedEvent.id));
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setIsEditMode(false);
    setFormData({
      title: "",
      description: "",
      location: "",
      meetingUrl: "",
      participants: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      isAllDay: false,
    });
  };

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
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={
                view === "month"
                  ? "bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3"
                  : "hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3"
              }
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={
                view === "week"
                  ? "bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3"
                  : "hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3"
              }
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className={
                view === "day"
                  ? "bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md text-xs md:text-sm px-2 md:px-3"
                  : "hover:bg-[var(--muted)] text-xs md:text-sm px-2 md:px-3"
              }
            >
              Day
            </Button>
          </div>

          {/* Show Completed Toggle - Hidden on mobile */}
          {!isMobile && (
            <Button
              variant={showCompleted ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className={
                showCompleted
                  ? "bg-[#4353FF] hover:bg-[#4353FF]/90 text-white shadow-md"
                  : "hover:bg-[var(--muted)]"
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
          {isMobile ? "Add" : "Add Event"}
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
                view === "day"
                  ? previousDay
                  : view === "week"
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
                view === "day"
                  ? nextDay
                  : view === "week"
                    ? nextWeek
                    : nextMonth
              }
              className="h-8 w-8 md:h-9 md:w-9 hover:bg-[var(--muted)] hover:scale-110 transition-all rounded-lg shadow-sm hover:shadow-md"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <h2 className="text-base md:text-xl text-[var(--foreground)] tracking-tight md:hidden">
            {view === "day"
              ? `${monthNames[currentDate.getMonth()].slice(0, 3)} ${currentDate.getDate()}`
              : view === "week"
                ? `${monthNames[weekDays[0].getMonth()].slice(0, 3)} ${weekDays[0].getDate()} - ${weekDays[6].getDate()}`
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
        </div>
        <h2 className="text-xl text-[var(--foreground)] tracking-tight hidden md:block">
          {view === "day"
            ? `${fullDayNames[currentDate.getDay()]}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
            : view === "week"
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
              "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {view === "week" ? (
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
                      ? "ring-2 ring-[#4353FF] shadow-[0_0_20px_rgba(67,83,255,0.3)]"
                      : ""
                  }`}
                  style={{
                    animation: `fadeInScale 0.4s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Day Header */}
                  <div
                    className={`px-4 py-3 border-b border-[var(--border)] text-center ${
                      isTodayCell
                        ? "bg-[#4353FF]"
                        : "bg-gradient-to-b from-[var(--muted)]/30 to-transparent"
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${isTodayCell ? "text-white/70" : "text-[var(--muted-foreground)]"}`}
                    >
                      {dayNames[day.getDay()]}
                    </div>
                    <div
                      className={`text-2xl ${isTodayCell ? "text-white" : "text-[var(--foreground)]"}`}
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
                        onClick={(e) =>
                          handleEventClick(event, e)
                        }
                        className="px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)]/70 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 border border-[var(--border)]"
                        style={{
                          backgroundColor: event.color
                            ? `${event.color}15`
                            : "var(--muted)",
                          borderLeftWidth: "4px",
                          borderLeftColor:
                            event.color || "#6B7280",
                          animation: `slideInEvent 0.3s ease-out ${eventIndex * 0.1}s both`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 animate-pulse"
                            style={{
                              backgroundColor:
                                event.color || "#6B7280",
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
        ) : view === "day" ? (
          /* Day View */
          <div className="relative z-10 max-w-4xl mx-auto w-full">
            {/* Day Header */}
            <div className="text-center mb-8 py-8 border-b border-[var(--border)] bg-gradient-to-r from-transparent via-[var(--muted)]/20 to-transparent">
              <h2 className="text-3xl text-[var(--foreground)] mb-2">
                {fullDayNames[currentDate.getDay()]},{" "}
                {monthNames[currentDate.getMonth()]}{" "}
                {currentDate.getDate()},{" "}
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
                getEventsForDate(currentDate).map(
                  (event, index) => (
                    <div
                      key={event.id}
                      onClick={(e) =>
                        handleEventClick(event, e)
                      }
                      className="px-5 py-4 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)]/70 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:scale-[1.02] border border-[var(--border)]"
                      style={{
                        backgroundColor: event.color
                          ? `${event.color}15`
                          : "var(--muted)",
                        borderLeftWidth: "6px",
                        borderLeftColor:
                          event.color || "#6B7280",
                        animation: `slideInEvent 0.3s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                          style={{
                            backgroundColor:
                              event.color || "#6B7280",
                          }}
                        />
                        <span className="text-base">
                          {event.title}
                        </span>
                      </div>
                    </div>
                  ),
                )
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
              const isWeekend =
                day &&
                (day.getDay() === 0 || day.getDay() === 6);

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 min-h-[60px] md:min-h-[120px] p-1 md:p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:z-10 relative border border-[var(--border)] group cursor-pointer ${
                    isTodayCell
                      ? "ring-1 md:ring-2 ring-[#4353FF] ring-inset shadow-[0_0_20px_rgba(67,83,255,0.3)] bg-gradient-to-br from-[#4353FF]/5 to-[#4353FF]/10"
                      : ""
                  } ${
                    isWeekend && isCurrentMonthCell
                      ? "bg-gradient-to-br from-[var(--muted)]/20 to-[var(--muted)]/10"
                      : ""
                  }`}
                  style={{
                    animation: `fadeInScale 0.4s ease-out ${index * 0.01}s both`,
                  }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/5 group-hover:to-[var(--primary)]/10 transition-all duration-300 rounded pointer-events-none" />

                  {/* Date number */}
                  <div className="relative z-10">
                    <div
                      className={`inline-flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full mb-0.5 md:mb-2 transition-all duration-200 text-xs md:text-sm ${
                        isTodayCell
                          ? "bg-[#4353FF] text-white shadow-lg scale-110"
                          : isCurrentMonthCell
                            ? "text-[var(--foreground)] group-hover:bg-[var(--muted)] group-hover:scale-110"
                            : "text-[var(--muted-foreground)] opacity-50"
                      }`}
                    >
                      {day?.getDate()}
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5 md:space-y-1.5">
                      {dayEvents.slice(0, isMobile ? 2 : dayEvents.length).map((event, eventIndex) => (
                        <div
                          key={event.id}
                          onClick={(e) =>
                            handleEventClick(event, e)
                          }
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
                              backgroundColor:
                                event.color || "#6B7280",
                            }}
                          />
                          <span className="truncate group-/event:text-[var(--foreground)]">
                            {isMobile ? event.title.slice(0, 8) + (event.title.length > 8 ? '...' : '') : event.title}
                          </span>
                        </div>
                      ))}
                      {isMobile && dayEvents.length > 2 && (
                        <div className="text-[10px] text-[var(--muted-foreground)] px-1">
                          +{dayEvents.length - 2} more
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

      {/* Create/View Event Dialog - Fancy Design */}
      <Dialog
        open={showEventDialog}
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] max-w-2xl shadow-2xl overflow-hidden p-0 max-h-[95vh] flex flex-col">
          {/* Header with Gradient Accent */}
          <div className="relative px-5 pt-4 pb-3 border-b border-[var(--border)] bg-gradient-to-r from-[#4353FF]/5 via-transparent to-purple-500/5 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4353FF] to-[#6366F1] flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--card)] flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl mb-0.5">
                  {selectedEvent && !isEditMode
                    ? selectedEvent.title
                    : isEditMode
                      ? "Edit Event"
                      : "Create New Event"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedEvent && !isEditMode
                    ? `Event scheduled for ${selectedDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                    : "Schedule and manage your team events with AI-powered assistance"}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {selectedEvent && !isEditMode ? (
              /* View Event Mode */
              <div className="space-y-4">
                {/* Event Details Card */}
                <div className="p-5 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--muted)]/30 to-transparent space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 animate-pulse"
                      style={{
                        backgroundColor:
                          selectedEvent.color || "#6B7280",
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg mb-1">
                        {selectedEvent.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                        <Clock className="w-4 h-4" />
                        {selectedEvent.date.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                        {selectedEvent.isAllDay ? (
                          <span className="ml-1">
                            (All day)
                          </span>
                        ) : selectedEvent.startTime &&
                          selectedEvent.endTime ? (
                          <span className="ml-1">
                            • {selectedEvent.startTime} -{" "}
                            {selectedEvent.endTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="pt-3 border-t border-[var(--border)]">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-4 h-4 mt-0.5 text-[var(--muted-foreground)]" />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Description
                        </span>
                      </div>
                      <p className="text-sm pl-6">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  {selectedEvent.location && (
                    <div className="pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="text-sm">
                          {selectedEvent.location}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meeting URL */}
                  {selectedEvent.meetingUrl && (
                    <div className="pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <a
                          href={selectedEvent.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#4353FF] hover:underline"
                        >
                          {selectedEvent.meetingUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {selectedEvent.participants && (
                    <div className="pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="text-sm">
                          {selectedEvent.participants}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-[#4353FF] hover:bg-[#4353FF]/90 text-white"
                    onClick={handleEditClick}
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
                    onClick={handleDeleteClick}
                  >
                    Delete Event
                  </Button>
                </div>
              </div>
            ) : (
              /* Create Event Mode */
              <>
                {/* AI Quick Scheduler - Fancy Card */}
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
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder='Try: "Team standup tomorrow at 10am for 30 minutes"'
                          className="bg-[var(--background)]/80 backdrop-blur-sm border-[var(--border)] pr-10 shadow-sm"
                        />
                        <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#4353FF] to-[#6366F1] hover:from-[#5563FF] hover:to-[#7376F1] text-white gap-2 shadow-md hover:shadow-lg transition-all px-5"
                      >
                        <Wand2 className="w-4 h-4" />
                        Generate
                      </Button>
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
                  {/* Event Title */}
                  <div>
                    <Label className="text-xs mb-1.5 block">
                      Event Title *
                    </Label>
                    <Input
                      placeholder="Enter event name..."
                      className="bg-[var(--background)] border-[var(--border)]"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Description */}
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

                  {/* All Day Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
                    <Label
                      htmlFor="allday"
                      className="text-xs cursor-pointer"
                    >
                      All day event
                    </Label>
                    <Switch
                      id="allday"
                      checked={formData.isAllDay}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          isAllDay: checked as boolean,
                        })
                      }
                    />
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
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                        Start Time
                      </Label>
                      <div className="relative">
                        <Input
                          type="time"
                          disabled={formData.isAllDay}
                          className="bg-[var(--background)] border-[var(--border)] pl-9 disabled:opacity-50"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
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
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                        End Time
                      </Label>
                      <div className="relative">
                        <Input
                          type="time"
                          disabled={formData.isAllDay}
                          className="bg-[var(--background)] border-[var(--border)] pl-9 disabled:opacity-50"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
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

                  {/* Meeting URL */}
                  <div>
                    <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                      Meeting URL
                    </Label>
                    <div className="relative">
                      <Input
                        type="url"
                        placeholder="https://"
                        className="bg-[var(--background)] border-[var(--border)] pl-9"
                        value={formData.meetingUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meetingUrl: e.target.value,
                          })
                        }
                      />
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <Label className="text-xs mb-1.5 block text-[var(--muted-foreground)]">
                      Participants
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter email addresses..."
                        className="bg-[var(--background)] border-[var(--border)] pl-9"
                        value={formData.participants}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            participants: e.target.value,
                          })
                        }
                      />
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--border)] flex-shrink-0 bg-[var(--card)]">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    * Required fields
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="border-[var(--border)]"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-[#4353FF] to-[#6366F1] hover:from-[#5563FF] hover:to-[#7376F1] text-white shadow-lg hover:shadow-xl transition-all gap-2">
                      <Check className="w-4 h-4" />
                      {isEditMode
                        ? "Update Event"
                        : "Create Event"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}