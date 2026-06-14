import api from './api';
import { unwrapData } from './response';

export type SectionType = 'GENERAL' | 'ASSIGNED';

export interface EventSection {
  id: number;
  eventId: number;
  name: string;
  type: SectionType;
  price: number;
  totalCapacity: number;
  allocated: number;
  available: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionData {
  eventId: number;
  name: string;
  type: SectionType;
  price: number;
  totalCapacity: number;
  generateSeats?: boolean;
  rows?: number;
  seatsPerRow?: number;
}

export interface UpdateSectionData {
  name?: string;
  price?: number;
  totalCapacity?: number;
}

export const EventSectionsService = {
  async create(data: CreateSectionData): Promise<EventSection> {
    const response = await api.post('/sections', data);
    return unwrapData<EventSection>(response.data);
  },

  async getByEvent(eventId: number): Promise<EventSection[]> {
    const response = await api.get(`/sections/event/${eventId}`);
    return unwrapData<EventSection[]>(response.data);
  },

  async getById(id: number): Promise<EventSection> {
    const response = await api.get(`/sections/${id}`);
    return unwrapData<EventSection>(response.data);
  },

  async update(id: number, data: UpdateSectionData): Promise<EventSection> {
    const response = await api.patch(`/sections/${id}`, data);
    return unwrapData<EventSection>(response.data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/sections/${id}`);
  },
};
