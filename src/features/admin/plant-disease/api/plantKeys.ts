export const plantKeys = {
  all: () => ["plants"] as const,
  list: (params: object) => ["plants", "list", params] as const,
  detail: (id: string) => ["plants", "detail", id] as const,
  byFarmPlot: (farmPlotId: string) =>
    ["plants", "byFarmPlot", farmPlotId] as const,
};
