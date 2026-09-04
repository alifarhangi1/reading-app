import type { Book, ScreenTimeEntry, Settings } from './types'

export function effectiveMinutesPerPage(book: Book | null, settings: Settings): number {
  return book?.minutes_per_page_override ?? settings.default_minutes_per_page
}

export function pagesFromMinutes(minutes: number, minutesPerPage: number): number {
  if (minutesPerPage <= 0) return 0
  return minutes / minutesPerPage
}

export interface StatsInput {
  entries: ScreenTimeEntry[]
  activeBook: Book | null
  settings: Settings
}

export interface Stats {
  totalMinutes: number
  attributedMinutes: number
  unattributedMinutes: number
  attributedPages: number
  unattributedPages: number
  bookComplete: boolean
}

/** Only entries on/after settings.start_date count. */
export function computeStats({ entries, activeBook, settings }: StatsInput): Stats {
  const inRange = entries.filter((e) => e.date >= settings.start_date)

  let attributedMinutes = 0
  let unattributedMinutes = 0
  for (const entry of inRange) {
    if (entry.active_book_id_at_entry && entry.active_book_id_at_entry === activeBook?.id) {
      attributedMinutes += entry.minutes
    } else if (!entry.active_book_id_at_entry) {
      unattributedMinutes += entry.minutes
    } else {
      // Logged against a book that is no longer active (e.g. already finished/swapped).
      // Historical entries stay attributed to whichever book they were logged under,
      // but since we only display the current active book's tally here, these are
      // neither counted as attributed-to-current nor unattributed — they belong to
      // that other book's own (already-closed) history.
    }
  }

  const attributedRate = effectiveMinutesPerPage(activeBook, settings)
  const unattributedRate = settings.default_minutes_per_page

  return {
    totalMinutes: attributedMinutes + unattributedMinutes,
    attributedMinutes,
    unattributedMinutes,
    attributedPages: pagesFromMinutes(attributedMinutes, attributedRate),
    unattributedPages: pagesFromMinutes(unattributedMinutes, unattributedRate),
    bookComplete: activeBook != null && pagesFromMinutes(attributedMinutes, attributedRate) >= activeBook.page_count,
  }
}
