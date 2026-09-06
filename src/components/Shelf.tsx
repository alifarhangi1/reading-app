import { Link, useSearchParams } from 'react-router-dom'
import { computeStats, formatDayMonth, formatHm, formatWeekdayDayMonth } from '../lib/calculations'
import { bookForDay, buildDaySummaries, pagesReadThrough, pairScale, steppableDates, summarise } from '../lib/days'
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
  const [params] = useSearchParams()
  const today = todayIso()
  const input = { entries, readingLog, books, settings }

  const days = buildDaySummaries(input, today)
  const steppable = steppableDates(days, today)

  // ISO rather than the wireframe's "3-sep", which can't disambiguate the year.
  const requested = params.get('day')
  const selected = requested && steppable.includes(requested) ? requested : today
  const isToday = selected === today

  const day = summarise(selected, input)
  const book = bookForDay(selected, input)

  if (!book) {
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

  const readThrough = pagesReadThrough(book, selected, input)
  const readToday = pagesReadThrough(book, today, input)
  const totalPct = Math.min(100, (readThrough / book.page_count) * 100)

  const { readPct, forfeitedPct } = pairScale(day.pagesRead, day.forfeited)

  const at = steppable.indexOf(selected)
  const prev = at > 0 ? steppable[at - 1] : null
  const next = at >= 0 && at < steppable.length - 1 ? steppable[at + 1] : null

  const stats = computeStats({ entries, readingLog, activeBook: book, settings })
  const queuedBooks = books.filter((b) => b.status === 'queued')

  const meta = [
    book.author,
    book.activated_at ? `started ${formatDayMonth(book.activated_at)}` : null,
    `${book.page_count} pages`,
  ].filter(Boolean)

  return (
    <div className="shelf">
      <p className="shelf-label">currently reading</p>

      <div className="shelf-body">
        <BookCover
          title={book.title}
          author={book.author}
          coverUrl={book.cover_url}
          pageCount={book.page_count}
        />

        <div className="shelf-details">
          <h1 className="book-title">{book.title}</h1>
          <p className="book-meta">{meta.join(' · ')}</p>

          <div className="total-panel">
            <div className="stat-row">
              <span>total pages read</span>
              <span className="value">
                {Math.round(readThrough)} <span className="muted">of {book.page_count}</span>
              </span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${totalPct}%` }} />
            </div>
            <p className="total-caption">
              cumulative through {formatDayMonth(selected)}
              {!isToday && ` · ${Math.round(readToday)} as of today (${formatDayMonth(today)})`}
            </p>
          </div>

          <hr className="shelf-divider" />

          <div className="day-row">
            <div className="day-stepper">
              <Link
                to={prev ? `/shelf?day=${prev}` : '#'}
                className={`day-arrow${prev ? '' : ' is-disabled'}`}
                aria-disabled={!prev}
                aria-label="Previous logged day"
              >
                ‹
              </Link>
              <span className="day-label">
                {isToday ? `today · ${formatDayMonth(today)}` : formatWeekdayDayMonth(selected)}
              </span>
              <Link
                to={next ? `/shelf?day=${next}` : '#'}
                className={`day-arrow${next ? '' : ' is-disabled'}`}
                aria-disabled={!next}
                aria-label="Next logged day"
              >
                ›
              </Link>
            </div>
            <span className="day-logged">
              <span className="muted">{formatHm(day.minutes)}</span>
              <span className="tag">social media</span>
            </span>
          </div>

          <div className="stat-block">
            <div className="stat-row">
              <span>pages read today</span>
              <span className="value">{Math.round(day.pagesRead)}</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${readPct}%` }} />
            </div>
          </div>

          <div className="stat-block">
            <div className="stat-row is-debt">
              <span>pages you could've read today</span>
              <span className="value">{Math.round(day.forfeited)}</span>
            </div>
            <div className="bar is-debt">
              <div className="bar-fill is-debt" style={{ width: `${forfeitedPct}%` }} />
            </div>
          </div>

          <div className="day-actions">
            <Link to={`/log/${selected}`} className={`button-link${isToday ? '' : ' is-outline'}`}>
              {isToday ? (day.logged ? "edit today's log" : "log today's time") : "edit this day's log"}
            </Link>
            {isToday ? (
              <Link to="/days" className="button-link is-outline">
                see all days
              </Link>
            ) : (
              <Link to="/shelf" className="button-link is-outline">
                back to today
              </Link>
            )}
          </div>
        </div>
      </div>

      {stats.bookComplete && book.status !== 'finished' && (
        <BookPrompt
          finishedBook={book}
          queuedBooks={queuedBooks}
          onPickExisting={onFinishAndPickExisting}
          onAddNew={onFinishAndAddNew}
          onSkip={onFinishAndSkip}
        />
      )}
    </div>
  )
}
