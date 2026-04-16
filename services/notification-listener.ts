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

import { AppRegistry, Linking, Platform } from "react-native"

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
 * Attempt to load the native module. Returns null if it's unavailable
 * (e.g. running in Expo Go instead of a dev build).
 */
function getNativeModule(): any {
  try {
    return require("react-native-notification-listener").default
  } catch {
    console.warn(
      "[NotificationListener] react-native-notification-listener native module is not available. " +
        "Make sure you are running a development build (expo run:android), not Expo Go.",
    )
    return null
  }
}

/** Whether the native module is available at all (false in Expo Go). */
export function isListenerAvailable(): boolean {
  return Platform.OS === "android" && getNativeModule() != null
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

  const nativeModule = getNativeModule()
  if (!nativeModule) return false

  try {
    const status = await nativeModule.getPermissionStatus()
    return status === "authorized"
  } catch {
    return false
  }
}

/**
 * Open the system settings page where the user can grant notification access.
 * Tries the native module first, then falls back to opening Android settings directly.
 */
export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== "android") return

  const nativeModule = getNativeModule()
  if (nativeModule) {
    try {
      await nativeModule.requestPermission()
      return
    } catch {
      // Fall through to manual settings open
    }
  }

  // Fallback: open the notification listener settings screen directly
  try {
    await Linking.openSettings()
  } catch {
    // Last resort — user needs to navigate manually
  }
}
