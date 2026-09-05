export interface TrackedAppRow {
  id: string
  user_id: string
  name: string
  archived: boolean
  created_at: string
}

export const DEFAULT_TRACKED_APPS = ['tiktok', 'instagram', 'youtube']

export type BookStatus = 'queued' | 'active' | 'finished' | 'abandoned'
export type BookSource = 'google-books' | 'open-library' | 'manual'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  page_count: number
  starting_page: number
  source: BookSource
  cover_url: string | null
  minutes_per_page_override: number | null
  status: BookStatus
  added_at: string
  activated_at: string | null
  finished_at: string | null
}

/** Fields collected when adding a book, before it has an id/timestamps. */
export interface NewBookInput {
  title: string
  author: string | null
  page_count: number
  starting_page: number
  source: BookSource
  cover_url: string | null
}

export interface ScreenTimeEntry {
  id: string
  user_id: string
  date: string
  app_id: string
  minutes: number
  active_book_id_at_entry: string | null
  entered_at: string
}

export interface ReadingLogEntry {
  id: string
  user_id: string
  date: string
  pages_read: number
  active_book_id_at_entry: string | null
  logged_at: string
}

export interface Settings {
  user_id: string
  start_date: string
  default_minutes_per_page: number
  active_book_id: string | null
}
