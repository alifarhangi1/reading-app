import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Book, NewBookInput, Settings as SettingsType, TrackedAppRow } from '../lib/types'
import { BookSearch } from './BookSearch'

interface Props {
  settings: SettingsType
  books: Book[]
  trackedApps: TrackedAppRow[]
  onSave: (settings: SettingsType) => Promise<void>
  onScrapActiveBook: () => Promise<void>
  onSetTrackedAppArchived: (id: string, archived: boolean) => Promise<void>
  onAddBook: (book: NewBookInput) => Promise<void>
}

export function Settings({
  settings,
  books,
  trackedApps,
  onSave,
  onScrapActiveBook,
  onSetTrackedAppArchived,
  onAddBook,
}: Props) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [scrapping, setScrapping] = useState(false)

  const activeBook = books.find((b) => b.id === settings.active_book_id) ?? null
  const shelfBooks = books.filter((b) => b.status === 'queued' || b.status === 'active')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  async function handleScrap() {
    if (!activeBook) return
    const confirmed = window.confirm(
      `Scrap "${activeBook.title}" as your active book? Screen time already logged for it stays in your history — it just stops being tracked.`,
    )
    if (!confirmed) return
    setScrapping(true)
    await onScrapActiveBook()
    setScrapping(false)
  }

  return (
    <div>
      <section className="section">
        <h2 className="section-title">Books</h2>
        <BookSearch onAdd={onAddBook} />
        {shelfBooks.length > 0 && (
          <ul className="book-list">
            {shelfBooks.map((b) => (
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

      <section className="section">
        <h2 className="section-title">Tracking</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Count screen time from
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </label>

          <label>
            Reading pace (minutes per page)
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={form.default_minutes_per_page}
              onChange={(e) => setForm({ ...form, default_minutes_per_page: parseFloat(e.target.value) || 0 })}
            />
          </label>

          <label>
            Active book
            <select
              value={form.active_book_id ?? ''}
              onChange={(e) => setForm({ ...form, active_book_id: e.target.value || null })}
            >
              <option value="">None (unattributed)</option>
              {shelfBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </label>

          <div className="row">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>

          {activeBook && (
            <div className="settings-tucked">
              <button type="button" className="link-button" onClick={handleScrap} disabled={scrapping}>
                {scrapping ? 'Scrapping…' : `Scrap "${activeBook.title}"`}
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">Tracked apps</h2>
        <ul className="book-list">
          {trackedApps.map((app) => (
            <li key={app.id}>
              <span className={app.archived ? 'muted' : ''}>{app.name}</span>
              <button
                type="button"
                className="link-button"
                onClick={() => onSetTrackedAppArchived(app.id, !app.archived)}
              >
                {app.archived ? 'restore' : 'archive'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
