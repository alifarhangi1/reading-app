import { computeStats } from '../lib/calculations'
import type { Book, ScreenTimeEntry, Settings, BookSource } from '../lib/types'
import { ScreenTimeForm } from './ScreenTimeForm'
import { BookPrompt } from './BookPrompt'

interface Props {
  userId: string
  books: Book[]
  entries: ScreenTimeEntry[]
  settings: Settings
  onRefresh: () => Promise<void>
  onEntrySaved: () => Promise<void>
  onFinishAndPickExisting: (bookId: string) => Promise<void>
  onFinishAndAddNew: (book: { title: string; author: string | null; page_count: number; source: BookSource; cover_url: string | null }) => Promise<void>
  onFinishAndSkip: () => Promise<void>
}

export function Dashboard({
  userId,
  books,
  entries,
  settings,
  onRefresh,
  onEntrySaved,
  onFinishAndPickExisting,
  onFinishAndAddNew,
  onFinishAndSkip,
}: Props) {
  const activeBook = books.find((b) => b.id === settings.active_book_id) ?? null
  const stats = computeStats({ entries, activeBook, settings })
  const queuedBooks = books.filter((b) => b.status === 'queued')

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your reading dashboard</h1>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {activeBook ? (
        <div className="active-book-card">
          <h2>{activeBook.title}</h2>
          {activeBook.author && <p className="muted">{activeBook.author}</p>}
          <p className="pages-stat">
            {stats.attributedPages.toFixed(1)} / {activeBook.page_count} pages you could've read
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (stats.attributedPages / activeBook.page_count) * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="active-book-card muted">No active book selected.</div>
      )}

      {stats.unattributedPages > 0 && (
        <p className="muted">
          {stats.unattributedPages.toFixed(1)} pages you could've read with no book selected
        </p>
      )}

      {stats.bookComplete && activeBook && activeBook.status !== 'finished' && (
        <BookPrompt
          finishedBook={activeBook}
          queuedBooks={queuedBooks}
          onPickExisting={onFinishAndPickExisting}
          onAddNew={onFinishAndAddNew}
          onSkip={onFinishAndSkip}
        />
      )}

      <section>
        <h3>Log today's screen time</h3>
        <ScreenTimeForm
          userId={userId}
          activeBookId={settings.active_book_id}
          entries={entries}
          onSaved={onEntrySaved}
        />
      </section>
    </div>
  )
}
