export interface ReportFilters {
  from_date: string
  to_date: string
}

export interface ConsumptionReportPeriod {
  fromDate: string
  toDate: string
}

export interface ConsumptionReportItem {
  itemId: number
  itemName: string
  categoryName: string
  quantityConsumed: number
  unit: string
  period: ConsumptionReportPeriod
}

export interface DayCount {
  date: string
  total: number
  manual_count: number
}

export interface UserTypeCount {
  user_type: string
  total: number
}

export interface ConsumptionReport {
  from_date: string
  to_date: string
  total_consumptions: number
  by_day: DayCount[]
  by_user_type: UserTypeCount[]
}

export interface StatusCount {
  status: string
  count: number
}

export interface ReasonCount {
  reason: string
  count: number
}

export interface SanctionReport {
  total: number
  by_status: StatusCount[]
  by_reason: ReasonCount[]
}
