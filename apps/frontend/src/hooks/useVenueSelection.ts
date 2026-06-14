import { useState, useMemo, useCallback } from 'react';

// Types (should ideally be shared or imported from an API client)
export type SectionType = 'ASSIGNED' | 'GENERAL';

export interface InventorySection {
  id: number;
  name: string;
  type: SectionType;
  price: number;
  capacity: {
    total: number;
    available: number;
  };
  seats?: {
    id: number;
    row: string;
    number: string;
    status: string;
  }[];
  mapCoordinates?: any;
}

export interface UseVenueSelectionProps {
  sections: InventorySection[];
  initialSectionId?: number;
  maxQuantity?: number; // per order limit
}

export const useVenueSelection = ({
  sections,
  initialSectionId,
  maxQuantity = 6,
}: UseVenueSelectionProps) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    initialSectionId || (sections.length > 0 ? sections[0].id : null)
  );
  
  // For GA
  const [quantity, setQuantity] = useState<number>(1);
  
  // For Assigned
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);

  // Derived state
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const isGA = selectedSection?.type === 'GENERAL';

  // Actions
  const selectSection = useCallback((sectionId: number) => {
    setSelectedSectionId(sectionId);
    // Reset selection state when switching sections
    setQuantity(1);
    setSelectedSeatIds([]);
  }, []);

  const updateQuantity = useCallback((newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxQuantity) return;
    setQuantity(newQuantity);
  }, [maxQuantity]);

  const toggleSeat = useCallback((seatId: number) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= maxQuantity) {
          // Could return error or ignore
          return prev; 
        }
        return [...prev, seatId];
      }
    });
  }, [maxQuantity]);

  // Cart Payload Generator
  const getCartPayload = useCallback(() => {
    if (!selectedSection) return null;

    if (isGA) {
      return {
        sectionId: selectedSection.id,
        quantity,
        totalPrice: selectedSection.price * quantity,
        type: 'GENERAL',
      };
    } else {
      return {
        sectionId: selectedSection.id,
        seatIds: selectedSeatIds,
        quantity: selectedSeatIds.length,
        totalPrice: selectedSection.price * selectedSeatIds.length,
        type: 'ASSIGNED',
      };
    }
  }, [selectedSection, isGA, quantity, selectedSeatIds]);

  return {
    selectedSection,
    selectedSectionId,
    isGA,
    quantity,
    selectedSeatIds,
    selectSection,
    updateQuantity,
    toggleSeat,
    getCartPayload,
    canBook: isGA ? quantity > 0 : selectedSeatIds.length > 0,
  };
};
