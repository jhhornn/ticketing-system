import api from './api';

export const EventStatus = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  ON_SALE: 'ON_SALE',
  SOLD_OUT: 'SOLD_OUT',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type EventStatus = typeof EventStatus[keyof typeof EventStatus];

export interface Event {
  id: number;
  eventName: string;
  eventDescription?: string;
  eventType?: string;
  eventDate: string;
  eventTime?: string;
  venueId: number | null;
  venueName: string | null;
  customVenue: string | null;
  totalSeats: number;
  availableSeats: number;
  status: EventStatus;
  saleStartTime?: string;
  isFree: boolean;
  isTicketed?: boolean;
  createdBy: string;
  createdAt: string;
  hasActiveDiscounts?: boolean;
}

export interface CreateEventData {
  eventName: string;
  eventDate: string;
  venueId?: number;
  customVenue?: string;
  totalSeats: number;
  saleStartTime?: string;
  isFree?: boolean;
  ticketPrice?: number;
}

export interface UpdateEventData {
  eventName?: string;
  eventDate?: string;
  venueId?: number;
  customVenue?: string;
  totalSeats?: number;
  status?: EventStatus;
  isFree?: boolean;
}

export const EventsService = {
  getAll: async (onlyOwned?: boolean) => {
    const response = await api.get<{ success: boolean; data: Event[] }>('/events', { 
      params: { onlyOwned } 
    });
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Event }>(`/events/${id}`);
    return response.data.data;
  },

  create: async (data: CreateEventData) => {
    const response = await api.post<{ success: boolean; data: Event }>('/events', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateEventData) => {
    const response = await api.patch<{ success: boolean; data: Event }>(`/events/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    await api.delete(`/events/${id}`);
  },

  getInventory: async (id: number) => {
    const response = await api.get<{ success: boolean; data: EventInventoryApiResponse }>(`/events/${id}/inventory`);
    const inventory = response.data.data;

    // The backend serializes Prisma BigInt IDs as strings. Normalize them at
    // the API boundary so reservation DTOs receive actual numbers.
    return {
      ...inventory,
      eventId: Number(inventory.eventId),
      sections: inventory.sections.map(section => ({
        ...section,
        id: Number(section.id),
        seats: section.seats?.map(seat => ({
          ...seat,
          id: Number(seat.id),
        })),
      })),
    };
  },

  canPurchaseTickets: async (id: number): Promise<{ canPurchase: boolean; reason?: string }> => {
    const response = await api.get<{ success: boolean; data: { canPurchase: boolean; reason?: string } }>(`/events/${id}/can-purchase`);
    return response.data.data;
  },
};

export interface InventorySection {
  id: number;
  name: string;
  type: 'ASSIGNED' | 'GENERAL';
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

export interface EventInventory {
  eventId: number;
  sections: InventorySection[];
}

interface EventInventoryApiResponse {
  eventId: string;
  sections: Array<Omit<InventorySection, 'id' | 'seats'> & {
    id: string;
    seats?: Array<Omit<NonNullable<InventorySection['seats']>[number], 'id'> & {
      id: string;
    }>;
  }>;
}
