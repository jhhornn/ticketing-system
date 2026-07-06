import React, { useState, useEffect } from 'react';
import { MapPin, Building, Plus, Search } from 'lucide-react';
import { VenuesService, type Venue } from '../../services/venues';
import { CreateVenueModal } from '../../components/CreateVenueModal';
import { VenueDetailsModal } from '../../components/VenueDetailsModal';
import { useAuth } from '../../hooks/useAuth';

export const VenuesPage: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

    useEffect(() => {
        loadVenues();
    }, []);

    const loadVenues = async () => {
        try {
            setLoading(true);
            const data = await VenuesService.getAll();
            setVenues(data);
        } catch (error) {
            console.error('Failed to load venues', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVenueCreated = () => {
        loadVenues();
    };

    const filteredVenues = venues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (venue.city && venue.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-poppins mb-2">Venues</h1>
                    <p className="text-muted-foreground text-lg">Manage event venues and locations</p>
                </div>
                {isSuperAdmin() && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-soft hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Venue
                    </button>
                )}
            </div>

            <div className="bg-card p-4 rounded-xl border shadow-sm mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search venues by name or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-input border rounded-lg focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVenues.map((venue) => (
                        <div
                            key={venue.id}
                            onClick={() => setSelectedVenue(venue)}
                            className="bg-card border rounded-xl p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-soft"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Building className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2 font-poppins">{venue.name}</h3>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span>
                                                {venue.city}, {venue.state || venue.country}
                                            </span>
                                        </div>
                                        <div className="text-xs">
                                            Capacity: <span className="font-medium text-foreground">{venue.capacity.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold font-poppins mb-2">No Venues Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        {searchQuery
                            ? "We couldn't find any venues matching your search criteria."
                            : 'Start by adding your first venue to manage its details.'}
                    </p>
                    {isSuperAdmin() && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Venue
                        </button>
                    )}
                </div>
            )}

            <CreateVenueModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleVenueCreated}
            />

            <VenueDetailsModal
                venue={selectedVenue}
                isOpen={selectedVenue !== null}
                onClose={() => setSelectedVenue(null)}
            />
        </div>
    );
};