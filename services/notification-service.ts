/**
 * Notification Service — orchestrates the full notification-to-expense pipeline.
 *
 * On app startup:
 * 1. Checks if notification listener permission is granted.
 * 2. If not granted, prompts the user via Alert to open system settings.
 * 3. Registers a headless task handler that processes incoming notifications.
 * 4. Matches notifications against user/built-in patterns.
 * 5. Auto-logs matched expenses to the local database.
 * 6. If the listener is unavailable or crashes, sends a local notification warning.
 */

import { Alert, Platform } from "react-native"
import * as Notifications from "expo-notifications"
import {
  registerNotificationHandler,
  hasNotificationPermission,
  requestNotificationPermission,
  isListenerAvailable,
  type RawNotificationEvent,
} from "./notification-listener"
import { matchNotification } from "./notification-matcher"
import {
  addLocalTransaction,
  getLocalNotificationPatterns,
} from "./database"
import { isEncryptionReady } from "./encryption"

// Track whether we've already initialised this session
let initialised = false

/**
 * Configure expo-notifications so we can fire local warnings.
 */
function setupLocalNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowInForeground: true,
    }),
  })
}

/**
 * Send a local notification warning the user that notification recording is broken.
 */
async function sendWarningNotification(reason: string) {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync()
      if (newStatus !== "granted") return
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "BetterExpenses: Notification Logging Issue",
        body: reason,
        data: { type: "notification_warning" },
      },
      trigger: null, // send immediately
    })
  } catch {
    // Can't even send the warning — nothing more we can do
  }
}

/**
 * Handle a single incoming notification from the Android listener service.
 */
async function handleIncomingNotification(
  event: RawNotificationEvent,
  userId: string,
) {
  try {
    if (!isEncryptionReady()) return

    const patterns = await getLocalNotificationPatterns(userId)
    const result = matchNotification(event.text, patterns)

    if (result.matched && result.amount) {
      await addLocalTransaction({
        userId,
        amount: result.amount,
        type: "expense",
        category: "other",
        description: `Auto: ${result.brokerOrBank ?? event.app}`,
        merchant: result.brokerOrBank ?? event.app,
        date: new Date(event.time).toISOString().split("T")[0],
        source: "auto",
        rawNotification: result.rawText,
      })
    }
  } catch {
    await sendWarningNotification(
      "Failed to record an expense from a notification. Please open the app to check.",
    )
  }
}

/**
 * Initialise the notification pipeline. Call once from the root layout.
 */
export async function initNotificationService(userId: string | undefined) {
  if (Platform.OS !== "android") return
  if (initialised) return
  initialised = true

  setupLocalNotifications()

  // 0. Check if the native module is available at all
  if (!isListenerAvailable()) {
    await sendWarningNotification(
      "Notification listener module is not available. Please use a development build (expo run:android) instead of Expo Go.",
    )
    return
  }

  // 1. Check permission
  const granted = await hasNotificationPermission()

  if (!granted) {
    // 2. Prompt the user
    Alert.alert(
      "Enable Notification Access",
      "BetterExpenses needs notification access to automatically log expenses from banking and UPI apps.\n\n" +
        "Tap 'Open Settings' and enable BetterExpenses in the notification access list.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Open Settings",
          onPress: async () => {
            await requestNotificationPermission()
            // Re-check after the user returns
            const nowGranted = await hasNotificationPermission()
            if (!nowGranted) {
              await sendWarningNotification(
                "Notification access not granted. Auto-logging is disabled. Enable it in Settings → Notification Access.",
              )
            }
          },
        },
      ],
    )
  }

  // 3. Register the handler (works even before permission — will start
  //    receiving events as soon as permission is granted)
  if (userId) {
    registerNotificationHandler((event) => {
      handleIncomingNotification(event, userId)
    })
  }
}

/**
 * Reset initialisation flag (e.g. on sign-out) so it re-runs on next sign-in.
 */
export function resetNotificationService() {
  initialised = false
}
