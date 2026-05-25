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
  severityLevel?: string;
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
  fileId?: string;
  plantId?: string;
  timeStamp: string;
}

export interface DiagnoseResultItem {
  diseaseName: string;
  confidenceScore: number;
  severityLevel?: string;
}

export interface DiagnoseResult {
  diagnoseResultId: string;
  diagnoseRequestId: string;
  userId: string;
  result: DiagnoseResultItem[];
  timeStamp: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LeafDetection {
  className: string;
  confidenceScore: number;
  boundingBox: BoundingBox;
}

export interface LeafDetectionResponse {
  detections: LeafDetection[];
  modelName: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number | null;
  detectionCount: number;
}
