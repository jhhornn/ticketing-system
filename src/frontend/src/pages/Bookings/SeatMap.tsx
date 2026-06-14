import React from 'react';

interface SeatMapSeat {
    id: number;
    row: string;
    number: string;
    status: string;
}

interface SeatMapProps {
    seats: SeatMapSeat[];
    selectedSeatIds: number[];
    onToggleSeat: (seatId: number) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeatIds, onToggleSeat }) => {
    const rows = React.useMemo(() => {
        const map = new Map<string, SeatMapSeat[]>();
        seats.forEach(seat => {
            if (!map.has(seat.row)) map.set(seat.row, []);
            map.get(seat.row)!.push(seat);
        });
        map.forEach(rowSeats => rowSeats.sort((a, b) => {
            const aNum = parseInt(a.number) || 0;
            const bNum = parseInt(b.number) || 0;
            return aNum - bNum;
        }));
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [seats]);

    const getSeatClasses = (seat: SeatMapSeat) => {
        const baseClasses = 'w-8 h-8 flex-shrink-0 rounded-md text-xs font-medium transition-colors border flex items-center justify-center';
        if (seat.status === 'BOOKED') return `${baseClasses} bg-muted-foreground/30 border-muted-foreground/50 text-muted-foreground cursor-not-allowed`;
        if (seat.status === 'RESERVED') return `${baseClasses} bg-warning/30 border-warning/50 text-warning-foreground cursor-not-allowed`;
        if (selectedSeatIds.includes(seat.id)) return `${baseClasses} bg-primary border-primary text-primary-foreground`;
        return `${baseClasses} bg-card border-border hover:border-primary cursor-pointer`;
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-card rounded-xl border shadow-soft">
            <div className="w-full max-w-full overflow-x-auto">
                <div className="min-w-min">
                    <div className="w-full h-10 bg-muted-foreground/20 rounded-lg mb-8 text-center text-sm font-semibold text-muted-foreground flex items-center justify-center border border-muted-foreground/30">
                        STAGE
                    </div>

                    {rows.map(([rowName, rowSeats]) => (
                        <div key={rowName} className="flex items-center gap-4 mb-4">
                            <div className="w-8 font-bold text-muted-foreground text-sm flex-shrink-0 sticky left-0 bg-card z-10 text-center">{rowName}</div>
                            <div className="flex gap-2 flex-nowrap">
                                {rowSeats.map(seat => (
                                    <button
                                        key={seat.id}
                                        className={getSeatClasses(seat)}
                                        onClick={() => seat.status === 'AVAILABLE' && onToggleSeat(seat.id)}
                                        disabled={seat.status !== 'AVAILABLE'}
                                        title={`Row ${seat.row} Seat ${seat.number}`}
                                    >
                                        {seat.number}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center text-xs font-medium pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-card border border-border rounded-sm"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded-sm"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-warning/30 border border-warning/50 rounded-sm"></div>
                    <span>Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted-foreground/30 border border-muted-foreground/50 rounded-sm"></div>
                    <span>Booked</span>
                </div>
            </div>
        </div>
    );
};
