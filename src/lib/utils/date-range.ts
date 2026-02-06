import type { ReportPeriod } from '@/types/reports.types'

export interface DateRange {
  start_date: string
  end_date: string
}

export function calculateDateRange(period: ReportPeriod, customStart?: string, customEnd?: string): DateRange {
  const today = new Date()
  let start_date: Date
  let end_date: Date

  switch (period) {
    case 'today':
      start_date = new Date(today)
      end_date = new Date(today)
      break

    case 'yesterday':
      start_date = new Date(today)
      start_date.setDate(today.getDate() - 1)
      end_date = new Date(start_date)
      break

    case 'this_week':
      start_date = new Date(today)
      start_date.setDate(today.getDate() - today.getDay())
      end_date = new Date(today)
      break

    case 'last_week':
      start_date = new Date(today)
      start_date.setDate(today.getDate() - today.getDay() - 7)
      end_date = new Date(start_date)
      end_date.setDate(start_date.getDate() + 6)
      break

    case 'this_month':
      start_date = new Date(today.getFullYear(), today.getMonth(), 1)
      end_date = new Date(today)
      break

    case 'last_month':
      start_date = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      end_date = new Date(today.getFullYear(), today.getMonth(), 0)
      break

    case 'this_quarter':
      const currentQuarter = Math.floor(today.getMonth() / 3)
      start_date = new Date(today.getFullYear(), currentQuarter * 3, 1)
      end_date = new Date(today)
      break

    case 'last_quarter':
      const lastQuarter = Math.floor(today.getMonth() / 3) - 1
      start_date = new Date(today.getFullYear(), lastQuarter * 3, 1)
      end_date = new Date(today.getFullYear(), lastQuarter * 3 + 3, 0)
      break

    case 'this_year':
      start_date = new Date(today.getFullYear(), 0, 1)
      end_date = new Date(today)
      break

    case 'last_year':
      start_date = new Date(today.getFullYear() - 1, 0, 1)
      end_date = new Date(today.getFullYear() - 1, 11, 31)
      break

    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom period requires start_date and end_date')
      }
      start_date = new Date(customStart)
      end_date = new Date(customEnd)
      break

    default:
      start_date = new Date(today)
      end_date = new Date(today)
  }

  return {
    start_date: start_date!.toISOString().split('T')[0],
    end_date: end_date!.toISOString().split('T')[0],
  }
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }

  return `${startDate.toLocaleDateString('pt-BR', formatOptions)} - ${endDate.toLocaleDateString('pt-BR', formatOptions)}`
}
