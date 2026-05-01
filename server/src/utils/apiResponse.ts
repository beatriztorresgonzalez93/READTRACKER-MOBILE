// Helper para respuestas de error API con formato consistente.
import { Response } from "express";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  error: string;
}

export const sendApiError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) => {
  const payload: ApiErrorPayload = {
    code,
    message,
    error: message
  };
  if (details !== undefined) {
    payload.details = details;
  }
  res.status(status).json(payload);
};
