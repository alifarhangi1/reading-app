import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { upsertEntry, upsertReadingLog } from '../lib/data'
import { effectiveMinutesPerPage, formatDayMonth, formatHm, pagesFromMinutes } from '../lib/calculations'
import { shiftIso, todayIso } from '../lib/dates'
import type { Book, ReadingLogEntry, ScreenTimeEntry, Settings, TrackedAppRow } from '../lib/types'

interface Props {
  userId: string
  trackedApps: TrackedAppRow[]
  entries: ScreenTimeEntry[]
  readingLog: ReadingLogEntry[]
  activeBook: Book | null
  settings: Settings
  onAddTrackedApp: (name: string) => Promise<void>
  onSaved: () => Promise<void>
}

type TimeFields = Record<string, { h: string; m: string }>

export function DailyLog({
  userId,
  trackedApps,
  entries,
  readingLog,
  activeBook,
  settings,
  onAddTrackedApp,
  onSaved,
}: Props) {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const today = todayIso()
  const date = dateParam ?? today

  const activeApps = trackedApps.filter((a) => !a.archived)

  const savedTimes = (): TimeFields => {
    const next: TimeFields = {}
    for (const app of activeApps) {
      const match = entries.find((e) => e.date === date && e.app_id === app.id)
      next[app.id] = match
        ? { h: String(Math.floor(match.minutes / 60)), m: String(match.minutes % 60) }
        : { h: '', m: '' }
    }
    return next
  }
  const savedPages = () => readingLog.find((r) => r.date === date)?.pages_read ?? 0

  const [times, setTimes] = useState<TimeFields>(savedTimes)
  const [pagesRead, setPagesRead] = useState(savedPages)
  const [loadedDate, setLoadedDate] = useState(date)
  const [dateOpen, setDateOpen] = useState(false)
  const [addingApp, setAddingApp] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset the form when the selected day changes — and only then, so a parent
  // refresh never clobbers in-progress edits for the day being edited.
  if (loadedDate !== date) {
    setLoadedDate(date)
    setTimes(savedTimes())
    setPagesRead(savedPages())
  }

  function resetToSaved() {
    setTimes(savedTimes())
    setPagesRead(savedPages())
  }

  function minutesFor(appId: string): number {
    const field = times[appId]
    if (!field) return 0
    return (parseInt(field.h, 10) || 0) * 60 + (parseInt(field.m, 10) || 0)
  }

  /*
   * Compares raw field text rather than computed minutes, so typing an explicit
   * "0" into a never-logged day counts as an edit (unset and zero are different
   * intents) and still surfaces the buttons.
   */
  const saved = savedTimes()
  const isDirty =
    pagesRead !== savedPages() ||
    activeApps.some(
      (app) =>
        (times[app.id]?.h ?? '') !== (saved[app.id]?.h ?? '') ||
        (times[app.id]?.m ?? '') !== (saved[app.id]?.m ?? ''),
    )

  function setField(appId: string, part: 'h' | 'm', value: string) {
    setTimes((prev) => ({
      ...prev,
      [appId]: { ...(prev[appId] ?? { h: '', m: '' }), [part]: value },
    }))
  }

  async function commitNewApp() {
    const name = newAppName.trim()
    setAddingApp(false)
    setNewAppName('')
    if (name) await onAddTrackedApp(name)
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    if (!isDirty) return
    setSaving(true)
    // Confirming writes a row for every app, so empty fields land as 0. Mirror
    // that back into the form or it would read as dirty forever afterwards.
    const written: TimeFields = {}
    for (const app of activeApps) {
      const minutes = minutesFor(app.id)
      await upsertEntry({
        user_id: userId,
        date,
        app_id: app.id,
        minutes,
        active_book_id_at_entry: activeBook?.id ?? null,
      })
      written[app.id] = { h: String(Math.floor(minutes / 60)), m: String(minutes % 60) }
    }
    await upsertReadingLog({
      user_id: userId,
      date,
      pages_read: pagesRead,
      active_book_id_at_entry: activeBook?.id ?? null,
    })
    setTimes(written)
    setSaving(false)
    await onSaved()
  }

  const totalMinutes = activeApps.reduce((sum, app) => sum + minutesFor(app.id), 0)
  const rate = effectiveMinutesPerPage(activeBook, settings)
  const forfeitedToday = pagesFromMinutes(totalMinutes, rate)

  return (
    <form className="daily-log" onSubmit={handleConfirm}>
      <div className="log-form">
        <div className="log-head">
          <h1 className="log-question handwritten">how much did the phone keep today?</h1>
          <button type="button" className="date-pill" onClick={() => setDateOpen((o) => !o)} aria-expanded={dateOpen}>
            {formatDayMonth(date)} ▾
          </button>
        </div>

        {dateOpen && (
          <div className="date-controls">
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate(`/log/${shiftIso(date, -1)}`)}
              aria-label="Previous day"
            >
              ←
            </button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && navigate(`/log/${e.target.value}`)}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate(`/log/${shiftIso(date, 1)}`)}
              disabled={date >= today}
              aria-label="Next day"
            >
              →
            </button>
          </div>
        )}

        <div className="app-rows">
          {activeApps.map((app) => {
            const mins = minutesFor(app.id)
            const share = totalMinutes > 0 ? (mins / totalMinutes) * 100 : 0
            return (
              <div className="app-row" key={app.id}>
                <span className="app-name">{app.name}</span>
                <div className="app-bar">
                  <div className="app-bar-fill" style={{ width: `${share}%` }} />
                </div>
                <div className="time-input">
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    aria-label={`${app.name} hours`}
                    value={times[app.id]?.h ?? ''}
                    onChange={(e) => setField(app.id, 'h', e.target.value)}
                  />
                  <span className="unit">h</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="00"
                    aria-label={`${app.name} minutes`}
                    value={times[app.id]?.m ?? ''}
                    onChange={(e) => setField(app.id, 'm', e.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="add-app-row">
          {addingApp ? (
            <>
              <span className="app-name">new app</span>
              <input
                autoFocus
                placeholder="name"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onBlur={commitNewApp}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitNewApp()
                  }
                  if (e.key === 'Escape') {
                    setAddingApp(false)
                    setNewAppName('')
                  }
                }}
              />
            </>
          ) : (
            <>
              <button type="button" className="button-quiet" onClick={() => setAddingApp(true)}>
                + add app
              </button>
              <button
                type="button"
                className="add-app-slot"
                onClick={() => setAddingApp(true)}
                aria-label="Add an app to track"
              />
            </>
          )}
        </div>

        <hr className="log-divider" />

        <div className="log-total">
          <span>total</span>
          <span>{formatHm(totalMinutes)}</span>
        </div>
      </div>

      {isDirty && (
        <div className="log-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'saving…' : 'confirm'}
          </button>
          <button type="button" className="button-outline" onClick={resetToSaved} disabled={saving}>
            cancel
          </button>
        </div>
      )}

      <div className="log-panels">
        <div className="panel">
          <div className="panel-label">pages forfeited</div>
          <div className="panel-figure">{Math.round(forfeitedToday)}</div>
        </div>

        <div className="panel">
          <div className="panel-label">pages actually read today</div>
          <div className="stepper">
            <button type="button" onClick={() => setPagesRead((p) => Math.max(0, p - 1))} aria-label="One page fewer">
              −
            </button>
            <span className="stepper-value">{pagesRead}</span>
            <button type="button" onClick={() => setPagesRead((p) => p + 1)} aria-label="One page more">
              +
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
