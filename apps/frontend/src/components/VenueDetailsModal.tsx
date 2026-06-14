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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-poppins">{venue.name}</h2>
                            <p className="text-muted-foreground text-sm mt-1">Venue Information</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Location Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            {venue.address && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Address:</span>
                                    <span className="font-medium">{venue.address}</span>
                                </div>
                            )}
                            {venue.city && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">City:</span>
                                    <span className="font-medium">{venue.city}</span>
                                </div>
                            )}
                            {venue.state && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">State:</span>
                                    <span className="font-medium">{venue.state}</span>
                                </div>
                            )}
                            {venue.country && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Country:</span>
                                    <span className="font-medium flex items-center gap-1">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        {venue.country}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Capacity Information
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Venue Capacity</span>
                            <span className="text-2xl font-bold text-primary">
                                {venue.capacity.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {venue.sections && venue.sections.length > 0 && (
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Defined Sections
                            </h3>
                            <div className="space-y-3">
                                {venue.sections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="bg-card border rounded-lg p-4 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold">{section.name}</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                section.type === 'ASSIGNED'
                                                    ? 'bg-blue-500/20 text-blue-700'
                                                    : 'bg-green-500/20 text-green-700'
                                            }`}>
                                                {section.type === 'ASSIGNED' ? 'Assigned Seating' : 'General Admission'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                            <div>Capacity: <span className="font-medium text-foreground">{section.totalCapacity}</span></div>
                                            {section.rows && section.seatsPerRow && (
                                                <div>
                                                    Layout: <span className="font-medium text-foreground">
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

                    {venue.createdAt && (
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Created On
                            </h3>
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
                    )}
                </div>

                <div className="border-t p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-5 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
