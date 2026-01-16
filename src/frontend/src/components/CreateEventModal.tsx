import React, { useState, useEffect } from 'react';
import { EventsService, type CreateEventData } from '../services/events';
import { VenuesService, type Venue } from '../services/venues';
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
      // Find selected venue to get capacity if utilizing registered venue
      let totalSeats = formData.totalSeats;
      if (useRegisteredVenue && formData.venueId) {
        const selectedVenue = venues.find(v => v.id === Number(formData.venueId));
        if (selectedVenue) {
          totalSeats = selectedVenue.capacity;
        }
      }

      const eventData: CreateEventData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
        saleStartTime: formData.saleStartTime
          ? new Date(formData.saleStartTime).toISOString()
          : undefined,
        venueId: useRegisteredVenue && formData.venueId ? Number(formData.venueId) : undefined,
        customVenue: useRegisteredVenue ? undefined : formData.customVenue,
        totalSeats: totalSeats,
      };

      await EventsService.create(eventData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        eventName: '',
        eventDate: '',
        venueId: undefined,
        customVenue: '',
        totalSeats: 0,
        saleStartTime: '',
        isFree: false,
      });
      setUseRegisteredVenue(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create New Event</h2>
            <p className="text-sm text-muted-foreground">Fill in the details for your upcoming event.</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="eventName" className="text-sm font-medium flex items-center gap-2">
                Event Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Summer Music Festival 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Sale Start
                </label>
                <input
                  type="datetime-local"
                  name="saleStartTime"
                  value={formData.saleStartTime || ''}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Venue Section */}
            <div className="space-y-4 border p-4 rounded-lg bg-secondary/20">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Venue Location
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className={useRegisteredVenue ? "text-primary font-bold" : "text-muted-foreground"}>Registered</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!useRegisteredVenue}
                      onChange={() => setUseRegisteredVenue(!useRegisteredVenue)}
                    />
                    <div className="w-9 h-5 bg-primary/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className={!useRegisteredVenue ? "text-primary font-bold" : "text-muted-foreground"}>Custom</span>
                </div>
              </div>

              {useRegisteredVenue ? (
                <select
                  name="venueId"
                  value={formData.venueId || ''}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a Venue...</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.capacity} seats)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="customVenue"
                  value={formData.customVenue || ''}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Enter venue name/address"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Total Seats <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats || ''}
                  onChange={handleChange}
                  required={!useRegisteredVenue} // If registered, we might infer capacity
                  disabled={useRegisteredVenue && !!formData.venueId} // Disable if registered venue selected (auto-fill)
                  min="1"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="1000"
                />
                {useRegisteredVenue && formData.venueId && (
                  <p className="text-xs text-muted-foreground">Capacity auto-set from venue</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Pricing
                </label>
                <div className="flex h-10 items-center space-x-2 rounded-md border border-input bg-background px-3 py-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-ring"
                  />
                  <label htmlFor="isFree" className="text-sm font-medium cursor-pointer">
                    Free Event
                  </label>
                </div>
                <p className="text-xs text-amber-600">
                  ⓘ Ticket prices are set when you create sections
                </p>
              </div>
            </div>

            {/* Info Box about Sections */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 About Event Sections</h4>
              <p className="text-xs text-blue-700 mb-2">
                After creating your event, you'll need to add ticket sections (e.g., General Admission, VIP, etc.) 
                to make it bookable.
              </p>
              <p className="text-xs text-blue-600">
                You can add sections by editing the event or directly in the database.
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
