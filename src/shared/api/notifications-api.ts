import { apiRequest } from "@/shared/api/client";

export type NotificationPreferences = {
  pushEngagementEnabled: boolean;
};

export async function registerPushToken(
  token: string,
  payload: { expoPushToken: string; platform: string },
): Promise<void> {
  await apiRequest("/notifications/register", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function unregisterPushToken(
  token: string,
  expoPushToken: string,
): Promise<void> {
  await apiRequest("/notifications/unregister", {
    method: "POST",
    token,
    body: { expoPushToken },
  });
}

export async function touchNotificationActivity(token: string): Promise<void> {
  await apiRequest("/notifications/activity", {
    method: "POST",
    token,
  });
}

export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  const response = await apiRequest<{ data: NotificationPreferences }>("/notifications/preferences", {
    token,
  });
  return response.data;
}

export async function updateNotificationPreferences(
  token: string,
  pushEngagementEnabled: boolean,
): Promise<NotificationPreferences> {
  const response = await apiRequest<{ data: NotificationPreferences }>("/notifications/preferences", {
    method: "PATCH",
    token,
    body: { pushEngagementEnabled },
  });
  return response.data;
}
