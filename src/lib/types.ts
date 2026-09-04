export type TrackedApp = 'tiktok' | 'instagram' | 'youtube'

export const TRACKED_APPS: TrackedApp[] = ['tiktok', 'instagram', 'youtube']

export type BookStatus = 'queued' | 'active' | 'finished'
export type BookSource = 'google-books' | 'open-library' | 'manual'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  page_count: number
  source: BookSource
  cover_url: string | null
  minutes_per_page_override: number | null
  status: BookStatus
  added_at: string
  finished_at: string | null
}

export interface ScreenTimeEntry {
  id: string
  user_id: string
  date: string
  app: TrackedApp
  minutes: number
  active_book_id_at_entry: string | null
  entered_at: string
}

export interface Settings {
  user_id: string
  start_date: string
  default_minutes_per_page: number
  active_book_id: string | null
}
