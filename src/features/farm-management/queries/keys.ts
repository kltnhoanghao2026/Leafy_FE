export const farmManagementKeys = {
  all: () => ["farm-management"] as const,
  plotsRoot: () => [...farmManagementKeys.all(), "plots"] as const,
  plots: (ownerProfileId: string) =>
    [...farmManagementKeys.plotsRoot(), ownerProfileId] as const,
  zonesRoot: () => [...farmManagementKeys.all(), "zones"] as const,
  zones: (plotId: string) => [...farmManagementKeys.zonesRoot(), plotId] as const,
};
