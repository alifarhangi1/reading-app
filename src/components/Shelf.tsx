import { Link } from 'react-router-dom'
import { computeStats, formatDayMonth, formatHm } from '../lib/calculations'
import { todayIso } from '../lib/dates'
import type { Book, ScreenTimeEntry, ReadingLogEntry, Settings, NewBookInput } from '../lib/types'
import { BookPrompt } from './BookPrompt'
import { BookCover } from './BookCover'
import { PaperBook } from './PaperBook'

interface Props {
  books: Book[]
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  settings: Settings
  onFinishAndPickExisting: (bookId: string) => Promise<void>
  onFinishAndAddNew: (book: NewBookInput) => Promise<void>
  onFinishAndSkip: () => Promise<void>
}

export function Shelf({
  books,
  entries,
  readingLog,
  settings,
  onFinishAndPickExisting,
  onFinishAndAddNew,
  onFinishAndSkip,
}: Props) {
  const activeBook = books.find((b) => b.id === settings.active_book_id) ?? null
  const stats = computeStats({ entries, readingLog, activeBook, settings })
  const queuedBooks = books.filter((b) => b.status === 'queued')

  const today = todayIso()
  const todaysMinutes = entries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.minutes, 0)
  const todaysPages = readingLog.find((r) => r.date === today)?.pages_read ?? 0
  // Requires something actually recorded, so leftover zero rows can't make an
  // untouched day claim to be logged.
  const loggedToday = todaysMinutes > 0 || todaysPages > 0

  if (!activeBook) {
    return (
      <div className="shelf-empty">
        <PaperBook label="no book yet" dashed />
        <p className="loading-hint">next: pick the book you're reading</p>
        <Link to="/settings" className="button-link">
          pick your book
        </Link>
      </div>
    )
  }

  const readPercent = Math.min(100, (stats.pagesReadTotal / activeBook.page_count) * 100)
  const debtPercent = Math.min(100, (stats.debt / activeBook.page_count) * 100)

  const meta = [
    activeBook.author,
    activeBook.activated_at ? `started ${formatDayMonth(activeBook.activated_at)}` : null,
    `${activeBook.page_count} pages`,
  ].filter(Boolean)

  return (
    <div className="shelf">
      <p className="shelf-label">currently reading</p>

      <div className="shelf-body">
        <BookCover
          title={activeBook.title}
          author={activeBook.author}
          coverUrl={activeBook.cover_url}
          pageCount={activeBook.page_count}
        />

        <div className="shelf-details">
          <h1 className="book-title">{activeBook.title}</h1>
          <p className="book-meta">{meta.join(' · ')}</p>

          <div className="stat-block">
            <div className="stat-row">
              <span>pages read</span>
              <span className="value">{Math.round(stats.pagesReadTotal)}</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${readPercent}%` }} />
            </div>
          </div>

          <div className="stat-block">
            {stats.debt >= 0 ? (
              <>
                <div className="stat-row is-debt">
                  <span>pages you could've read</span>
                  <span className="value">{Math.round(stats.debt)}</span>
                </div>
                <div className="bar is-debt">
                  <div className="bar-fill is-debt" style={{ width: `${debtPercent}%` }} />
                </div>
              </>
            ) : (
              <div className="stat-row is-debt">
                <span>ahead by</span>
                <span className="value">{Math.round(-stats.debt)} pages</span>
              </div>
            )}
          </div>

          <div className="shelf-cta">
            <div>
              <p className="shelf-cta-title">
                {loggedToday ? `Today's logged — ${formatHm(todaysMinutes)}.` : "Today isn't logged yet."}
              </p>
              <p className="shelf-cta-sub">One number, once a day.</p>
            </div>
            <Link to={`/log/${today}`} className="button-link">
              {loggedToday ? "edit today's log" : 'log social media time'}
            </Link>
          </div>
        </div>
      </div>

      {stats.bookComplete && activeBook.status !== 'finished' && (
        <BookPrompt
          finishedBook={activeBook}
          queuedBooks={queuedBooks}
          onPickExisting={onFinishAndPickExisting}
          onAddNew={onFinishAndAddNew}
          onSkip={onFinishAndSkip}
        />
      )}
    </div>
  )
}
