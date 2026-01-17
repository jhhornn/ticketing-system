import React, { useState, useEffect } from 'react';
import { MapPin, Building, Plus, Search } from 'lucide-react';
import { VenuesService, type Venue } from '../../services/venues';
import { CreateVenueModal } from '../../components/CreateVenueModal';
import { VenueDetailsModal } from '../../components/VenueDetailsModal';
import { useAuth } from '../../context/AuthContext';

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
        loadVenues(); // Reload venues after creation
    };

    const filteredVenues = venues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (venue.city && venue.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                        Venues
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage event venues and locations
                    </p>
                </div>
                {isSuperAdmin() && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        Add Venue
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search venues by name or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-transparent focus:border-primary focus:ring-2 focus:ring-ring rounded-lg outline-none transition-all placeholder:text-muted-foreground font-medium"
                    />
                </div>
            </div>

            {/* Venues Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="h-48 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVenues.map((venue) => (
                        <div
                            key={venue.id}
                            onClick={() => setSelectedVenue(venue)}
                            className="bg-card border rounded-xl p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Building className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">{venue.name}</h3>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>
                                                {venue.city}, {venue.state || venue.country}
                                            </span>
                                        </div>
                                        <div className="text-xs">
                                            Capacity: {venue.capacity.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No venues found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        {searchQuery
                            ? "We couldn't find any venues matching your search."
                            : 'Get started by adding your first venue.'}
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        <Plus className="w-5 h-5" />
                        Add Your First Venue
                    </button>
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
