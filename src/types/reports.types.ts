// Report types
export const REPORT_TYPE = {
  FREIGHTS: 'freights',
  FINANCIAL: 'financial',
  CUSTOMERS: 'customers',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  EXECUTIVE: 'executive',
} as const

export type ReportType = typeof REPORT_TYPE[keyof typeof REPORT_TYPE]

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  freights: 'Fretes',
  financial: 'Financeiro',
  customers: 'Clientes',
  drivers: 'Motoristas',
  vehicles: 'Veículos',
  executive: 'Executivo',
}

// Export formats
export const EXPORT_FORMAT = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
} as const

export type ExportFormat = typeof EXPORT_FORMAT[keyof typeof EXPORT_FORMAT]

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  csv: 'CSV',
}

// Report period
export const REPORT_PERIOD = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
} as const

export type ReportPeriod = typeof REPORT_PERIOD[keyof typeof REPORT_PERIOD]

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  this_week: 'Esta Semana',
  last_week: 'Semana Passada',
  this_month: 'Este Mês',
  last_month: 'Mês Passado',
  this_quarter: 'Este Trimestre',
  last_quarter: 'Trimestre Passado',
  this_year: 'Este Ano',
  last_year: 'Ano Passado',
  custom: 'Período Personalizado',
}

// Report filters
export interface ReportFilters {
  period: ReportPeriod
  start_date?: string
  end_date?: string
  customer_id?: string
  driver_id?: string
  vehicle_id?: string
  status?: string
  category_id?: string
  min_amount?: number
  max_amount?: number
}

// Report data interfaces
export interface FreightReportData {
  total_freights: number
  total_value: number
  average_value: number
  by_status: Array<{ status: string; count: number; total: number }>
  by_origin: Array<{ state: string; count: number; total: number }>
  by_destination: Array<{ state: string; count: number; total: number }>
  by_customer: Array<{ customer_name: string; count: number; total: number }>
  by_driver: Array<{ driver_name: string; count: number; total: number }>
  by_vehicle: Array<{ vehicle_plate: string; count: number; total: number }>
  timeline: Array<{ date: string; count: number; total: number }>
  freights: any[]
}

export interface FinancialReportData {
  total_income: number
  total_expense: number
  net_balance: number
  by_status: Array<{ status: string; income: number; expense: number }>
  by_category_income: Array<{ category: string; total: number; count: number }>
  by_category_expense: Array<{ category: string; total: number; count: number }>
  by_payment_method: Array<{ method: string; total: number; count: number }>
  cash_flow: Array<{ date: string; income: number; expense: number; balance: number }>
  transactions: any[]
}

export interface CustomerReportData {
  total_customers: number
  active_count: number
  inactive_count: number
  by_type: Array<{ type: string; count: number }>
  by_state: Array<{ state: string; count: number }>
  top_customers: Array<{ 
    customer_name: string
    total_freights: number
    total_value: number
  }>
  customers: any[]
}

export interface DriverReportData {
  total_drivers: number
  active_count: number
  inactive_count: number
  on_vacation_count: number
  by_license_category: Array<{ category: string; count: number }>
  license_expiring_soon: Array<{ driver_name: string; expiry_date: string; days_until: number }>
  license_expired: Array<{ driver_name: string; expiry_date: string }>
  top_drivers: Array<{
    driver_name: string
    total_freights: number
    total_distance: number
  }>
  drivers: any[]
}

export interface VehicleReportData {
  total_vehicles: number
  active_count: number
  maintenance_count: number
  inactive_count: number
  by_type: Array<{ type: string; count: number }>
  documents_expiring_soon: Array<{
    vehicle_plate: string
    document_type: string
    expiry_date: string
    days_until: number
  }>
  documents_expired: Array<{
    vehicle_plate: string
    document_type: string
    expiry_date: string
  }>
  top_vehicles: Array<{
    vehicle_plate: string
    total_freights: number
    total_distance: number
  }>
  vehicles: any[]
}

export interface ExecutiveReportData {
  period: { start: string; end: string }
  financial: {
    revenue: number
    expenses: number
    profit: number
    profit_margin: number
  }
  operations: {
    total_freights: number
    completed_freights: number
    completion_rate: number
    average_freight_value: number
  }
  customers: {
    total_customers: number
    active_customers: number
    new_customers: number
    top_customer: string
  }
  fleet: {
    total_vehicles: number
    active_vehicles: number
    utilization_rate: number
    maintenance_needed: number
  }
  growth: {
    revenue_growth: number
    freight_growth: number
    customer_growth: number
  }
  charts: {
    revenue_trend: Array<{ month: string; revenue: number; expenses: number }>
    freight_trend: Array<{ month: string; count: number }>
    top_routes: Array<{ route: string; count: number; revenue: number }>
  }
}

// Report request
export interface ReportRequest {
  type: ReportType
  format: ExportFormat
  filters: ReportFilters
  include_charts?: boolean
  include_details?: boolean
}

// Report history
export interface ReportHistory {
  id: string
  company_id: string
  type: ReportType
  format: ExportFormat
  filters: ReportFilters
  file_url: string
  file_size: number
  generated_at: string
  generated_by: string
}

// Scheduled report
export interface ScheduledReport {
  id: string
  company_id: string
  name: string
  type: ReportType
  format: ExportFormat
  filters: ReportFilters
  schedule: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  is_active: boolean
  last_run?: string
  next_run?: string
}
