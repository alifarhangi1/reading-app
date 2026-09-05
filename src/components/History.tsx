import { effectiveMinutesPerPage, formatDayMonth, formatHm, pagesFromMinutes } from '../lib/calculations'
import type { Book, ReadingLogEntry, ScreenTimeEntry, Settings } from '../lib/types'

interface Props {
  books: Book[]
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  settings: Settings
}

export function History({ books, entries, readingLog, settings }: Props) {
  const dates = Array.from(new Set([...entries.map((e) => e.date), ...readingLog.map((r) => r.date)])).sort((a, b) =>
    a < b ? 1 : -1,
  )

  const dayRows = dates.map((date) => {
    const dayEntries = entries.filter((e) => e.date === date)
    const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0)
    const bookId = dayEntries.find((e) => e.active_book_id_at_entry)?.active_book_id_at_entry ?? null
    const book = bookId ? (books.find((b) => b.id === bookId) ?? null) : null
    const forfeitedPages = pagesFromMinutes(totalMinutes, effectiveMinutesPerPage(book, settings))
    const pagesRead = readingLog.find((r) => r.date === date)?.pages_read ?? 0
    return { date, totalMinutes, pagesRead, debtDelta: forfeitedPages - pagesRead }
  })

  const pastBooks = books
    .filter((b) => b.status === 'finished' || b.status === 'abandoned')
    .sort((a, b) => (b.finished_at ?? b.added_at).localeCompare(a.finished_at ?? a.added_at))

  return (
    <div>
      <h1 className="page-title">History</h1>

      <section className="section">
        <h2 className="section-title">Daily log</h2>
        {dayRows.length === 0 ? (
          <p className="muted">Nothing logged yet.</p>
        ) : (
          <div className="history-list">
            {dayRows.map((row) => (
              <div className="history-day" key={row.date}>
                <span>{formatDayMonth(row.date)}</span>
                <span className="muted">{formatHm(row.totalMinutes)}</span>
                <span className="muted">{row.pagesRead} pages read</span>
                <span className="debt-delta">
                  {row.debtDelta >= 0 ? '+' : '−'}
                  {Math.abs(Math.round(row.debtDelta))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Past books</h2>
        {pastBooks.length === 0 ? (
          <p className="muted">No finished or abandoned books yet.</p>
        ) : (
          <ul className="book-list">
            {pastBooks.map((b) => (
              <li key={b.id}>
                <span>
                  {b.title}
                  {b.author ? ` — ${b.author}` : ''}
                </span>
                <span className="muted">
                  {b.page_count} pages · {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
