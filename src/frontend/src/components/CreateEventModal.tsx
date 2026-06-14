import React, { useState, useEffect } from 'react';
import { EventsService, type CreateEventData } from '../services/events';
import { VenuesService, type Venue } from '../services/venues';
import { ModalActionButton } from './ui';
import { X, Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    eventName: '',
    eventDate: '',
    venueId: undefined,
    customVenue: '',
    totalSeats: 0,
    saleStartTime: '',
    isFree: false,
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRegisteredVenue, setUseRegisteredVenue] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadVenues();
    }
  }, [isOpen]);

  const loadVenues = async () => {
    try {
      const data = await VenuesService.getAll();
      setVenues(data);
    } catch (err) {
      console.error("Failed to load venues", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate totalSeats doesn't exceed venue capacity
      if (useRegisteredVenue && formData.venueId) {
        const selectedVenue = venues.find(v => v.id === Number(formData.venueId));
        if (selectedVenue && formData.totalSeats > selectedVenue.capacity) {
          setError(`Total seats cannot exceed venue capacity of ${selectedVenue.capacity}`);
          setLoading(false);
          return;
        }
      }

      const eventData: CreateEventData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
        saleStartTime: formData.saleStartTime ? new Date(formData.saleStartTime).toISOString() : undefined,
        venueId: useRegisteredVenue && formData.venueId ? Number(formData.venueId) : undefined,
        customVenue: useRegisteredVenue ? undefined : formData.customVenue,
        totalSeats: formData.totalSeats,
      };

      await EventsService.create(eventData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold font-poppins">Create New Event</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="eventName" className="text-sm font-semibold">Event Name</label>
            <input type="text" id="eventName" name="eventName" value={formData.eventName} onChange={handleChange} required className="w-full bg-input rounded-md border px-3 py-2 text-sm" placeholder="e.g., Summer Music Festival" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="eventDate" className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Event Date</label>
              <input type="datetime-local" id="eventDate" name="eventDate" value={formData.eventDate} onChange={handleChange} required className="w-full bg-input rounded-md border px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="saleStartTime" className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4" />Sale Start</label>
              <input type="datetime-local" id="saleStartTime" name="saleStartTime" value={formData.saleStartTime || ''} onChange={handleChange} className="w-full bg-input rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" />Venue</label>
              <div className="flex items-center gap-2 text-xs">
                <span className={useRegisteredVenue ? "font-bold" : ""}>Registered</span>
                <input type="checkbox" className="toggle toggle-primary" checked={!useRegisteredVenue} onChange={() => setUseRegisteredVenue(!useRegisteredVenue)} />
                <span className={!useRegisteredVenue ? "font-bold" : ""}>Custom</span>
              </div>
            </div>
            {useRegisteredVenue ? (
              <select name="venueId" value={formData.venueId || ''} onChange={handleChange} className="w-full bg-input rounded-md border px-3 py-2 text-sm">
                <option value="">Select a registered venue...</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Capacity: {v.capacity})</option>)}
              </select>
            ) : (
              <input type="text" name="customVenue" value={formData.customVenue || ''} onChange={handleChange} className="w-full bg-input rounded-md border px-3 py-2 text-sm" placeholder="Enter custom venue name" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="totalSeats" className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Total Seats</label>
              <input 
                type="number" 
                id="totalSeats" 
                name="totalSeats" 
                value={formData.totalSeats || ''} 
                onChange={handleChange} 
                required 
                min="1" 
                max={useRegisteredVenue && formData.venueId ? venues.find(v => v.id === Number(formData.venueId))?.capacity : undefined}
                className="w-full bg-input rounded-md border px-3 py-2 text-sm" 
              />
              {useRegisteredVenue && formData.venueId && (
                <p className="text-xs text-muted-foreground">
                  Venue capacity: {venues.find(v => v.id === Number(formData.venueId))?.capacity} seats. You can use fewer seats if needed.
                </p>
              )}
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Pricing</label>
                <div className="flex items-center gap-2 p-3 bg-input rounded-md border">
                    <input type="checkbox" id="isFree" name="isFree" checked={formData.isFree} onChange={handleChange} className="h-4 w-4 rounded" />
                    <label htmlFor="isFree" className="text-sm font-medium">This is a free event</label>
                </div>
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
              {loading ? 'Creating...' : 'Create Event'}
            </ModalActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};
