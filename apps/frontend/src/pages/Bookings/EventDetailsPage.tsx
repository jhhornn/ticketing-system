import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService, type Event, type EventInventory } from '../../services/events';
import { ReservationsService } from '../../services/reservations';
import { DiscountsService } from '../../services/discounts';
import { SeatMap } from './SeatMap';
import { ErrorModal } from '../../components/ErrorModal';
import { format } from 'date-fns';
import { useVenueSelection } from '../../hooks/useVenueSelection';
import { ArrowLeft, Tag, Check, X, Info, Calendar, MapPin } from 'lucide-react';
import { useReservationErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../../components/ErrorDisplay';

export const EventDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<EventInventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchaseEligibility, setPurchaseEligibility] = useState<{
        canPurchase: boolean;
        reason?: string
    } | null>(null);

    const [discountCode, setDiscountCode] = useState('');
    const [validatingDiscount, setValidatingDiscount] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<{
        code: string;
        amount: number;
        type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    } | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);

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

            // No-op: inventoryData.sections.length > 0

        } catch (err: unknown) {
            console.error('Error loading event details:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error?.response?.data?.message || error?.message || 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (inventory?.sections && inventory.sections.length > 0 && !selectedSectionId) {
            selectSection(inventory.sections[0].id);
        }
    }, [inventory, selectedSectionId, selectSection]);

    const handleApplyDiscount = async () => {
        if (!discountCode.trim() || !event) return;

        try {
            setValidatingDiscount(true);
            setDiscountError(null);

            const result = await DiscountsService.validate(discountCode.trim(), event.id);

            if (result.valid && result.discount) {
                setAppliedDiscount({
                    code: result.discount.code,
                    amount: result.discount.amount,
                    type: result.discount.type,
                });
                setDiscountError(null);
            } else {
                setAppliedDiscount(null);
                setDiscountError(result.reason || 'Invalid discount code');
            }
        } catch (error: unknown) {
            setAppliedDiscount(null);
            if (typeof error === 'object' && error !== null && 'response' in error) {
                // @ts-expect-error: dynamic error shape
                setDiscountError(error.response?.data?.message || 'Failed to validate discount code');
            } else if (error instanceof Error) {
                setDiscountError(error.message);
            } else {
                setDiscountError('Failed to validate discount code');
            }
        } finally {
            setValidatingDiscount(false);
        }
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError(null);
    };

    const calculatePrice = () => {
        if (!selectedSection) return 0;

        const basePrice = isGA
            ? selectedSection.price * quantity
            : selectedSection.price * selectedSeatIds.length;

        if (!appliedDiscount || basePrice === 0) return basePrice;

        let discountAmount = 0;
        if (appliedDiscount.type === 'PERCENTAGE') {
            discountAmount = (basePrice * appliedDiscount.amount) / 100;
        } else {
            discountAmount = appliedDiscount.amount;
        }

        return Math.max(0, basePrice - discountAmount);
    };

    const { error: reservationError, handleError: handleReservationError, clearError: clearReservationError, isRetrying } = useReservationErrorHandler(() => {
        loadData(parseInt(id!));
    });

    const handleReservation = async (arg?: unknown) => {
        const isRetry = arg === true;

        if (!event || !selectedSection) return;

        if (!isRetry) {
            clearReservationError();
            setError(null);
        }

        try {
            const payload = getCartPayload();
            if (!payload) return;

            const reservationData: {
                sectionId?: number;
                quantity?: number;
                seats?: Array<{ seatId: number; version: number }>;
            } = {
                sectionId: payload.sectionId,
                quantity: payload.quantity
            };

            if (payload.type === 'ASSIGNED' && payload.seatIds) {
                const selectedSeats = selectedSection.seats?.filter(s => payload.seatIds!.includes(s.id)) || [];

                reservationData.seats = selectedSeats.map(s => ({
                    seatId: s.id,
                    version: (s as { version?: number }).version || 0
                }));
                if (payload.type === 'ASSIGNED') {
                    delete reservationData.sectionId;
                    delete reservationData.quantity;
                }
            }

            const response = await ReservationsService.createReservation(
                event.id,
                reservationData as import('../../services/reservations').CreateReservationRequest
            );

            const seatNumbers = payload.type === 'ASSIGNED'
                ? selectedSection.seats?.filter(s => payload.seatIds?.includes(s.id)).map(s => s.number) || []
                : [`GA - ${quantity} ticket(s)`];

            const basePrice = isGA
                ? selectedSection.price * quantity
                : selectedSection.price * selectedSeatIds.length;

            let finalPrice = basePrice;
            if (appliedDiscount) {
                const discountAmount = appliedDiscount.type === 'PERCENTAGE'
                    ? (basePrice * appliedDiscount.amount) / 100
                    : appliedDiscount.amount;
                finalPrice = Math.max(0, basePrice - discountAmount);
            }

            navigate('/checkout', {
                state: {
                    reservationId: response.id,
                    eventId: event.id,
                    eventName: event.eventName,
                    discountCode: appliedDiscount?.code,
                    seatNumbers,
                    sectionName: selectedSection.name,
                    quantity: isGA ? quantity : selectedSeatIds.length,
                    pricePerSeat: selectedSection.price,
                    totalPrice: finalPrice,
                }
            });

        } catch (err: unknown) {
            console.error('Reservation failed', err);

            handleReservationError(err, {
                context: {
                    affectedResource: isGA ? `${quantity} tickets` : `${selectedSeatIds.length} seats`
                },
                retryAction: () => handleReservation(true)
            });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading event details...</span>
        </div>
    );

    if (error) return (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
        </div>
    );

    if (!event) return (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            Event not found.
        </div>
    );

    return (
        <div className="animate-fade-in">
            <button
                onClick={() => navigate('/events')}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Events
            </button>

            <div className="bg-card p-6 rounded-xl shadow-soft border mb-8">
                <h1 className="text-3xl font-bold font-poppins mb-2">{event.eventName}</h1>
                <div className="text-muted-foreground mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.eventDate), 'MMMM d, yyyy h:mm aa')}
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venueName || event.customVenue || 'Main Hall'}
                    </div>
                </div>
                <div className="flex gap-4 text-sm mt-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-muted-foreground font-medium">
                        Capacity: {event.totalSeats}
                    </span>
                    <span className="bg-muted px-3 py-1 rounded-full text-muted-foreground font-medium">
                        Status: {event.status}
                    </span>
                </div>
            </div>

            {!inventory ? (
                <div className="bg-card text-center p-8 rounded-xl border shadow-soft text-muted-foreground">
                    <Info className="w-12 h-12 mx-auto mb-4" />
                    <p>No ticket inventory available for this event.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
                    {purchaseEligibility && !purchaseEligibility.canPurchase && (
                        <div className="bg-destructive/10 border-b border-destructive/20 text-destructive p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Tickets Not Available</p>
                                <p className="text-sm mt-1">{purchaseEligibility.reason}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex overflow-x-auto border-b border-border">
                        {inventory.sections.map(section => (
                            <button
                                key={section.id}
                                className={`flex-shrink-0 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${selectedSectionId === section.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => selectSection(section.id)}
                            >
                                {section.name} {section.price > 0 ? `($${section.price})` : '(Free)'}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 min-h-[400px]">
                        {selectedSection ? (
                            <>
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold mb-1">{selectedSection.name}</h2>
                                        <p className="text-muted-foreground text-sm">
                                            {selectedSection.type === 'GENERAL' ? 'General Admission' : 'Reserved Seating'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {selectedSection.price > 0 ? `$${selectedSection.price}` : 'Free'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">per ticket</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {selectedSection.capacity.available} available
                                        </div>
                                    </div>
                                </div>

                                {isGA ? (
                                    <div className="max-w-md mx-auto py-12 text-center">
                                        <label className="block text-foreground font-semibold mb-4 text-lg">Select Quantity</label>
                                        <div className="flex items-center justify-center gap-4 mb-8">
                                            <button
                                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl hover:bg-secondary disabled:opacity-50 transition-colors"
                                                onClick={() => updateQuantity(quantity - 1)}
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-3xl font-bold w-16 tabular-nums">{quantity}</span>
                                            <button
                                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl hover:bg-secondary disabled:opacity-50 transition-colors"
                                                onClick={() => updateQuantity(quantity + 1)}
                                                disabled={quantity >= Math.min(6, selectedSection.capacity.available)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="bg-muted p-4 rounded-lg inline-block border">
                                            <div className="text-sm text-muted-foreground">Current Total</div>
                                            <div className="text-2xl font-bold text-primary">
                                                {selectedSection.price > 0 ? `$${(selectedSection.price * quantity).toFixed(2)}` : 'Free'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <SeatMap
                                            seats={selectedSection.seats || []}
                                            selectedSeatIds={selectedSeatIds}
                                            onToggleSeat={toggleSeat}
                                        />
                                        <div className="mt-4 text-center text-sm text-muted-foreground">
                                            Select seats from the map above • Scroll horizontally to see all seats
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-border space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">
                                            Have a discount code?
                                        </label>
                                        {!appliedDiscount ? (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={discountCode}
                                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                                        placeholder="Enter code"
                                                        className="w-full pl-10 pr-3 py-2 bg-input border rounded-lg focus:ring-primary focus:border-primary"
                                                        onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleApplyDiscount}
                                                    disabled={!discountCode.trim() || validatingDiscount}
                                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 disabled:opacity-50"
                                                >
                                                    {validatingDiscount ? 'Checking...' : 'Apply'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 text-success rounded-lg">
                                                <Check className="w-5 h-5" />
                                                <div className="flex-1">
                                                    <div className="font-semibold">
                                                        Code "{appliedDiscount.code}" applied!
                                                    </div>
                                                    <div className="text-sm">
                                                        {appliedDiscount.type === 'PERCENTAGE'
                                                            ? `${appliedDiscount.amount}% discount`
                                                            : `$${appliedDiscount.amount} off`}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleRemoveDiscount}
                                                    className="p-1 hover:bg-success/20 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {discountError && (
                                            <div className="text-sm text-destructive flex items-center gap-1">
                                                <X className="w-4 h-4" />
                                                {discountError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg border">
                                        <div>
                                            {selectedSection.price > 0 ? (
                                                <>
                                                    <div className="text-sm text-muted-foreground">Total Payable</div>
                                                    {appliedDiscount && (
                                                        <div className="text-xs text-muted-foreground line-through">
                                                            Original: ${(isGA ? selectedSection.price * quantity : selectedSection.price * selectedSeatIds.length).toFixed(2)}
                                                        </div>
                                                    )}
                                                    <div className="text-3xl font-bold text-primary">
                                                        ${calculatePrice().toFixed(2)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-3xl font-bold text-primary">Free</div>
                                            )}
                                        </div>
                                        <button
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-bold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            disabled={!canBook || (purchaseEligibility ? !purchaseEligibility.canPurchase : false) || isRetrying}
                                            onClick={handleReservation}
                                            title={purchaseEligibility && !purchaseEligibility.canPurchase ? purchaseEligibility.reason : ''}
                                        >
                                            {isRetrying ? 'Processing...' : (selectedSection.price > 0 ? 'Book' : 'Reserve')} {isGA ? `${quantity} Ticket${quantity > 1 ? 's' : ''}` : `${selectedSeatIds.length} Seat${selectedSeatIds.length !== 1 ? 's' : ''}`}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                                <Info className="w-10 h-10 mb-4" />
                                <p className="text-lg font-semibold">No section selected</p>
                                <p className="text-sm">Please select a section to view availability and book tickets.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {reservationError && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-xl border shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <ErrorDisplay
                            error={reservationError}
                            onPrimaryAction={() => {
                                if (reservationError.primaryAction.action === 'retry') {
                                    handleReservation();
                                } else if (reservationError.primaryAction.action === 'retry_modified') {
                                    clearReservationError();
                                } else if (reservationError.primaryAction.action === 'restart') {
                                    clearReservationError();
                                    loadData(parseInt(id!));
                                } else if (reservationError.primaryAction.action === 'contact_support') {
                                    window.location.href = 'mailto:support@ticketing.com';
                                }
                            }}
                            onSecondaryAction={
                                reservationError.secondaryAction ? () => {
                                    if (reservationError.secondaryAction?.action === 'restart') {
                                        clearReservationError();
                                        loadData(parseInt(id!));
                                    }
                                } : undefined
                            }
                            onDismiss={clearReservationError}
                        />
                    </div>
                </div>
            )}

            <ErrorModal
                isOpen={!!error && !reservationError}
                onClose={() => setError(null)}
                message={error || ''}
                title="Booking Failed"
            />
        </div>
    );
};