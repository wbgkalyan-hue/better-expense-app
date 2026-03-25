import type { NotificationPattern } from "@/types"
import {
  NOTIFICATION_TEMPLATES,
  testPattern,
} from "./notification-templates"

export interface ParsedNotification {
  matched: boolean
  amount?: number
  brokerOrBank?: string
  patternId?: string
  rawText: string
}

/**
 * Match an incoming notification against saved user patterns and built-in templates.
 */
export function matchNotification(
  notificationText: string,
  userPatterns: NotificationPattern[],
): ParsedNotification {
  // First try user's custom patterns
  for (const pattern of userPatterns) {
    const result = testPattern(pattern.regexPattern, notificationText)
    if (result.matched) {
      return {
        matched: true,
        amount: result.amount,
        brokerOrBank: pattern.brokerOrBank,
        patternId: pattern.id,
        rawText: notificationText,
      }
    }
  }

  // Then try built-in templates
  for (const template of NOTIFICATION_TEMPLATES) {
    const result = testPattern(template.regexPattern, notificationText)
    if (result.matched) {
      return {
        matched: true,
        amount: result.amount,
        brokerOrBank: template.brokerOrBank,
        patternId: template.id,
        rawText: notificationText,
      }
    }
  }

  return { matched: false, rawText: notificationText }
}

/**
 * Extract a regex pattern from an example notification provided by the user.
 * Replaces the amount with a capture group and escapes special chars.
 */
export function generatePatternFromExample(
  example: string,
  brokerName: string,
): string {
  // Find amount patterns like Rs.1000, ₹1,000.00, INR 500
  const amountRegex = /(?:Rs\.?\s*|INR\s*|₹\s*)[\d,]+(?:\.\d{2})?/i
  const match = example.match(amountRegex)

  if (match) {
    const escaped = escapeRegex(example)
    const escapedAmount = escapeRegex(match[0])
    return escaped.replace(
      escapedAmount,
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)",
    )
  }

  // Fallback: look for the broker name and create a generic pattern
  return `(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*(?:${escapeRegex(brokerName)})`
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
