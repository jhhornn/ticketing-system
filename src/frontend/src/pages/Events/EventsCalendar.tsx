import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventsService } from '../../services/events';
import { useNavigate } from 'react-router-dom';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
}

export const EventsCalendar: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        loadEvents();
    }, [date, view]);

    const loadEvents = async () => {
        try {
            const data = await EventsService.getAll();
            const calendarEvents: CalendarEvent[] = data.map(e => ({
                id: e.id,
                title: e.eventName,
                start: new Date(e.eventDate),
                end: new Date(new Date(e.eventDate).getTime() + 2 * 60 * 60 * 1000), // Default 2 hours if no end time
                allDay: false,
                resource: e,
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to load events", error);
        }
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        navigate(`/events/${event.id}`);
    };

    return (
        <div style={{ height: '80vh', padding: '1rem', background: 'white', borderRadius: '8px' }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
            />
        </div>
    );
};
