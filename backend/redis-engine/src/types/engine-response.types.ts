export interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface ErrorResponse {
  ok: false;
  message: string;
}

export type EngineResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
