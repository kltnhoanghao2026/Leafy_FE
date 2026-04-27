export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DiseasePrediction {
  className: string;
  confidenceScore: number;
}

export interface PredictResponse {
  predictions: DiseasePrediction[];
  modelName: string;
  processingTimeMs: number | null;
}

export interface PredictHealthResponse {
  status: string;
}

export interface DiagnoseRequest {
  diagnoseRequestId: string;
  userId: string;
  imageFileName: string;
  imageContentType: string;
  timeStamp: string;
}

export interface DiagnoseResultItem {
  diseaseName: string;
  confidenceScore: number;
}

export interface DiagnoseResult {
  diagnoseResultId: string;
  diagnoseRequestId: string;
  userId: string;
  result: DiagnoseResultItem[];
  timeStamp: string;
}
