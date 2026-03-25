/**
 * Android Notification Listener Service integration.
 *
 * This module provides the bridge between React Native and the Android
 * NotificationListenerService. On Android, the user must grant
 * notification access in Settings → Apps & notifications → Special access
 * → Notification access.
 *
 * The actual native listener uses `react-native-notification-listener`
 * which registers a headless JS task for incoming notifications.
 */

import { AppRegistry, Platform } from "react-native"

// This will be called by the native NotificationListenerService
// when a notification is received. We register it as a headless task.
let onNotificationCallback:
  | ((notification: RawNotificationEvent) => void)
  | null = null

export interface RawNotificationEvent {
  app: string
  title: string
  text: string
  time: number
}

/**
 * Register a callback to handle incoming notifications.
 * Should be called once at app startup.
 */
export function registerNotificationHandler(
  callback: (notification: RawNotificationEvent) => void,
) {
  onNotificationCallback = callback

  if (Platform.OS === "android") {
    // Register the headless task that react-native-notification-listener will call
    const taskHandler = async (data: RawNotificationEvent) => {
      if (onNotificationCallback) {
        onNotificationCallback(data)
      }
    }

    try {
      AppRegistry.registerHeadlessTask(
        "RNNotificationListenerTask",
        () => taskHandler,
      )
    } catch {
      // Task may already be registered in a previous call
    }
  }
}

/**
 * Check if notification listener permission is granted.
 * On Android, this requires the BIND_NOTIFICATION_LISTENER_SERVICE permission
 * and the user must enable it in system Settings.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false

  try {
    const RNNotificationListener =
      require("react-native-notification-listener").default
    const status = await RNNotificationListener.getPermissionStatus()
    return status === "authorized"
  } catch {
    return false
  }
}

/**
 * Open the system settings page where the user can grant notification access.
 */
export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== "android") return

  try {
    const RNNotificationListener =
      require("react-native-notification-listener").default
    await RNNotificationListener.requestPermission()
  } catch {
    // Fallback: user needs to enable manually in settings
  }
}
