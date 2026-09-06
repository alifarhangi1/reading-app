import { Link } from 'react-router-dom'
import { formatDayMonth } from '../lib/calculations'
import { buildDaySummaries, globalMax } from '../lib/days'
import { todayIso } from '../lib/dates'
import type { Book, ReadingLogEntry, ScreenTimeEntry, Settings } from '../lib/types'

interface Props {
  books: Book[]
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  settings: Settings
}

export function AllDays({ books, entries, readingLog, settings }: Props) {
  const days = buildDaySummaries({ entries, readingLog, books, settings }, todayIso())
  // One max across every row, unlike the shelf's per-day pair scale — here the
  // point is comparing days to each other, not the two values within a day.
  const max = globalMax(days)

  return (
    <div className="all-days">
      <h1 className="all-days-title">all days</h1>

      {days.length === 0 ? (
        <p className="muted">Nothing logged yet.</p>
      ) : (
        <div className="day-rows">
          {days.map((d) => (
            <Link key={d.date} to={`/shelf?day=${d.date}`} className="day-row-item">
              <span className="day-row-date">{formatDayMonth(d.date)}</span>

              {d.logged ? (
                <span className="day-row-bars">
                  <span className="bar">
                    <span
                      className="bar-fill"
                      style={{ width: `${max > 0 ? (d.pagesRead / max) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="bar is-debt">
                    <span
                      className="bar-fill is-debt"
                      style={{ width: `${max > 0 ? (d.forfeited / max) * 100 : 0}%` }}
                    />
                  </span>
                </span>
              ) : (
                <span className="day-row-bars">
                  <span className="bar is-empty" />
                </span>
              )}

              <span className={`day-row-values${d.logged ? '' : ' muted'}`}>
                {d.logged ? `${Math.round(d.pagesRead)} / ${Math.round(d.forfeited)}` : 'not logged'}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="day-legend">
        <span>
          <span className="legend-swatch" /> read
        </span>
        <span>
          <span className="legend-swatch is-debt" /> could've read
        </span>
      </div>
    </div>
  )
}
