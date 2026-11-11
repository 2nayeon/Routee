import client from './client'

// ────────────────────────────────────────────
// 타입 (백엔드 DTO와 1:1 매핑)
// ────────────────────────────────────────────

export interface LoginRequest  { username: string; password: string }
export interface LoginResponse { userId: number; username: string; token: string }
export interface SignupRequest { username: string; password: string; email: string }

export interface ScheduleRequest {
  title: string
  destination: string
  memberCount: number
  startDate: string
  endDate: string
}
export interface ScheduleResponse {
  scheduleId: number
  title: string
  destination: string
  memberCount: number
  startDate: string
  endDate: string
  placeCount: number
}
export interface ScheduleDetailResponse extends ScheduleResponse {
  tmpPlaces: TmpPlaceResponse[]
  timeline: Record<string, TimelineItemResponse[]>
}
export interface ScheduleUpdateRequest {
  title: string
  destination: string
  memberCount: number
  startDate: string
  endDate: string
}

export interface PlaceRequest {
  googlePlaceId: string
  placeName: string
  address: string
  latitude?: number
  longitude?: number
  category?: string
  phoneNumber?: string
  website?: string
  rating?: number
  openingHoursJson?: string
}
export interface TmpPlaceResponse {
  tmpPlaceId: number
  placeId: number
  googlePlaceId: string
  placeName: string
  address: string
  category: string
  phoneNumber?: string
  website?: string
  rating?: number
  openingHoursJson?: string
}
export interface PlaceSearchResponse {
  placeId?: number
  googlePlaceId: string
  placeName: string
  address: string
  latitude?: number
  longitude?: number
  category: string
  rating?: number
  phoneNumber?: string
  openingHoursJson?: string
}

export interface TimelineItemRequest {
  tmpPlaceId: number
  visitDate: string
}
export interface TimelineItemUpdateRequest {
  visitTime?: string
  endTime?: string
  memo?: string
}
export interface TimelineItemResponse {
  timelineItemId: number
  placeId: number
  placeName: string
  address: string
  category: string
  rating?: number
  visitOrder: number
  visitDate: string
  visitTime?: string
  endTime?: string
  memo?: string
  conflictWarning: boolean
}
export interface TimelineReorderRequest {
  orders: { timelineItemId: number; visitOrder: number }[]
}

export interface FolderRequest  { folderName: string }
export interface FolderResponse {
  folderId: number
  folderName: string
  placeCount: number
  createdAt: string
}
export interface FolderPlaceResponse {
  placeId: number
  googlePlaceId: string
  placeName: string
  address: string
  category: string
  rating?: number
  openingHoursJson?: string
}

export interface DiaryRequest {
  scheduleId: number
  content: string
  emoji: string
  coverColor: string
  photosJson?: string
}
export interface DiaryResponse {
  diaryId: number
  scheduleId: number
  scheduleTitle: string
  destination: string
  startDate: string
  endDate: string
  content: string
  emoji: string
  coverColor: string
  photosJson?: string
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────
// Auth API
// ────────────────────────────────────────────
export const authApi = {
  signup: (data: SignupRequest) =>
    client.post<string>('/api/auth/signup', data),
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/api/auth/login', data),
}

// ────────────────────────────────────────────
// Schedule API
// ────────────────────────────────────────────
export const scheduleApi = {
  getAll: () =>
    client.get<ScheduleResponse[]>('/api/schedules'),
  getDetail: (scheduleId: number) =>
    client.get<ScheduleDetailResponse>(`/api/schedules/${scheduleId}`),
  create: (data: ScheduleRequest) =>
    client.post<number>('/api/schedules/new', data),
  update: (scheduleId: number, data: ScheduleUpdateRequest) =>
    client.patch<ScheduleResponse>(`/api/schedules/${scheduleId}`, data),
  delete: (scheduleId: number) =>
    client.delete<void>(`/api/schedules/${scheduleId}`),
  addTmpPlace: (scheduleId: number, data: PlaceRequest) =>
    client.post<TmpPlaceResponse>(`/api/schedules/${scheduleId}/tmp-places`, data),
  addTmpFromFolder: (scheduleId: number, folderId: number, placeIds: number[]) =>
    client.post<TmpPlaceResponse[]>(`/api/schedules/${scheduleId}/tmp-places/from-folder`, { folderId, placeIds }),
  addTimelineItem: (scheduleId: number, data: TimelineItemRequest) =>
    client.post<TimelineItemResponse>(`/api/schedules/${scheduleId}/timeline-items`, data),
  updateTimelineItem: (scheduleId: number, itemId: number, data: TimelineItemUpdateRequest) =>
    client.patch<TimelineItemResponse>(`/api/schedules/${scheduleId}/timeline-items/${itemId}`, data),
  deleteTimelineItem: (scheduleId: number, itemId: number) =>
    client.delete<void>(`/api/schedules/${scheduleId}/timeline-items/${itemId}`),
  reorderTimeline: (scheduleId: number, data: TimelineReorderRequest) =>
    client.patch<TimelineItemResponse[]>(`/api/schedules/${scheduleId}/timeline-items/reorder`, data),
}

// ────────────────────────────────────────────
// Place API
// ────────────────────────────────────────────
export const placeApi = {
  search: (keyword: string) =>
    client.get<PlaceSearchResponse[]>('/api/places/search', { params: { keyword } }),
  save: (googlePlaceId: string) =>
    client.post<number>('/api/places/save', null, { params: { googlePlaceId } }),
}

// ────────────────────────────────────────────
// Folder API
// ────────────────────────────────────────────
export const folderApi = {
  getAll: () =>
    client.get<FolderResponse[]>('/api/folders'),
  getPlaces: (folderId: number) =>
    client.get<FolderPlaceResponse[]>(`/api/folders/${folderId}`),
  create: (folderName: string) =>
    client.post<FolderResponse>('/api/folders/new', { folderName }),
  delete: (folderId: number) =>
    client.delete<void>(`/api/folders/${folderId}`),
  addPlace: (folderId: number, placeId: number) =>
    client.post<FolderPlaceResponse>(`/api/folders/${folderId}/places`, { placeId }),
  removePlace: (folderId: number, placeId: number) =>
    client.delete<void>(`/api/folders/${folderId}/places/${placeId}`),
}

// ────────────────────────────────────────────
// Diary API
// ────────────────────────────────────────────
export const diaryApi = {
  getAll: () =>
    client.get<DiaryResponse[]>('/api/diaries'),
  getBySchedule: (scheduleId: number) =>
    client.get<DiaryResponse>(`/api/diaries/schedule/${scheduleId}`),
  create: (data: DiaryRequest) =>
    client.post<DiaryResponse>('/api/diaries', data),
  update: (diaryId: number, data: Partial<DiaryRequest>) =>
    client.patch<DiaryResponse>(`/api/diaries/${diaryId}`, data),
  delete: (diaryId: number) =>
    client.delete<void>(`/api/diaries/${diaryId}`),
}