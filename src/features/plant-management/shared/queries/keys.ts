export const plantManagementKeys = {
  all: () => ["plant-management"] as const,
  plantsRoot: () => [...plantManagementKeys.all(), "plants"] as const,
  plants: () => [...plantManagementKeys.plantsRoot(), "list"] as const,
  plantsByFarmPlot: (farmPlotId: string) =>
    [...plantManagementKeys.plantsRoot(), "farm-plot", farmPlotId] as const,
  plantsBySpecies: (speciesId: string) =>
    [...plantManagementKeys.plantsRoot(), "species", speciesId] as const,
  plant: (plantId: string) =>
    [...plantManagementKeys.plantsRoot(), "detail", plantId] as const,
  speciesRoot: () => [...plantManagementKeys.all(), "species"] as const,
  species: () => [...plantManagementKeys.speciesRoot(), "list"] as const,
  speciesDetail: (speciesId: string) =>
    [...plantManagementKeys.speciesRoot(), "detail", speciesId] as const,
  plantEvents: (plantId: string) =>
    [...plantManagementKeys.all(), "plant-events", plantId] as const,
  plannedPlantEvents: (plantId: string) =>
    [...plantManagementKeys.all(), "plant-events", plantId, "planned"] as const,
  plansRoot: () =>
    [...plantManagementKeys.all(), "treatment-plans"] as const,
  myPlans: (params?: object) =>
    [...plantManagementKeys.plansRoot(), "me", params ?? {}] as const,
  publicPlans: (params?: object) =>
    [...plantManagementKeys.plansRoot(), "public", params ?? {}] as const,
  plan: (planId: string) =>
    [...plantManagementKeys.plansRoot(), "detail", planId] as const,
  plans: (plantId: string) =>
    [...plantManagementKeys.plansRoot(), "plant", plantId] as const,
  plansByFarmPlot: (farmPlotId: string) =>
    [...plantManagementKeys.plansRoot(), "farm-plot", farmPlotId] as const,
  plansByFarmZone: (farmZoneId: string) =>
    [...plantManagementKeys.plansRoot(), "farm-zone", farmZoneId] as const,
  planApplies: (planId: string) =>
    [...plantManagementKeys.plansRoot(), "applies", planId] as const,
  planApply: (applyId: string) =>
    [...plantManagementKeys.plansRoot(), "apply-detail", applyId] as const,
  myApplies: (params?: object) =>
    [...plantManagementKeys.plansRoot(), "my-applies", params ?? {}] as const,
  plantEvent: (eventId: string) =>
    [...plantManagementKeys.all(), "plant-events", "detail", eventId] as const,
  plantEventsByPlanApply: (planApplyId: string) =>
    [...plantManagementKeys.all(), "plant-events", "plan-apply", planApplyId] as const,
  plantEventsCalendar: (params: object) =>
    [...plantManagementKeys.all(), "plant-events", "calendar", params] as const,
  agricultureStats: () =>
    [...plantManagementKeys.all(), "agriculture-stats"] as const,
};
