import { ApiError, SUBSCRIPTION_REQUIRED_CODE } from "@/shared/api/api-error";

export const API_NETWORK_ERROR_CODE = "NETWORK_ERROR";
export const API_TIMEOUT_ERROR_CODE = "TIMEOUT";

const RENDER_WAKE_STATUSES = new Set([502, 503, 504]);

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

export function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("load failed")
  );
}

function preferServerMessage(message: string | undefined): string | null {
  const trimmed = message?.trim();
  if (!trimmed) return null;
  if (/^request failed with status \d+/i.test(trimmed)) return null;
  if (trimmed.length > 280) return null;
  return trimmed;
}

export function formatApiErrorFromHttp(
  status: number,
  code: string,
  serverMessage?: string,
): string {
  if (status === 402 && code === SUBSCRIPTION_REQUIRED_CODE) {
    return (
      preferServerMessage(serverMessage) ??
      "Tu periodo de prueba ha terminado. Activa Scriptorium Pro para continuar."
    );
  }

  if (status === 0 && code === API_TIMEOUT_ERROR_CODE) {
    return "El servidor tarda en responder. En Render puede tardar hasta un minuto en despertar; espera un momento e intentalo otra vez.";
  }

  if (status === 0 && code === API_NETWORK_ERROR_CODE) {
    return "Revisa tu conexion a internet e intentalo de nuevo.";
  }

  if (RENDER_WAKE_STATUSES.has(status)) {
    return "El servidor esta despertando. Espera unos segundos e intentalo otra vez.";
  }

  if (status >= 500) {
    return (
      preferServerMessage(serverMessage) ??
      "Algo fallo en el servidor. Intentalo en unos minutos."
    );
  }

  if (status === 401) {
    return preferServerMessage(serverMessage) ?? "Tu sesion ha expirado. Vuelve a iniciar sesion.";
  }

  if (status === 429) {
    return "Demasiadas peticiones. Espera un momento e intentalo de nuevo.";
  }

  return preferServerMessage(serverMessage) ?? "No se pudo completar la operacion. Intentalo de nuevo.";
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (isAbortError(error)) {
    return formatApiErrorFromHttp(0, API_TIMEOUT_ERROR_CODE);
  }

  if (isNetworkFetchError(error)) {
    return formatApiErrorFromHttp(0, API_NETWORK_ERROR_CODE);
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
}
