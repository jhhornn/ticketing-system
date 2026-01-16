// src/frontend/src/services/EventSectionsService.ts
import api from './api';

export interface ApiStandardResponse<T> {
  data: T;
}

export interface ApiStandardArrayResponse<T> {
  data: T[];
}

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
    const response = await api.post<ApiStandardResponse<EventSection>>('/sections', data);
    return response.data.data;
  },

  async getByEvent(eventId: number): Promise<EventSection[]> {
    const response = await api.get<ApiStandardArrayResponse<EventSection>>(
      `/sections/event/${eventId}`,
    );
    // Backend controller returns { data: [...] }
    // TransformInterceptor wraps it: { statusCode, success, message, data: { data: [...] }, timestamp }
    // Axios gives us response.data = { statusCode, ..., data: { data: [...] } }
    // So response.data.data = { data: [...] }
    // We need to go one level deeper: response.data.data.data
    const wrappedData = response.data.data as any;
    return Array.isArray(wrappedData) ? wrappedData : wrappedData.data;
  },

  async getById(id: number): Promise<EventSection> {
    const response = await api.get<ApiStandardResponse<EventSection>>(`/sections/${id}`);
    return response.data.data;
  },

  async update(id: number, data: UpdateSectionData): Promise<EventSection> {
    const response = await api.patch<ApiStandardResponse<EventSection>>(`/sections/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/sections/${id}`);
  },
};
