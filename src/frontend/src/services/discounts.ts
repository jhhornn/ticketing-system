import api from './api';

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

export type DiscountType = typeof DiscountType[keyof typeof DiscountType];

export interface Discount {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  tenantId: string;
}

export interface CreateDiscountData {
  code: string;
  type: DiscountType;
  value: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateDiscountData {
  code?: string;
  type?: DiscountType;
  value?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export const DiscountsService = {
  getAll: async (tenantId?: string) => {
    const response = await api.get<Discount[]>('/discounts', { 
      params: { tenantId } 
    });
    return response.data;
  },

  getById: async (id: number, tenantId?: string) => {
    const response = await api.get<Discount>(`/discounts/${id}`, { 
      params: { tenantId } 
    });
    return response.data;
  },

  create: async (data: CreateDiscountData, tenantId?: string) => {
    const response = await api.post<Discount>('/discounts', data, { 
      params: { tenantId } 
    });
    return response.data;
  },

  update: async (id: number, data: UpdateDiscountData, tenantId?: string) => {
    const response = await api.patch<Discount>(`/discounts/${id}`, data, { 
      params: { tenantId } 
    });
    return response.data;
  },

  delete: async (id: number, tenantId?: string) => {
    await api.delete(`/discounts/${id}`, { params: { tenantId } });
  }
};
