import React, { useState, useEffect } from 'react';
import { EventsService, EventStatus, type Event } from '../services/events';
import { X, Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { useModal } from '../context/ModalContext';

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
      // Initialize form with event data
      setFormData({
        eventName: event.eventName,
        eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
        saleStartTime: event.saleStartTime ? new Date(event.saleStartTime).toISOString().slice(0, 16) : '',
        status: event.status,
      });

      // Check if event has bookings
      setHasBookings((event.totalSeats || 0) - (event.availableSeats || 0) > 0);
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      // Only send changed fields
      const updateData: UpdateEventData = {};
      if (formData.eventName !== event.eventName) {
        updateData.eventName = formData.eventName;
      }
      if (formData.eventDate && new Date(formData.eventDate).getTime() !== new Date(event.eventDate).getTime()) {
        updateData.eventDate = formData.eventDate;
      }
      if (formData.saleStartTime) {
        const newSaleTime = new Date(formData.saleStartTime).getTime();
        const oldSaleTime = event.saleStartTime ? new Date(event.saleStartTime).getTime() : 0;
        if (newSaleTime !== oldSaleTime) {
          updateData.saleStartTime = formData.saleStartTime;
        }
      }
      if (formData.status !== event.status) {
        updateData.status = formData.status;
      }

      await EventsService.update(event.id, updateData);
      
      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Event updated successfully'
      });
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      setError(errorMessage);
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Important Notice */}
          {hasBookings && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Event has bookings</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• Venue and capacity cannot be changed</li>
                    <li>• Be careful changing the event date</li>
                    <li>• Status changes will affect ticket holders</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Read-only fields */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700">Event Details (Read-only)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Venue</label>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin size={18} />
                <span>{event.venueName || event.customVenue || 'No venue specified'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Total Capacity</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Users size={18} />
                <span>{event.totalSeats} seats</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bookings</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Users size={18} />
                <span>{(event.totalSeats || 0) - (event.availableSeats || 0)} tickets sold</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.eventName || ''}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="datetime-local"
                  value={formData.eventDate || ''}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="datetime-local"
                  value={formData.saleStartTime || ''}
                  onChange={(e) => setFormData({ ...formData, saleStartTime: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to make tickets available immediately
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Status
              </label>
              <select
                value={formData.status || EventStatus.DRAFT}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={EventStatus.DRAFT}>Draft</option>
                <option value={EventStatus.ON_SALE}>On Sale</option>
                <option value={EventStatus.SOLD_OUT}>Sold Out</option>
                <option value={EventStatus.COMPLETED}>Completed</option>
                <option value={EventStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
