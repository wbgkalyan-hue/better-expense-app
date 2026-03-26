import { Model } from "@nozbe/watermelondb"
import { field, text, readonly, date, nochange } from "@nozbe/watermelondb/decorators"

export class TransactionModel extends Model {
  static table = "transactions"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("type") type!: string
  @text("category") category!: string
  @text("date") dateStr!: string
  @text("source") source!: string
  @text("encrypted_amount") encryptedAmount!: string
  @text("encrypted_description") encryptedDescription!: string
  @text("encrypted_merchant") encryptedMerchant!: string
  @text("encrypted_raw_notification") encryptedRawNotification!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class BrokerAccountModel extends Model {
  static table = "broker_accounts"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("name") name!: string
  @text("broker") broker!: string
  @text("encrypted_current_value") encryptedCurrentValue!: string
  @text("encrypted_total_invested") encryptedTotalInvested!: string
  @text("encrypted_returns") encryptedReturns!: string
  @text("encrypted_returns_percent") encryptedReturnsPercent!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class InvestmentTransactionModel extends Model {
  static table = "investment_transactions"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("broker_account_id") brokerAccountId!: string
  @text("type") type!: string
  @text("date") dateStr!: string
  @text("source") source!: string
  @text("encrypted_amount") encryptedAmount!: string
  @text("encrypted_note") encryptedNote!: string
  @text("encrypted_raw_notification") encryptedRawNotification!: string
  @readonly @date("created_at") createdAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class GoalModel extends Model {
  static table = "goals"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("title") title!: string
  @text("type") type!: string
  @field("priority") priority!: number
  @text("deadline") deadline!: string
  @field("is_active") isActive!: boolean
  @field("deducts_from_networth") deductsFromNetworth!: boolean
  @text("encrypted_target_amount") encryptedTargetAmount!: string
  @text("encrypted_current_amount") encryptedCurrentAmount!: string
  @text("encrypted_description") encryptedDescription!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class NotificationPatternModel extends Model {
  static table = "notification_patterns"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("name") name!: string
  @text("broker_or_bank") brokerOrBank!: string
  @field("is_template") isTemplate!: boolean
  @text("extraction_fields") extractionFields!: string
  @text("encrypted_regex_pattern") encryptedRegexPattern!: string
  @text("encrypted_example_notification") encryptedExampleNotification!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class BankAccountModel extends Model {
  static table = "bank_accounts"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("name") name!: string
  @text("bank_name") bankName!: string
  @text("type") type!: string
  @text("encrypted_balance") encryptedBalance!: string
  @text("encrypted_interest_rate") encryptedInterestRate!: string
  @text("maturity_date") maturityDate!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class AssetModel extends Model {
  static table = "assets"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("name") name!: string
  @text("type") type!: string
  @text("purchase_date") purchaseDate!: string
  @text("encrypted_current_value") encryptedCurrentValue!: string
  @text("encrypted_purchase_value") encryptedPurchaseValue!: string
  @text("encrypted_description") encryptedDescription!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_synced") isSynced!: boolean
}

export class NetworthSnapshotModel extends Model {
  static table = "networth_snapshots"

  @text("firestore_id") firestoreId!: string
  @nochange @text("user_id") userId!: string
  @text("date") dateStr!: string
  @text("encrypted_total_bank") encryptedTotalBank!: string
  @text("encrypted_total_investments") encryptedTotalInvestments!: string
  @text("encrypted_total_assets") encryptedTotalAssets!: string
  @text("encrypted_total_debts") encryptedTotalDebts!: string
  @text("encrypted_networth") encryptedNetworth!: string
  @text("encrypted_liquid_funds") encryptedLiquidFunds!: string
  @readonly @date("created_at") createdAt!: Date
  @field("is_synced") isSynced!: boolean
}
