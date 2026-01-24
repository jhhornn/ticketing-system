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
  getOrgStats: async () => {
    const response = await api.get<{ data: OrgStats }>('/stats/org');
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<{ success: boolean; data: UserStats }>('/stats/user');
    return response.data.data;
  },
};
