import { SpendingCategory } from './transaction.types'

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
export type BudgetStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXCEEDED'

export interface CategoryBudget {
  id: string
  category: SpendingCategory
  limit: number
  spent: number
  alertAt: number // 0.0–1.0, default 0.8
}

export interface Budget {
  id: string
  name: string
  period: BudgetPeriod
  startDate: string
  endDate: string | null
  status: BudgetStatus
  totalLimit: number
  totalSpent: number
  currency: string
  categories: CategoryBudget[]
  createdAt: string
  updatedAt: string
}

export interface BudgetForecast {
  projectedSpend: number
  projectedOverspend: number | null
  daysRemaining: number
  dailyBudgetLeft: number
  categoryForecasts: {
    category: SpendingCategory
    projectedSpend: number
    limit: number
    willExceed: boolean
    daysUntilExceed: number | null
  }[]
}

export interface CreateBudgetPayload {
  name: string
  period: BudgetPeriod
  startDate: string
  endDate?: string
  totalLimit: number
  currency: string
  categories: { category: SpendingCategory; limit: number; alertAt?: number }[]
}
