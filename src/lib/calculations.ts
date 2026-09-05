import type { Book, ScreenTimeEntry, ReadingLogEntry, Settings } from './types'

export function effectiveMinutesPerPage(book: Book | null, settings: Settings): number {
  return book?.minutes_per_page_override ?? settings.default_minutes_per_page
}

export function pagesFromMinutes(minutes: number, minutesPerPage: number): number {
  if (minutesPerPage <= 0) return 0
  return minutes / minutesPerPage
}

/** Durations always read as "2h 25m" in the UI — never raw minute counts. */
export function formatHm(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

/** "12 Aug" — the meta-line date format used on the shelf. */
export function formatDayMonth(isoDate: string): string {
  const d = new Date(isoDate.length > 10 ? isoDate : `${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`
}

export interface StatsInput {
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  activeBook: Book | null
  settings: Settings
}

export interface Stats {
  totalMinutes: number
  attributedMinutes: number
  unattributedMinutes: number
  forfeitedPages: number
  unattributedPages: number
  actualPagesRead: number
  pagesReadTotal: number
  debt: number
  bookComplete: boolean
  projectedFinishDate: string | null
}

/** Only entries on/after settings.start_date count. */
export function computeStats({ entries, readingLog, activeBook, settings }: StatsInput): Stats {
  const inRange = entries.filter((e) => e.date >= settings.start_date)

  let attributedMinutes = 0
  let unattributedMinutes = 0
  for (const entry of inRange) {
    if (entry.active_book_id_at_entry && entry.active_book_id_at_entry === activeBook?.id) {
      attributedMinutes += entry.minutes
    } else if (!entry.active_book_id_at_entry) {
      unattributedMinutes += entry.minutes
    } else {
      // Logged against a book that is no longer active (finished/swapped) — stays
      // part of that book's own closed history, not this book's or unattributed.
    }
  }

  const attributedRate = effectiveMinutesPerPage(activeBook, settings)
  const unattributedRate = settings.default_minutes_per_page

  const forfeitedPages = pagesFromMinutes(attributedMinutes, attributedRate)
  const unattributedPages = pagesFromMinutes(unattributedMinutes, unattributedRate)

  const actualPagesRead = readingLog
    .filter((r) => r.date >= settings.start_date && activeBook != null && r.active_book_id_at_entry === activeBook.id)
    .reduce((sum, r) => sum + r.pages_read, 0)

  const pagesReadTotal = (activeBook?.starting_page ?? 0) + actualPagesRead
  const debt = forfeitedPages - actualPagesRead
  const bookComplete = activeBook != null && pagesReadTotal >= activeBook.page_count

  return {
    totalMinutes: attributedMinutes + unattributedMinutes,
    attributedMinutes,
    unattributedMinutes,
    forfeitedPages,
    unattributedPages,
    actualPagesRead,
    pagesReadTotal,
    debt,
    bookComplete,
    projectedFinishDate: projectFinishDate(activeBook, pagesReadTotal),
  }
}

/**
 * MAYBE — parked, not currently rendered anywhere.
 *
 * Projects a finish date from the actual reading pace since the book became
 * active. The shelf callout that displayed this ("you'd have finished this book
 * on 8 Sep.") was removed pending a decision on whether the feature earns its
 * place. Kept because the pace math is the non-obvious part; if it's revived,
 * re-add a callout in Shelf.tsx reading `stats.projectedFinishDate`. If the
 * feature is dropped for good, delete this, `daysSince`, and the
 * `projectedFinishDate` field on `Stats`.
 */
function projectFinishDate(activeBook: Book | null, pagesReadTotal: number): string | null {
  if (!activeBook?.activated_at) return null
  const daysSinceStart = daysSince(activeBook.activated_at)
  const pagesRemaining = activeBook.page_count - pagesReadTotal
  if (pagesRemaining <= 0 || pagesReadTotal <= 0) return null

  const pacePerDay = pagesReadTotal / daysSinceStart
  if (pacePerDay <= 0) return null

  const daysRemaining = Math.ceil(pagesRemaining / pacePerDay)
  const projected = new Date()
  projected.setDate(projected.getDate() + daysRemaining)
  return projected.toISOString().slice(0, 10)
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - Date.parse(isoDate)
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
