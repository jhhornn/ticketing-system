import api from './api';

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;

export type DiscountType = typeof DiscountType[keyof typeof DiscountType];

export interface Discount {
  id: string;
  code: string;
  amount: number;
  type: DiscountType;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  minOrderAmount?: number;
  eventId?: string;
  createdAt: string;
}

export interface CreateDiscountData {
  code: string;
  amount: number;
  type: DiscountType;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  minOrderAmount?: number;
  eventId?: number;
}

export interface UpdateDiscountData {
  code?: string;
  amount?: number;
  type?: DiscountType;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  minOrderAmount?: number;
  eventId?: number;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discount?: Discount;
  reason?: string;
}

export const DiscountsService = {
  getAll: async () => {
    const response = await api.get<any>('/discounts');
    return response.data.data || response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<any>(`/discounts/${id}`);
    return response.data.data || response.data;
  },

  getByEventId: async (eventId: number) => {
    const response = await api.get<any>(`/discounts/event/${eventId}`);
    // Backend returns wrapped response: { data: Discount[] }
    return response.data.data || response.data;
  },

  validate: async (code: string, eventId?: number) => {
    const response = await api.get<any>(
      `/discounts/validate/${code}`,
      { params: eventId ? { eventId } : {} }
    );
    return response.data.data || response.data;
  },

  create: async (data: CreateDiscountData) => {
    const response = await api.post<any>('/discounts', data);
    return response.data.data || response.data;
  },

  update: async (id: number, data: UpdateDiscountData) => {
    const response = await api.patch<any>(`/discounts/${id}`, data);
    return response.data.data || response.data;
  },

  activate: async (id: number) => {
    const response = await api.patch<any>(`/discounts/${id}/activate`);
    return response.data.data || response.data;
  },

  deactivate: async (id: number) => {
    const response = await api.patch<any>(`/discounts/${id}/deactivate`);
    return response.data.data || response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/discounts/${id}`);
  },
};
