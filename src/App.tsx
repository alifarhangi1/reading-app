import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import {
  fetchBooks,
  fetchEntries,
  fetchSettings,
  fetchTrackedApps,
  fetchReadingLog,
  saveSettings as saveSettingsApi,
  addBook,
  finishBook,
  abandonBook,
  setActiveBook,
  addTrackedApp,
  setTrackedAppArchived,
} from './lib/data'
import { todayIso } from './lib/dates'
import type { Book, ScreenTimeEntry, ReadingLogEntry, Settings as SettingsType, TrackedAppRow, NewBookInput } from './lib/types'
import { Landing } from './components/Landing'
import { Shelf } from './components/Shelf'
import { DailyLog } from './components/DailyLog'
import { History } from './components/History'
import { Settings } from './components/Settings'
import { Layout } from './components/Layout'

function maybeNotifyToday(entries: ScreenTimeEntry[], activeBook: Book | null, settings: SettingsType) {
  const today = todayIso()
  if (localStorage.getItem('lastNotifiedDate') === today) return

  const todaysEntries = entries.filter((e) => e.date === today)
  if (todaysEntries.length === 0) return

  const todaysMinutes = todaysEntries.reduce((sum, e) => sum + e.minutes, 0)
  const rate = activeBook?.minutes_per_page_override ?? settings.default_minutes_per_page
  const pages = (todaysMinutes / rate).toFixed(0)
  const bookPart = activeBook ? ` of ${activeBook.title}` : ''

  const fire = () => {
    new Notification('Pages you could have read', {
      body: `${todaysMinutes} min on your tracked apps today — that's about ${pages} pages${bookPart}.`,
    })
    localStorage.setItem('lastNotifiedDate', today)
  }

  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    fire()
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') fire()
    })
  }
}

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [books, setBooks] = useState<Book[]>([])
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([])
  const [readingLog, setReadingLog] = useState<ReadingLogEntry[]>([])
  const [trackedApps, setTrackedApps] = useState<TrackedAppRow[]>([])
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    const [b, e, r, t, s] = await Promise.all([
      fetchBooks(session.user.id),
      fetchEntries(session.user.id),
      fetchReadingLog(session.user.id),
      fetchTrackedApps(session.user.id),
      fetchSettings(session.user.id),
    ])
    setBooks(b)
    setEntries(e)
    setReadingLog(r)
    setTrackedApps(t)
    setSettings(s)
    setLoading(false)
    maybeNotifyToday(e, b.find((x) => x.id === s.active_book_id) ?? null, s)
  }, [session])

  useEffect(() => {
    if (session?.user) refresh()
  }, [session, refresh])

  if (session === undefined) return <div className="center-message">Loading…</div>
  if (session === null) return <Landing />

  const userId = session.user.id

  async function handleAddBook(fields: NewBookInput) {
    const isFirstBook = !settings?.active_book_id
    const newBook = await addBook({
      user_id: userId,
      title: fields.title,
      author: fields.author,
      page_count: fields.page_count,
      starting_page: fields.starting_page,
      source: fields.source,
      cover_url: fields.cover_url,
      minutes_per_page_override: null,
      status: isFirstBook ? 'active' : 'queued',
    })
    if (isFirstBook && settings) {
      await saveSettingsApi({ ...settings, active_book_id: newBook.id })
    }
    await refresh()
  }

  async function handleFinishAndPickExisting(bookId: string) {
    if (!settings?.active_book_id) return
    await finishBook(settings.active_book_id)
    await setActiveBook(bookId)
    await saveSettingsApi({ ...settings, active_book_id: bookId })
    await refresh()
  }

  async function handleFinishAndAddNew(fields: NewBookInput) {
    if (!settings?.active_book_id) return
    await finishBook(settings.active_book_id)
    const newBook = await addBook({
      user_id: userId,
      title: fields.title,
      author: fields.author,
      page_count: fields.page_count,
      starting_page: fields.starting_page,
      source: fields.source,
      cover_url: fields.cover_url,
      minutes_per_page_override: null,
      status: 'active',
    })
    await saveSettingsApi({ ...settings, active_book_id: newBook.id })
    await refresh()
  }

  async function handleFinishAndSkip() {
    if (!settings?.active_book_id) return
    await finishBook(settings.active_book_id)
    await saveSettingsApi({ ...settings, active_book_id: null })
    await refresh()
  }

  async function handleSaveSettings(next: SettingsType) {
    await saveSettingsApi(next)
    await refresh()
  }

  async function handleScrapActiveBook() {
    if (!settings?.active_book_id) return
    await abandonBook(settings.active_book_id)
    await saveSettingsApi({ ...settings, active_book_id: null })
    await refresh()
  }

  async function handleAddTrackedApp(name: string) {
    await addTrackedApp(userId, name)
    await refresh()
  }

  async function handleSetTrackedAppArchived(id: string, archived: boolean) {
    await setTrackedAppArchived(id, archived)
    await refresh()
  }

  if (loading && !settings) return <div className="center-message">Loading your data…</div>
  if (!settings) return null

  const activeBook = books.find((b) => b.id === settings.active_book_id) ?? null

  return (
    <BrowserRouter>
      <Layout onSignOut={() => supabase.auth.signOut()} onRefresh={refresh}>
        <Routes>
          <Route
            path="/shelf"
            element={
              <Shelf
                books={books}
                entries={entries}
                readingLog={readingLog}
                settings={settings}
                onFinishAndPickExisting={handleFinishAndPickExisting}
                onFinishAndAddNew={handleFinishAndAddNew}
                onFinishAndSkip={handleFinishAndSkip}
              />
            }
          />
          <Route
            path="/log/:date?"
            element={
              <DailyLog
                userId={userId}
                trackedApps={trackedApps}
                entries={entries}
                readingLog={readingLog}
                activeBook={activeBook}
                settings={settings}
                onAddTrackedApp={handleAddTrackedApp}
                onSaved={refresh}
              />
            }
          />
          <Route
            path="/history"
            element={<History books={books} entries={entries} readingLog={readingLog} settings={settings} />}
          />
          <Route
            path="/settings"
            element={
              <Settings
                settings={settings}
                books={books}
                trackedApps={trackedApps}
                onSave={handleSaveSettings}
                onScrapActiveBook={handleScrapActiveBook}
                onSetTrackedAppArchived={handleSetTrackedAppArchived}
                onAddBook={handleAddBook}
              />
            }
          />
          <Route path="*" element={<Navigate to="/shelf" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
