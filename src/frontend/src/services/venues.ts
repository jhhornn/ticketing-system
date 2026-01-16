import api from './api';

export type SectionType = 'ASSIGNED' | 'GENERAL';

export interface VenueSection {
    id: number;
    name: string;
    type: SectionType;
    totalCapacity: number;
    rows?: number;
    seatsPerRow?: number;
}

export interface CreateVenueSectionData {
    name: string;
    type: SectionType;
    totalCapacity: number;
    rows?: number;
    seatsPerRow?: number;
}

export interface Venue {
    id: number;
    name: string;
    address: string | null;
    capacity: number;
    city: string | null;
    state: string | null;
    country: string | null;
    sections?: VenueSection[];
}

export interface CreateVenueData {
    name: string;
    address?: string;
    capacity: number;
    city?: string;
    state?: string;
    country?: string;
    sections?: CreateVenueSectionData[];
}

export const VenuesService = {
    getAll: async (): Promise<Venue[]> => {
        const response = await api.get('/venues');
        return response.data.data; // Assuming ApiStandardArrayResponse structure { data: [...], ... }
    },

    create: async (data: CreateVenueData): Promise<Venue> => {
        const response = await api.post('/venues', data);
        return response.data.data;
    },

    getById: async (id: number): Promise<Venue> => {
        const response = await api.get(`/venues/${id}`);
        return response.data.data;
    },
};
