// src/frontend/src/services/advertisements.ts
import { API_URL } from './config';

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

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AdvertisementsService = {
  getAll: async (placement?: AdPlacement): Promise<Advertisement[]> => {
    const url = placement
      ? `${API_URL}/advertisements?placement=${placement}`
      : `${API_URL}/advertisements`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch advertisements');
    return response.json();
  },

  getActive: async (placement?: AdPlacement): Promise<Advertisement[]> => {
    const url = placement
      ? `${API_URL}/advertisements/active?placement=${placement}`
      : `${API_URL}/advertisements/active`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch active advertisements');
    return response.json();
  },

  getById: async (id: string): Promise<Advertisement> => {
    const response = await fetch(`${API_URL}/advertisements/${id}`);
    if (!response.ok) throw new Error('Failed to fetch advertisement');
    return response.json();
  },

  create: async (data: CreateAdvertisementData): Promise<Advertisement> => {
    const response = await fetch(`${API_URL}/advertisements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create advertisement');
    return response.json();
  },

  update: async (
    id: string,
    data: Partial<CreateAdvertisementData>
  ): Promise<Advertisement> => {
    const response = await fetch(`${API_URL}/advertisements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update advertisement');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/advertisements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete advertisement');
  },

  trackImpression: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/advertisements/${id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'impression' }),
    }).catch(() => {
      // Silent fail for tracking
    });
  },

  trackClick: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/advertisements/${id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click' }),
    }).catch(() => {
      // Silent fail for tracking
    });
  },
};
