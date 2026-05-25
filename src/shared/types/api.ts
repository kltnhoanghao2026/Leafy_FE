export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
  errors?: Record<string, string>;
}
