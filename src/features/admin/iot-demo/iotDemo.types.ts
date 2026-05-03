export type IotDemoJson =
  | string
  | number
  | boolean
  | null
  | IotDemoJson[]
  | { [key: string]: IotDemoJson };

export interface SimulationStatusResponse {
  running?: boolean;
  active?: boolean;
  status?: string;
  message?: string;
  [key: string]: IotDemoJson | undefined;
}

export interface IotDemoActionResult {
  ok: boolean;
  title: string;
  data: IotDemoJson;
}

export type ScenarioRequest = {
  deviceUid: string;
  count?: number;
  targetValue?: number;
};

export type ConfigAckScenarioRequest = {
  deviceUid: string;
  configVersion?: number;
  error?: string;
};
