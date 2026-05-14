import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '../../profiles/api/profilesApi';
import { consultingApi } from '../api/consulting.api';
import { consultingKeys } from './consulting.keys';
import { plantEventApi } from '../../plant-management/calendarview/api/plant-event.api';
import type {
  PlantEventCreateRequest,
  PlantEventsCalendarParams,
  PlanCreateRequest,
} from '../../plant-management/shared/types';

export const useConsultingFarmers = () =>
  useQuery({
    queryKey: [...consultingKeys.all(), 'farmers'],
    queryFn: async () => {
      const response = await profilesApi.getAcceptedConsultations({ size: 100 });
      const data = response.data;
      if (data && typeof data === 'object' && 'data' in data) {
        const page = (data as { data: { content?: unknown[] } }).data;
        return page.content ?? [];
      }
      return [];
    },
  });

export const useConsultingFarmerSummaryBulk = (farmerProfileIds: string[], enabled = true) =>
  useQuery({
    queryKey: [...consultingKeys.all(), 'summary-bulk', farmerProfileIds],
    queryFn: () => consultingApi.getBulkConsultingSummary(farmerProfileIds),
    enabled: enabled && farmerProfileIds.length > 0,
    staleTime: 60_000,
  });

export const useConsultingFarmPlots = (farmerProfileId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.farmPlots(farmerProfileId),
    queryFn: () => consultingApi.getConsultingFarmPlots(farmerProfileId),
    enabled: enabled && !!farmerProfileId,
  });

export const useConsultingFarmPlot = (farmPlotId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.farmPlot(farmPlotId),
    queryFn: () => consultingApi.getConsultingFarmPlot(farmPlotId),
    enabled: enabled && !!farmPlotId,
  });

export const useConsultingFarmZones = (farmPlotId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.farmZones(farmPlotId),
    queryFn: () => consultingApi.getConsultingFarmZones(farmPlotId),
    enabled: enabled && !!farmPlotId,
  });

export const useConsultingPlants = (farmerProfileId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.plants(farmerProfileId),
    queryFn: () => consultingApi.getConsultingPlants(farmerProfileId),
    enabled: enabled && !!farmerProfileId,
  });

export const useConsultingPlantById = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.plant(plantId),
    queryFn: () => consultingApi.getConsultingPlantById(plantId),
    enabled: enabled && !!plantId,
  });

export const useConsultingPlantEvents = (
  farmerProfileId: string,
  plantId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: consultingKeys.plantEvents(plantId),
    queryFn: () => consultingApi.getConsultingPlantEvents(farmerProfileId, plantId),
    enabled: enabled && !!farmerProfileId && !!plantId,
  });

export const useCreateConsultingPlantEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmerProfileId,
      payload,
    }: {
      farmerProfileId: string;
      payload: PlantEventCreateRequest;
    }) => consultingApi.createConsultingPlantEvent(farmerProfileId, payload),
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({
        queryKey: consultingKeys.plantEvents(event.plantId ?? ''),
      });
    },
    meta: {
      successMessage: 'Đã thêm sự kiện cho cây trồng.',
    },
  });
};

export const useConsultingPlansByFarmer = (farmerProfileId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.plans(farmerProfileId),
    queryFn: () => consultingApi.getConsultingPlans(farmerProfileId),
    enabled: enabled && !!farmerProfileId,
  });

export const useCreateConsultingPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmerProfileId,
      payload,
    }: {
      farmerProfileId: string;
      payload: PlanCreateRequest;
    }) => consultingApi.createConsultingPlan(farmerProfileId, payload),
    onSuccess: async (plan, { farmerProfileId }) => {
      await queryClient.invalidateQueries({
        queryKey: consultingKeys.plans(farmerProfileId),
      });
      if (plan.plantId) {
        await queryClient.invalidateQueries({
          queryKey: consultingKeys.plant(plan.plantId),
        });
      }
    },
    meta: {
      successMessage: 'Đã tạo kế hoạch điều trị.',
    },
  });
};

export const useConsultingFarmerCalendar = (
  params: PlantEventsCalendarParams,
  enabled = true,
) =>
  useQuery({
    queryKey: [...consultingKeys.all(), 'farmer-calendar', params],
    queryFn: () => plantEventApi.getPlantEventsCalendar(params),
    enabled: enabled && Boolean(params.startDate && params.endDate && params.profileId),
    staleTime: 30_000,
  });