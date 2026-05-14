import apiClient from '../../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../../lib/routes';
import type { ApiEnvelope } from '../../../../shared/types/api';
import type { AgricultureStatsResponse } from '../../shared/types';
import { unwrapApiData } from '../../shared/api/apiUtils';

export const statsApi = {
  getAgricultureStats: async (): Promise<AgricultureStatsResponse> => {
    const response = await apiClient.get<
      ApiEnvelope<AgricultureStatsResponse> | AgricultureStatsResponse
    >(API_ENDPOINTS.STATS.AGRICULTURE);
    return unwrapApiData(response.data);
  },
};
