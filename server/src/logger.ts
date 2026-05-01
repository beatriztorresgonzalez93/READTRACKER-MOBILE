// Logger estructurado para observabilidad en plataformas como Render.
type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function writeLog(level: LogLevel, scope: string, context?: LogContext): void {
  const payload = {
    timestamp: new Date().toISOString(),
    app: "readtracker-api",
    level,
    scope,
    ...context
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function logInfo(scope: string, context?: LogContext): void {
  writeLog("info", scope, context);
}

export function logWarn(scope: string, context?: LogContext): void {
  writeLog("warn", scope, context);
}

export function logError(scope: string, err: unknown, context?: LogContext): void {
  const errorPayload =
    err instanceof Error
      ? { errorName: err.name, errorMessage: err.message, errorStack: err.stack }
      : { error: String(err) };

  writeLog("error", scope, {
    ...context,
    ...errorPayload
  });
}
