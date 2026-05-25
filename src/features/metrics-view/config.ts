export const FARM_PLOT_STORAGE_KEY = "leafy.iot.farmPlotId";

export const getConfiguredFarmPlotId = (): string => {
  const storedValue = window.localStorage.getItem(FARM_PLOT_STORAGE_KEY);
  return storedValue || import.meta.env.VITE_IOT_FARM_PLOT_ID || "";
};

export const saveConfiguredFarmPlotId = (farmPlotId: string): void => {
  const normalized = farmPlotId.trim();
  if (normalized) {
    window.localStorage.setItem(FARM_PLOT_STORAGE_KEY, normalized);
  } else {
    window.localStorage.removeItem(FARM_PLOT_STORAGE_KEY);
  }
};
