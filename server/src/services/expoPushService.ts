import { logError, logInfo } from "../logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/** Envía notificaciones push vía la API de Expo (tokens ExponentPushToken[...]). */
export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<{
  sent: number;
  failed: number;
  invalidTokens: string[];
}> {
  if (messages.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const text = await response.text();
        logError("expoPush.httpError", new Error(`${response.status}: ${text}`));
        failed += chunk.length;
        continue;
      }

      const payload = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = payload.data ?? [];

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          sent += 1;
          return;
        }
        failed += 1;
        const token = chunk[index]?.to;
        const errorCode = ticket.details?.error ?? ticket.message;
        if (token && (errorCode === "DeviceNotRegistered" || errorCode === "InvalidCredentials")) {
          invalidTokens.push(token);
        }
      });
    } catch (error) {
      logError("expoPush.fetchFailed", error);
      failed += chunk.length;
    }
  }

  logInfo("expoPush.batchComplete", { sent, failed, invalidTokenCount: invalidTokens.length });
  return { sent, failed, invalidTokens };
}
