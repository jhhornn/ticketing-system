import api from './api';

export interface OrgStats {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  activeReservations: number;
}

export interface UserStats {
  totalEvents: number;
  activeEvents: number;
  totalBookings: number;
  totalRevenue: number;
  userId: string;
}

export const StatsService = {
  getOrgStats: async (tenantId?: string) => {
    const response = await api.get<OrgStats>('/stats/org', { 
      params: { tenantId } 
    });
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<{ success: boolean; data: UserStats }>('/stats/user');
    return response.data.data;
  },
};
