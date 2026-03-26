import { Database } from "@nozbe/watermelondb"
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite"
import { schema } from "./schema"
import {
  TransactionModel,
  BrokerAccountModel,
  InvestmentTransactionModel,
  GoalModel,
  NotificationPatternModel,
  BankAccountModel,
  AssetModel,
  NetworthSnapshotModel,
} from "./models"

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error("WatermelonDB setup error:", error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [
    TransactionModel,
    BrokerAccountModel,
    InvestmentTransactionModel,
    GoalModel,
    NotificationPatternModel,
    BankAccountModel,
    AssetModel,
    NetworthSnapshotModel,
  ],
})
