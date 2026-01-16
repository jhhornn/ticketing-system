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
    // Group seats by row
    const rows = React.useMemo(() => {
        const map = new Map<string, SeatMapSeat[]>();
        seats.forEach(seat => {
            if (!map.has(seat.row)) map.set(seat.row, []);
            map.get(seat.row)!.push(seat);
        });
        // Sort seats in each row by number
        map.forEach(rowSeats => rowSeats.sort((a, b) => {
            // Handle both numeric and alphanumeric seat numbers
            const aNum = parseInt(a.number) || 0;
            const bNum = parseInt(b.number) || 0;
            return aNum - bNum;
        }));
        // Sort rows alphabetically
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [seats]);

    const getSeatColor = (seat: SeatMapSeat) => {
        if (seat.status === 'BOOKED') return 'bg-slate-300 cursor-not-allowed';
        if (seat.status === 'RESERVED') return 'bg-yellow-200 cursor-not-allowed';
        if (selectedSeatIds.includes(seat.id)) return 'bg-blue-600 text-white';
        return 'bg-white border border-slate-300 hover:border-blue-500 cursor-pointer';
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-full max-w-full overflow-x-auto">
                <div className="min-w-min">
                    <div className="w-full h-8 bg-slate-200 rounded-lg mb-8 text-center text-xs text-slate-500 flex items-center justify-center">
                        STAGE
                    </div>

                    {rows.map(([rowName, rowSeats]) => (
                        <div key={rowName} className="flex items-center gap-4 mb-4">
                            <div className="w-6 font-bold text-slate-400 text-sm flex-shrink-0 sticky left-0 bg-slate-50">{rowName}</div>
                            <div className="flex gap-2 flex-nowrap">
                                {rowSeats.map(seat => (
                                    <button
                                        key={seat.id}
                                        className={`w-8 h-8 flex-shrink-0 rounded-t-lg text-xs font-medium transition-colors ${getSeatColor(seat)}`}
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

            {/* Legend */}
            <div className="flex gap-4 justify-center flex-wrap text-xs pt-4 border-t">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border border-slate-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-200 rounded"></div>
                    <span>Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-300 rounded"></div>
                    <span>Booked</span>
                </div>
            </div>
        </div>
    );
};
