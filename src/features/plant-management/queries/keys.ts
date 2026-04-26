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
  treatmentPlans: (plantId: string) =>
    [...plantManagementKeys.all(), "treatment-plans", plantId] as const,
};
