import React from 'react';
import { X, MapPin, Building2, Users, Calendar, Globe } from 'lucide-react';
import type { Venue } from '../services/venues';

interface VenueDetailsModalProps {
    venue: Venue | null;
    isOpen: boolean;
    onClose: () => void;
}

export const VenueDetailsModal: React.FC<VenueDetailsModalProps> = ({ venue, isOpen, onClose }) => {
    if (!isOpen || !venue) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-in-bottom">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{venue.name}</h2>
                            <p className="text-white/90 text-sm mt-1">Venue Information</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Location Details */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Location
                            </h3>
                            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                                {venue.address && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-24 text-sm text-muted-foreground font-medium">Address:</div>
                                        <div className="flex-1 font-medium">{venue.address}</div>
                                    </div>
                                )}
                                {venue.city && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-24 text-sm text-muted-foreground font-medium">City:</div>
                                        <div className="flex-1 font-medium">{venue.city}</div>
                                    </div>
                                )}
                                {venue.state && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-24 text-sm text-muted-foreground font-medium">State:</div>
                                        <div className="flex-1 font-medium">{venue.state}</div>
                                    </div>
                                )}
                                {venue.country && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-24 text-sm text-muted-foreground font-medium">Country:</div>
                                        <div className="flex-1 font-medium flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            {venue.country}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Capacity Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Capacity
                            </h3>
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Capacity</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {venue.capacity.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sections (if available) */}
                        {venue.sections && venue.sections.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    Sections
                                </h3>
                                <div className="space-y-3">
                                    {venue.sections.map((section) => (
                                        <div
                                            key={section.id}
                                            className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold">{section.name}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    section.type === 'ASSIGNED'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {section.type === 'ASSIGNED' ? 'Assigned Seating' : 'General Admission'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Capacity: </span>
                                                    <span className="font-medium">{section.totalCapacity}</span>
                                                </div>
                                                {section.rows && section.seatsPerRow && (
                                                    <div>
                                                        <span className="text-muted-foreground">Layout: </span>
                                                        <span className="font-medium">
                                                            {section.rows} rows × {section.seatsPerRow} seats
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Created Date (if available) */}
                        {venue.createdAt && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Created
                                </h3>
                                <div className="bg-muted/50 rounded-xl p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(venue.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-muted/20">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
