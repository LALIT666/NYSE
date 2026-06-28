export interface EngineSuccess<T = unknown> {
  ok: true;
  data: T;
}

export interface EngineError {
  ok: false;
  message: string;
}

export type EngineResponse<T = unknown> = EngineSuccess<T> | EngineError;
