import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService, type Event, type EventInventory } from '../../services/events';
import { ReservationsService } from '../../services/reservations';
import { SeatMap } from './SeatMap';
import { ErrorModal } from '../../components/ErrorModal';
import { format } from 'date-fns';
import { useVenueSelection } from '../../hooks/useVenueSelection';
import { ArrowLeft } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data State
    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<EventInventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchaseEligibility, setPurchaseEligibility] = useState<{ 
        canPurchase: boolean; 
        reason?: string 
    } | null>(null);

    // Venue Selection Hook
    const {
        selectedSection,
        selectedSectionId,
        selectSection,
        isGA,
        quantity,
        updateQuantity,
        selectedSeatIds,
        toggleSeat,
        canBook,
        getCartPayload
    } = useVenueSelection({
        sections: inventory?.sections || []
    });

    useEffect(() => {
        if (id) {
            loadData(parseInt(id));
        }
    }, [id]);

    const loadData = async (eventId: number) => {
        try {
            setLoading(true);
            const [eventData, inventoryData, eligibilityData] = await Promise.all([
                EventsService.getAll().then(all => all.find(e => e.id === eventId)),
                EventsService.getInventory(eventId),
                EventsService.canPurchaseTickets(eventId)
            ]);

            if (eventData) {
                setEvent(eventData);
            } else {
                setError(`Event with ID ${eventId} not found`);
                return;
            }

            setInventory(inventoryData);
            setPurchaseEligibility(eligibilityData);

            // Auto-select first section with availability if possible? 
            // The hook selects first section by default if initialized with sections.
            // Since we load sections async, we might need to manually trigger selection if hook doesn't auto-update on prop change?
            // The hook uses: initialSectionId || (sections.length > 0 ? sections[0].id : null)
            // But this is only for initial state.
            // We might need to select first section once loaded if none selected.
            // Actually, simply passing sections to hook will update derived state, but selectedSectionId state might stick to null.
            // Let's force select first section if loaded.
            if (inventoryData.sections.length > 0) {
                // But we can't call selectSection here easily inside async without refs or simpler logic.
                // Better: Pass `initialSectionId` to hook only when inventory is loaded?
                // Current hook implementation initializes state ONCE.
                // We should probably key the hook or just handle selection in UI.
                // Let's rely on the user or modify hook to auto-select?
                // Simpler: Key the main content or handle selection logic. 
                // Actually, if selectedSectionId is null, UI will show nothing.
            }

        } catch (err: unknown) {
            console.error('Error loading event details:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error?.response?.data?.message || error?.message || 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    // Effect to auto-select first section when inventory loads
    useEffect(() => {
        if (inventory?.sections && inventory.sections.length > 0 && !selectedSectionId) {
            selectSection(inventory.sections[0].id);
        }
    }, [inventory, selectedSectionId, selectSection]);


    const handleReservation = async () => {
        if (!event || !selectedSection) return;

        try {
            const payload = getCartPayload();
            if (!payload) return;

            // Transform payload for backend DTO
            // Backend expects: { seats?: {seatId, version}[], sectionId?, quantity? }
            // Derived payload has: { sectionId, quantity, type, seatIds?, ... }

            const reservationData: {
                sectionId?: number;
                quantity?: number;
                seats?: Array<{ seatId: number; version: number }>;
            } = {
                sectionId: payload.sectionId, // Already a number
                quantity: payload.quantity
            };

            if (payload.type === 'ASSIGNED' && payload.seatIds) {
                // Find seat versions from inventory
                // Inventory has id as string. DTO needs number.
                const selectedSeats = selectedSection.seats?.filter(s => payload.seatIds!.includes(s.id)) || [];

                reservationData.seats = selectedSeats.map(s => ({
                    seatId: s.id,
                    version: (s as { version?: number }).version || 0 // Version is now added to backend payload!
                }));
                // Override quantity for assigned just in case (though backend might ignore it if seats present)
                reservationData.quantity = undefined;
                // Wait, logic says strictly: if sectionId is present, it uses GA logic?
                // Backend logic: "if (dto.sectionId) { return this.reserveGaTickets... }"
                // Ah! This is broken for Assigned Seating if I send sectionId!
                // Backend assumes if sectionId is present, it is GA!

                // CRITICAL CORRECTION:
                // If ASSIGNED, do NOT send sectionId to backend for current implementation 
                // OR update backend to handle sectionId for assigned (used for reporting).
                // My backend implementation:
                /* 
                    if (dto.sectionId) { return this.reserveGaTickets(...) }
                */
                // So if I send sectionId, it calls GA logic. GA logic checks if section.type === 'GENERAL'.
                // If I send sectionId for assigned section, GA logic will throw "Not a General Admission section".
                // So for ASSIGNED, I MUST NOT send sectionId, OR I must update backend to check type before routing.

                // Fix strategy: Only send sectionId if GA.
                if (payload.type === 'ASSIGNED') {
                    delete reservationData.sectionId;
                    delete reservationData.quantity; // Assigned uses seats array length
                }
            }

            const response = await ReservationsService.createReservation(
                event.id, 
                reservationData as import('../../services/reservations').CreateReservationRequest
            );

            alert('Reservation successful! Redirecting to checkout...');
            // Pass reservation data to checkout page via state
            navigate('/checkout', { 
                state: { 
                    reservationId: response.id,
                    eventId: event.id,
                    eventName: event.eventName
                } 
            });

        } catch (err: unknown) {
            console.error('Reservation failed', err);
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to reserve seats. Please try again.');
        }
    };

    if (loading) return <div className="max-w-4xl mx-auto p-6">Loading event details...</div>;

    if (error) return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        </div>
    );

    if (!event) return <div className="max-w-4xl mx-auto p-6">Event not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/events')}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Events
            </button>

            {/* Event Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
                <h1 className="text-3xl font-bold mb-2">{event.eventName}</h1>
                <div className="text-slate-500 mb-4">
                    {format(new Date(event.eventDate), 'MMMM d, yyyy h:mm aa')} • {event.venueName || event.customVenue || 'Main Hall'}
                </div>
                <div className="flex gap-4 text-sm">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                        Total Capacity: {event.totalSeats}
                    </span>
                    {event.isFree && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">Free Event</span>}
                </div>
            </div>

            {/* Inventory Section */}
            {!inventory ? (
                <div className="text-center p-8 text-slate-500">No tickets available.</div>
            ) : (
                <>
                    {/* Purchase Eligibility Warning */}
                    {purchaseEligibility && !purchaseEligibility.canPurchase && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-amber-900">Tickets Not Available</p>
                                    <p className="text-sm text-amber-700 mt-1">{purchaseEligibility.reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

                    {/* Section Tabs */}
                    <div className="flex overflow-x-auto border-b bg-slate-50">
                        {inventory.sections.map(section => (
                            <button
                                key={section.id}
                                className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${selectedSectionId === section.id
                                    ? 'border-primary text-primary bg-white'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                                onClick={() => selectSection(section.id)}
                            >
                                {section.name} {section.price > 0 ? `($${section.price})` : '(Free)'}
                            </button>
                        ))}
                    </div>

                    {/* Section Content */}
                    <div className="p-6 min-h-[400px]">
                        {selectedSection ? (
                            <>
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">{selectedSection.name}</h2>
                                        <p className="text-slate-500 text-sm">
                                            {selectedSection.type === 'GENERAL' ? 'General Admission' : 'Reserved Seating'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {selectedSection.price > 0 ? `$${selectedSection.price}` : 'Free'}
                                        </div>
                                        <div className="text-sm text-slate-500">per ticket</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {selectedSection.capacity.available} available
                                        </div>
                                    </div>
                                </div>

                                {isGA ? (
                                    <div className="max-w-md mx-auto py-12 text-center">
                                        <label className="block text-slate-700 font-medium mb-4">Select Quantity</label>
                                        <div className="flex items-center justify-center gap-4 mb-8">
                                            <button
                                                className="w-12 h-12 rounded-full border border-slate-300 flex items-center justify-center text-xl hover:bg-slate-50 disabled:opacity-50"
                                                onClick={() => updateQuantity(quantity - 1)}
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-3xl font-bold w-16 tabular-nums">{quantity}</span>
                                            <button
                                                className="w-12 h-12 rounded-full border border-slate-300 flex items-center justify-center text-xl hover:bg-slate-50 disabled:opacity-50"
                                                onClick={() => updateQuantity(quantity + 1)}
                                                disabled={quantity >= Math.min(6, selectedSection.capacity.available)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg inline-block">
                                            <div className="text-sm text-slate-500">Total Price</div>
                                            <div className="text-2xl font-bold">
                                                {selectedSection.price > 0 ? `$${selectedSection.price * quantity}` : 'Free'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-x-auto">
                                        <SeatMap
                                            seats={selectedSection.seats || []}
                                            selectedSeatIds={selectedSeatIds}
                                            onToggleSeat={toggleSeat}
                                        />
                                        <div className="mt-4 text-center text-sm text-slate-500">
                                            Select seats from the map above • Scroll horizontally to see all seats
                                        </div>
                                    </div>
                                )}

                                {/* Sticky Bottom Bar for Mobile / Action Area */}
                                <div className="mt-8 pt-6 border-t flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-slate-500">Total</div>
                                        <div className="text-2xl font-bold text-primary">
                                            {selectedSection.price > 0 
                                                ? (isGA ? `$${selectedSection.price * quantity}` : `$${selectedSection.price * selectedSeatIds.length}`)
                                                : 'Free'
                                            }
                                        </div>
                                    </div>
                                    <button
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        disabled={!canBook || (purchaseEligibility && !purchaseEligibility.canPurchase)}
                                        onClick={handleReservation}
                                        title={purchaseEligibility && !purchaseEligibility.canPurchase ? purchaseEligibility.reason : ''}
                                    >
                                        {selectedSection.price > 0 ? 'Book' : 'Reserve'} {isGA ? `${quantity} Ticket${quantity > 1 ? 's' : ''}` : `${selectedSeatIds.length} Seat${selectedSeatIds.length !== 1 ? 's' : ''}`}
                                    </button>
                                </div>

                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                Select a section to view availability
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}

            <ErrorModal
                isOpen={!!error}
                onClose={() => setError(null)}
                message={error || ''}
                title="Booking Failed"
            />
        </div>
    );
};
