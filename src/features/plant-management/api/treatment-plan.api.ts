import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { PageResponse, TreatmentPlanResponse } from "../types";
import { unwrapApiData, unwrapPageContent } from "./apiUtils";

export const treatmentPlanApi = {
  getTreatmentPlansByPlant: async (plantId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<TreatmentPlanResponse>>
      | PageResponse<TreatmentPlanResponse>
    >(API_ENDPOINTS.TREATMENT_PLANS.BY_PLANT(plantId), {
      params: { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },
};
