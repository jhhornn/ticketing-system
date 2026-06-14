import React, { useState, useEffect } from 'react';
import { EventsService, EventStatus, type Event } from '../services/events';
import { X, Calendar, MapPin, Users, Clock, AlertCircle, Ticket } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { ModalActionButton } from './ui';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: Event | null;
}

interface UpdateEventData {
  eventName?: string;
  eventDate?: string;
  saleStartTime?: string;
  status?: EventStatus;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
}) => {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState<UpdateEventData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBookings, setHasBookings] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        eventName: event.eventName,
        eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
        saleStartTime: event.saleStartTime ? new Date(event.saleStartTime).toISOString().slice(0, 16) : '',
        status: event.status,
      });
      setHasBookings((event.totalSeats || 0) - (event.availableSeats || 0) > 0);
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: UpdateEventData = {};
      if (formData.eventName !== event.eventName) updateData.eventName = formData.eventName;
      if (formData.eventDate && new Date(formData.eventDate).getTime() !== new Date(event.eventDate).getTime()) updateData.eventDate = formData.eventDate;
      if (formData.saleStartTime) {
        const newSaleTime = new Date(formData.saleStartTime).getTime();
        const oldSaleTime = event.saleStartTime ? new Date(event.saleStartTime).getTime() : 0;
        if (newSaleTime !== oldSaleTime) updateData.saleStartTime = formData.saleStartTime;
      }
      if (formData.status !== event.status) updateData.status = formData.status;

      await EventsService.update(event.id, updateData);
      
      showAlert({ type: 'success', title: 'Success', message: 'Event updated successfully' });
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      setError(errorMessage);
      showAlert({ type: 'error', title: 'Error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold font-poppins">Edit Event</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

          {hasBookings && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Warning: This event has bookings!</p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  <li>Venue and capacity cannot be changed.</li>
                  <li>Changing the date might affect existing ticket holders.</li>
                  <li>Status changes will be visible to attendees.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <h3 className="text-lg font-bold">Event Overview</h3>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.venueName || event.customVenue || 'No venue specified'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>Total Seats: {event.totalSeats}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Tickets Sold: {(event.totalSeats || 0) - (event.availableSeats || 0)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="eventName" className="text-sm font-semibold">Event Name</label>
              <input type="text" id="eventName" name="eventName" value={formData.eventName || ''} onChange={(e) => setFormData({ ...formData, eventName: e.target.value })} required className="w-full bg-input rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              <label htmlFor="eventDate" className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Event Date & Time</label>
              <input type="datetime-local" id="eventDate" name="eventDate" value={formData.eventDate || ''} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required className="w-full bg-input rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              <label htmlFor="saleStartTime" className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4" />Sale Start Time</label>
              <input type="datetime-local" id="saleStartTime" name="saleStartTime" value={formData.saleStartTime || ''} onChange={(e) => setFormData({ ...formData, saleStartTime: e.target.value })} className="w-full bg-input rounded-md border px-3 py-2 text-sm" />
              <p className="text-xs text-muted-foreground">Leave empty for immediate ticket sales.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-semibold">Event Status</label>
              <select id="status" name="status" value={formData.status || EventStatus.DRAFT} onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })} className="w-full bg-input rounded-md border px-3 py-2 text-sm">
                <option value={EventStatus.DRAFT}>Draft</option>
                <option value={EventStatus.ON_SALE}>On Sale</option>
                <option value={EventStatus.SOLD_OUT}>Sold Out</option>
                <option value={EventStatus.COMPLETED}>Completed</option>
                <option value={EventStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <ModalActionButton
              type="button"
              variant="cancel"
              fullWidth
              onClick={onClose}
              disabled={loading}
              className="rounded-md text-sm"
            >
              Cancel
            </ModalActionButton>
            <ModalActionButton
              type="submit"
              variant="primary"
              fullWidth
              className="rounded-md text-sm disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </ModalActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};
