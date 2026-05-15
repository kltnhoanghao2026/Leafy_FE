import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/stats.api';
import { plantManagementKeys } from '../../shared/queries/keys';

export const useAgricultureStats = () =>
  useQuery({
    queryKey: plantManagementKeys.agricultureStats(),
    queryFn: statsApi.getAgricultureStats,
  });
