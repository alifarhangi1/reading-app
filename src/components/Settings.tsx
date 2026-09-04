import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Book, Settings as SettingsType } from '../lib/types'

interface Props {
  settings: SettingsType
  books: Book[]
  onSave: (settings: SettingsType) => Promise<void>
}

export function Settings({ settings, books, onSave }: Props) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const selectableBooks = books.filter((b) => b.status !== 'finished')

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label>
        Track screen time from
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
      </label>

      <label>
        Default reading pace (minutes per page)
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
          {selectableBooks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  )
}
