'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import styles from './agenda.module.css';
import GoalsSidebar from '@/components/agenda/GoalsSidebar';
import EventModal from '@/components/agenda/EventModal';

interface AgendaClientProps {
  userId: string;
}

export default function AgendaClient({ userId }: AgendaClientProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ start: Date; end: Date; allDay: boolean } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        // Format for FullCalendar
        const formatted = data.map((e: any) => ({
          id: e.id,
          title: e.title,
          start: e.start_time,
          end: e.end_time,
          allDay: e.is_all_day,
          backgroundColor: e.color || getEventColor(e.type),
          textColor: e.text_color || '#ffffff',
          extendedProps: {
            type: e.type,
            color: e.color,
            text_color: e.text_color
          }
        }));
        setEvents(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      reading: '#4285F4',    // Blue
      flashcards: '#0F9D58', // Green
      video: '#DB4437',      // Red
      debate: '#F4B400',     // Yellow
      writing: '#9C27B0',    // Purple
      other: '#607D8B'       // Grey
    };
    return colors[type] || colors.other;
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setSelectedEvent(null);
    setIsModalOpen(true);
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Open modal to edit existing event
    setSelectedEvent(clickInfo.event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: event.startStr,
          end_time: event.endStr,
          is_all_day: event.allDay
        })
      });
    } catch (error) {
      console.error('Failed to update event dates:', error);
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    const { event } = resizeInfo;
    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: event.startStr,
          end_time: event.endStr
        })
      });
    } catch (error) {
      console.error('Failed to resize event:', error);
      resizeInfo.revert();
    }
  };

  const handleSaveEvent = (savedEvent: any) => {
    // Refresh events after save
    fetchEvents();
    setIsModalOpen(false);
  };

  return (
    <>
      <GoalsSidebar userId={userId} />
      
      <div className={styles.calendarWrapper}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          locales={[ptBrLocale]}
          locale="pt-br"
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
        />
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
        />
      )}

    </>
  );
}
