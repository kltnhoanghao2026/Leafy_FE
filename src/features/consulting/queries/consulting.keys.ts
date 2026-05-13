export const consultingKeys = {
  all: () => ['consulting'] as const,
  farmPlots: (farmerProfileId: string) =>
    [...consultingKeys.all(), 'farm-plots', farmerProfileId] as const,
  farmPlot: (farmPlotId: string) =>
    [...consultingKeys.all(), 'farm-plot', farmPlotId] as const,
  farmZones: (farmPlotId: string) =>
    [...consultingKeys.all(), 'farm-zones', farmPlotId] as const,
  plants: (farmerProfileId: string) =>
    [...consultingKeys.all(), 'plants', farmerProfileId] as const,
  plant: (plantId: string) =>
    [...consultingKeys.all(), 'plant', plantId] as const,
  plantEvents: (plantId: string) =>
    [...consultingKeys.all(), 'plant-events', plantId] as const,
  plans: (farmerProfileId: string) =>
    [...consultingKeys.all(), 'plans', farmerProfileId] as const,
};
