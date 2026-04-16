/**
 * Notification Processor — the pipeline that ties everything together:
 *
 *  1. Receives raw notifications from the Android NotificationListenerService
 *  2. Passes them through the notification matcher (user patterns + built-in templates)
 *  3. If matched, auto-creates a Transaction with source = "auto"
 *  4. If the listener service is not running, sends a local notification warning the user
 *
 * This module is initialized once at app startup (after auth).
 */

import type { NotificationPattern } from "@/types"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { addLocalTransaction, getLocalNotificationPatterns } from "./database"
import { isEncryptionReady } from "./encryption"
import {
    hasNotificationPermission,
    registerNotificationHandler,
    requestNotificationPermission,
    type RawNotificationEvent,
} from "./notification-listener"
import { matchNotification } from "./notification-matcher"

let isInitialized = false
let cachedUserId: string | null = null
let cachedPatterns: NotificationPattern[] = []
let permissionCheckInterval: ReturnType<typeof setInterval> | null = null

// Configure how local notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

/**
 * Initialize the notification processing system.
 * Call once after user signs in and encryption is ready.
 */
export async function initNotificationProcessor(userId: string): Promise<void> {
  if (isInitialized) return
  if (Platform.OS !== "android") return

  cachedUserId = userId

  // Request notification posting permission (for our local alerts)
  await requestLocalNotificationPermission()

  // Load user's custom patterns
  try {
    cachedPatterns = await getLocalNotificationPatterns(userId)
  } catch {
    cachedPatterns = []
  }

  // Register the headless notification handler
  registerNotificationHandler(handleIncomingNotification)

  // Check if we have notification listener access
  const hasAccess = await hasNotificationPermission()
  if (!hasAccess) {
    // Prompt user to enable notification access
    await promptNotificationAccess()
  }

  // Start periodic permission monitoring
  startPermissionMonitoring()

  isInitialized = true
}

/**
 * Tear down the notification processor (on sign out).
 */
export function stopNotificationProcessor(): void {
  isInitialized = false
  cachedUserId = null
  cachedPatterns = []
  if (permissionCheckInterval) {
    clearInterval(permissionCheckInterval)
    permissionCheckInterval = null
  }
}

/**
 * Refresh cached notification patterns (after user adds/edits patterns).
 */
export async function refreshPatterns(userId: string): Promise<void> {
  try {
    cachedPatterns = await getLocalNotificationPatterns(userId)
  } catch {
    cachedPatterns = []
  }
}

// ---------------------------------------------------------------------------
// Core handler — processes each incoming notification
// ---------------------------------------------------------------------------

async function handleIncomingNotification(
  notification: RawNotificationEvent,
): Promise<void> {
  if (!cachedUserId || !isEncryptionReady()) return

  const text = `${notification.title ?? ""} ${notification.text ?? ""}`.trim()
  if (!text) return

  // Run through matcher
  const result = matchNotification(text, cachedPatterns)

  if (result.matched && result.amount && result.amount > 0) {
    try {
      // Determine transaction type from notification context
      const type = inferTransactionType(text)

      await addLocalTransaction({
        userId: cachedUserId,
        amount: result.amount,
        type,
        category: type === "expense" ? "other" : "other",
        description: `Auto: ${result.brokerOrBank ?? notification.app}`,
        merchant: result.brokerOrBank ?? undefined,
        date: new Date(notification.time || Date.now()).toISOString().split("T")[0],
        source: "auto",
        rawNotification: text,
      })
    } catch {
      // Silently fail — don't crash the headless task
    }
  }
}

/**
 * Infer whether a notification describes an expense (debit) or income (credit).
 */
function inferTransactionType(text: string): "expense" | "income" {
  const lower = text.toLowerCase()
  const expenseKeywords = [
    "debited",
    "debit",
    "spent",
    "paid",
    "sent",
    "purchased",
    "payment",
    "withdrawn",
    "charged",
  ]
  const incomeKeywords = [
    "credited",
    "credit",
    "received",
    "deposited",
    "refund",
    "cashback",
    "added",
  ]

  for (const kw of expenseKeywords) {
    if (lower.includes(kw)) return "expense"
  }
  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) return "income"
  }

  // Default to expense (most notifications are spend alerts)
  return "expense"
}

// ---------------------------------------------------------------------------
// Permission management
// ---------------------------------------------------------------------------

async function requestLocalNotificationPermission(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync()
    }
  } catch {
    // Not critical — local alerts just won't show
  }
}

/**
 * Prompt the user to enable notification listener access via a local notification
 * and by opening the system settings page.
 */
async function promptNotificationAccess(): Promise<void> {
  // Send a local notification explaining what's needed
  await sendLocalNotification(
    "Enable Notification Access",
    "BetterExpenses needs notification access to auto-log your transactions. " +
      "Tap here, then go to Settings → Notification access and enable BetterExpenses.",
  )

  // Also try to open the settings page directly
  try {
    await requestNotificationPermission()
  } catch {
    // Some devices may not support direct settings launch
  }
}

/**
 * Periodically check if the notification listener is still active.
 * If it loses permission, warn the user.
 */
function startPermissionMonitoring(): void {
  if (permissionCheckInterval) return

  // Check every 5 minutes
  permissionCheckInterval = setInterval(
    async () => {
      if (!isInitialized) return

      const hasAccess = await hasNotificationPermission()
      if (!hasAccess) {
        await sendLocalNotification(
          "Notification Recording Stopped",
          "BetterExpenses cannot record notifications. " +
            "Please re-enable notification access in Settings → Notification access.",
        )
      }
    },
    5 * 60 * 1000,
  )
}

/**
 * Send a local notification to the user.
 */
async function sendLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // Fire immediately
    })
  } catch {
    // Can't send — permission may not be granted
  }
}
