import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { scheduleReminder } from "@/shared/notifications/schedule-reminder";

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

describe("scheduleReminder", () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalPlatform });
    jest.clearAllMocks();
  });

  it("devuelve null en web", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    const result = await scheduleReminder("Dune", new Date(Date.now() + 60_000));
    expect(result).toBeNull();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it("devuelve null si la fecha ya pasó", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    const result = await scheduleReminder("Dune", new Date(Date.now() - 60_000));
    expect(result).toBeNull();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it("devuelve null si no hay permiso", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    mockRequestPermissions.mockResolvedValue({ status: "denied" });
    const result = await scheduleReminder("Dune", new Date(Date.now() + 60_000));
    expect(result).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("programa la notificación cuando hay permiso", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    mockRequestPermissions.mockResolvedValue({ status: "granted" });
    mockSchedule.mockResolvedValue("notif-1");
    const when = new Date(Date.now() + 60_000);

    const result = await scheduleReminder("Dune", when);

    expect(result).toBe("notif-1");
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Recordatorio de ReadTracker",
          body: "Dune",
        }),
        trigger: {
          type: "date",
          date: when,
        },
      }),
    );
  });
});
