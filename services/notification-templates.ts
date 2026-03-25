/**
 * Pre-built notification regex templates for popular Indian brokers, banks, and UPI apps.
 * Users can select these or create custom patterns.
 */

export interface NotificationTemplate {
  id: string
  name: string
  brokerOrBank: string
  regexPattern: string
  exampleNotification: string
  extractionFields: string[]
  category: "broker" | "bank" | "upi"
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // --- Brokers ---
  {
    id: "kite_zerodha",
    name: "Zerodha Kite",
    brokerOrBank: "Kite",
    regexPattern:
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+(?:to|transferred to|credited to)\\s+.*(?:Kite|Zerodha)",
    exampleNotification:
      "Rs. 5,000.00 transferred to your Kite account via UPI",
    extractionFields: ["amount"],
    category: "broker",
  },
  {
    id: "groww",
    name: "Groww",
    brokerOrBank: "Groww",
    regexPattern:
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*(?:Groww|GROWW)",
    exampleNotification:
      "Rs. 2,000 added to your Groww account successfully",
    extractionFields: ["amount"],
    category: "broker",
  },
  {
    id: "upstox",
    name: "Upstox",
    brokerOrBank: "Upstox",
    regexPattern:
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*(?:Upstox|UPSTOX|RKSV)",
    exampleNotification:
      "INR 10,000.00 deposited to your Upstox trading account",
    extractionFields: ["amount"],
    category: "broker",
  },
  {
    id: "angelone",
    name: "Angel One",
    brokerOrBank: "Angel One",
    regexPattern:
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*(?:Angel|AngelOne|Angel One)",
    exampleNotification:
      "Rs 3,000 funds added to your Angel One account",
    extractionFields: ["amount"],
    category: "broker",
  },
  {
    id: "coin_zerodha",
    name: "Zerodha Coin (SIP)",
    brokerOrBank: "Coin",
    regexPattern:
      "(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*(?:Coin|SIP|mutual fund).*(?:Zerodha)?",
    exampleNotification:
      "SIP of Rs. 1,000 processed via Coin for Axis Bluechip Fund",
    extractionFields: ["amount"],
    category: "broker",
  },

  // --- Banks ---
  {
    id: "sbi",
    name: "SBI",
    brokerOrBank: "SBI",
    regexPattern:
      "(?:debited|credited).*(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:SBI|State Bank)",
    exampleNotification:
      "Your A/c XX1234 debited Rs.500.00 on 25Mar. SBI UPI Ref: 123456",
    extractionFields: ["amount"],
    category: "bank",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    brokerOrBank: "HDFC",
    regexPattern:
      "(?:debited|credited).*(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:HDFC|hdfc)",
    exampleNotification:
      "Rs 1,200.00 debited from HDFC Bank A/c XX5678 via UPI",
    extractionFields: ["amount"],
    category: "bank",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    brokerOrBank: "ICICI",
    regexPattern:
      "(?:debited|credited).*(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:ICICI|icici)",
    exampleNotification:
      "ICICI Bank Acct XX9012 debited for Rs.750.00 on 25-Mar",
    extractionFields: ["amount"],
    category: "bank",
  },

  // --- UPI ---
  {
    id: "gpay",
    name: "Google Pay",
    brokerOrBank: "Google Pay",
    regexPattern:
      "(?:sent|received|paid)\\s+(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:Google Pay|GPay)",
    exampleNotification:
      "You sent Rs.200 via Google Pay to Swiggy",
    extractionFields: ["amount"],
    category: "upi",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    brokerOrBank: "PhonePe",
    regexPattern:
      "(?:sent|received|paid)\\s+(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:PhonePe)",
    exampleNotification:
      "Paid Rs.350 to BigBasket via PhonePe UPI",
    extractionFields: ["amount"],
    category: "upi",
  },
  {
    id: "paytm",
    name: "Paytm",
    brokerOrBank: "Paytm",
    regexPattern:
      "(?:sent|received|paid)\\s+(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{2})?).*(?:Paytm)",
    exampleNotification:
      "Rs.150 paid to Amazon via Paytm Wallet",
    extractionFields: ["amount"],
    category: "upi",
  },
]

/**
 * Test a regex pattern against a notification string.
 * Returns extracted amount if matched, or null.
 */
export function testPattern(
  pattern: string,
  notification: string,
): { matched: boolean; amount?: number } {
  try {
    const regex = new RegExp(pattern, "i")
    const match = notification.match(regex)
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ""))
      return { matched: true, amount }
    }
    return { matched: false }
  } catch {
    return { matched: false }
  }
}
