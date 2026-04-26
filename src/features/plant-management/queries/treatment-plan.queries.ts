import { useQuery } from "@tanstack/react-query";
import { treatmentPlanApi } from "../api/treatment-plan.api";
import { plantManagementKeys } from "./keys";

export const useTreatmentPlansByPlant = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.treatmentPlans(plantId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByPlant(plantId),
    enabled: enabled && !!plantId,
  });
