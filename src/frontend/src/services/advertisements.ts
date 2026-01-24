// src/frontend/src/services/advertisements.ts
import api from './api';

export type AdStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED';
export type AdPlacement =
  | 'HOME_BANNER'
  | 'SIDEBAR'
  | 'EVENT_LIST_TOP'
  | 'EVENT_LIST_BOTTOM'
  | 'EVENT_DETAIL_SIDEBAR';

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl: string;
  status: AdStatus;
  placement: AdPlacement[];
  priority: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertisementData {
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl: string;
  status: AdStatus;
  placement: AdPlacement[];
  priority?: number;
  startDate?: string;
  endDate?: string;
}

export const AdvertisementsService = {
  getAll: async (placement?: AdPlacement): Promise<Advertisement[]> => {
    const params = placement ? { placement } : {};
    const response = await api.get('/advertisements', { params });
    return response.data;
  },

  getActive: async (placement?: AdPlacement): Promise<Advertisement[]> => {
    const params = placement ? { placement } : {};
    const response = await api.get('/advertisements/active', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Advertisement> => {
    const response = await api.get(`/advertisements/${id}`);
    return response.data;
  },

  create: async (data: CreateAdvertisementData): Promise<Advertisement> => {
    const response = await api.post('/advertisements', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateAdvertisementData>
  ): Promise<Advertisement> => {
    const response = await api.patch(`/advertisements/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/advertisements/${id}`);
  },

  trackImpression: async (id: string): Promise<void> => {
    try {
      await api.post(`/advertisements/${id}/stats`, { type: 'impression' });
    } catch {
      // Silent fail for tracking
    }
  },

  trackClick: async (id: string): Promise<void> => {
    try {
      await api.post(`/advertisements/${id}/stats`, { type: 'click' });
    } catch {
      // Silent fail for tracking
    }
  },
};
