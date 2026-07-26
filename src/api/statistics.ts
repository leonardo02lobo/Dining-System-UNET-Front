import { apiClient } from './client'
import type { AttendanceQueryFilters, AttendanceStatsResponse } from '../types/statistics'

function buildDemographicParams(filters?: AttendanceQueryFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters?.personType) params.set('person_type', filters.personType)
  if (filters?.gender) params.set('gender', filters.gender)
  if (filters?.career) params.set('career', filters.career)
  return params
}

export const statisticsApi = {
  byPeriod: (startDate: string, endDate: string, filters?: AttendanceQueryFilters) => {
    const params = buildDemographicParams(filters)
    params.set('start_date', startDate)
    params.set('end_date', endDate)
    return apiClient.get<AttendanceStatsResponse>(`/statistics/attendance/by-period?${params.toString()}`)
  },

  byLunchSession: (lunchSessionId: number, filters?: AttendanceQueryFilters) => {
    const params = buildDemographicParams(filters)
    const query = params.toString()
    return apiClient.get<AttendanceStatsResponse>(
      `/statistics/attendance/by-lunch-session/${lunchSessionId}${query ? `?${query}` : ''}`,
    )
  },
}
