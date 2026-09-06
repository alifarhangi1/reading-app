import { effectiveMinutesPerPage, pagesFromMinutes } from './calculations'
import { shiftIso } from './dates'
import type { Book, ReadingLogEntry, ScreenTimeEntry, Settings } from './types'

export interface DaySummary {
  date: string
  /** Screen time recorded that day. */
  minutes: number
  /** Pages actually read that day. */
  pagesRead: number
  /** Pages that day's screen time could have bought. */
  forfeited: number
  /** The book that was active when the day was logged, frozen at entry time. */
  bookId: string | null
  logged: boolean
}

interface Input {
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  books: Book[]
  settings: Settings
}

/** The book that was on the shelf on a given day, falling back to the current one. */
export function bookForDay(date: string, { entries, readingLog, books, settings }: Input): Book | null {
  const frozenId =
    readingLog.find((r) => r.date === date)?.active_book_id_at_entry ??
    entries.find((e) => e.date === date)?.active_book_id_at_entry ??
    settings.active_book_id
  return books.find((b) => b.id === frozenId) ?? null
}

/** Guard against an ancient start date walking the calendar forever. */
const MAX_DAYS = 730

/**
 * Every day from the tracking start date to today, newest first — including
 * days with nothing recorded, which the all-days list shows as "not logged".
 * The stepper filters those out separately, so arrows skip them.
 */
export function buildDaySummaries(input: Input, today: string): DaySummary[] {
  const { settings } = input
  const dates: string[] = []
  for (let d = today; d >= settings.start_date && dates.length < MAX_DAYS; d = shiftIso(d, -1)) {
    dates.push(d)
  }
  return dates.map((date) => summarise(date, input))
}

export function summarise(date: string, input: Input): DaySummary {
  const { entries, readingLog, settings } = input
  const minutes = entries.filter((e) => e.date === date).reduce((sum, e) => sum + e.minutes, 0)
  const pagesRead = readingLog.find((r) => r.date === date)?.pages_read ?? 0
  const book = bookForDay(date, input)

  return {
    date,
    minutes,
    pagesRead,
    forfeited: pagesFromMinutes(minutes, effectiveMinutesPerPage(book, settings)),
    bookId: book?.id ?? null,
    logged: minutes > 0 || pagesRead > 0,
  }
}

/**
 * Pages actually read in a book up to and including a date — the starting page
 * plus every log on or before it. Stepping back through days rewinds this.
 */
export function pagesReadThrough(
  book: Book,
  date: string,
  { readingLog, settings }: Pick<Input, 'readingLog' | 'settings'>,
): number {
  const logged = readingLog
    .filter(
      (r) =>
        r.active_book_id_at_entry === book.id &&
        r.date >= settings.start_date &&
        r.date <= date,
    )
    .reduce((sum, r) => sum + r.pages_read, 0)
  return book.starting_page + logged
}

/**
 * The two day bars share one scale: the larger of the pair fills the track, so
 * their lengths are directly comparable rather than each self-normalising.
 */
export function pairScale(read: number, forfeited: number): { readPct: number; forfeitedPct: number } {
  const max = Math.max(read, forfeited)
  if (max <= 0) return { readPct: 0, forfeitedPct: 0 }
  return { readPct: (read / max) * 100, forfeitedPct: (forfeited / max) * 100 }
}

/**
 * The all-days list deliberately uses a different rule: one max across every
 * listed day, so rows compare against each other and not just within a row.
 */
export function globalMax(days: DaySummary[]): number {
  return days.reduce((max, d) => Math.max(max, d.pagesRead, d.forfeited), 0)
}

/** Arrows walk logged days only; today is always reachable as the newest step. */
export function steppableDates(days: DaySummary[], today: string): string[] {
  const set = new Set(days.filter((d) => d.logged).map((d) => d.date))
  set.add(today)
  return [...set].sort()
}
