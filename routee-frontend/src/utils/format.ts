// 날짜 · 시간 포맷 관련 공용 유틸. SchedulePage / DiaryPage / TripDetailPage 에 중복돼 있던
// formatDate, getStatus, nightsLabel, formatDayLabel, toMin, toLocalTime, fromLocalTime 을 통합했습니다.

export type TripStatus = 'ongoing' | 'upcoming' | 'past'

/** "2026-06-27" → "2026.06.27" */
export function formatDate(d: string): string {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

/** "2026-06-27" → "6월 27일" */
export function formatDayLabel(d: string): string {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`
}

/** 시작일/종료일을 오늘 날짜와 비교해 여행 상태를 반환합니다. */
export function getStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date().toISOString().split('T')[0]
  if (endDate < today) return 'past'
  if (startDate <= today) return 'ongoing'
  return 'upcoming'
}

/** 시작일/종료일로부터 "3박4일" 같은 라벨을 만듭니다. */
export function nightsLabel(startDate: string, endDate: string): string {
  const nights = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
  return `${nights}박${nights + 1}일`
}

/** 시작일부터 종료일까지의 날짜 배열("YYYY-MM-DD")을 반환합니다. */
export function getDayList(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    days.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

/** "HH:MM" → 0시부터 경과한 분(minute) */
export function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** "HH:MM" → "HH:MM:00" (백엔드 LocalTime 형식과 맞추기 위함) */
export function toLocalTime(time: string): string {
  return time.length === 5 ? time + ':00' : time
}

/** "HH:MM:00" → "HH:MM" (없으면 기본값 "09:00") */
export function fromLocalTime(time?: string): string {
  return time ? time.slice(0, 5) : '09:00'
}
