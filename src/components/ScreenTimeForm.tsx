import { useState } from 'react'
import type { FormEvent } from 'react'
import { upsertEntry } from '../lib/data'
import { TRACKED_APPS } from '../lib/types'
import type { ScreenTimeEntry, TrackedApp } from '../lib/types'

interface Props {
  userId: string
  activeBookId: string | null
  entries: ScreenTimeEntry[]
  onSaved: () => void
}

const APP_LABELS: Record<TrackedApp, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube (desktop)',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ScreenTimeForm({ userId, activeBookId, entries, onSaved }: Props) {
  const [date, setDate] = useState(today())
  const [minutes, setMinutes] = useState<Record<TrackedApp, string>>(() => prefill(date, entries))
  const [saving, setSaving] = useState(false)

  function prefill(d: string, list: ScreenTimeEntry[]): Record<TrackedApp, string> {
    const result = {} as Record<TrackedApp, string>
    for (const app of TRACKED_APPS) {
      const match = list.find((e) => e.date === d && e.app === app)
      result[app] = match ? String(match.minutes) : ''
    }
    return result
  }

  function changeDate(d: string) {
    setDate(d)
    setMinutes(prefill(d, entries))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    for (const app of TRACKED_APPS) {
      const value = minutes[app]
      if (value === '') continue
      await upsertEntry({
        user_id: userId,
        date,
        app,
        minutes: Math.max(0, parseInt(value, 10) || 0),
        active_book_id_at_entry: activeBookId,
      })
    }
    setSaving(false)
    onSaved()
  }

  return (
    <form className="screen-time-form" onSubmit={handleSubmit}>
      <label>
        Date
        <input type="date" value={date} max={today()} onChange={(e) => changeDate(e.target.value)} />
      </label>

      {TRACKED_APPS.map((app) => (
        <label key={app}>
          {APP_LABELS[app]} (minutes)
          <input
            type="number"
            min={0}
            value={minutes[app]}
            onChange={(e) => setMinutes({ ...minutes, [app]: e.target.value })}
          />
        </label>
      ))}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save screen time'}
      </button>
    </form>
  )
}
