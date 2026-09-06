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
  clearQueuedBooks,
  addTrackedApp,
  setTrackedAppArchived,
} from './lib/data'
import { todayIso } from './lib/dates'
import type { Book, ScreenTimeEntry, ReadingLogEntry, Settings as SettingsType, TrackedAppRow, NewBookInput } from './lib/types'
import { Landing } from './components/Landing'
import { AuthPage } from './components/AuthPage'
import { LoadingScreen } from './components/LoadingScreen'
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

/* One boot progression: the auth check, then the five data requests. */
const BOOT_STEPS = 6
/** Floor so a fast load can't flash the screen (spec 6a). */
const MIN_LOADING_MS = 600

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [books, setBooks] = useState<Book[]>([])
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([])
  const [readingLog, setReadingLog] = useState<ReadingLogEntry[]>([])
  const [trackedApps, setTrackedApps] = useState<TrackedAppRow[]>([])
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loadedSteps, setLoadedSteps] = useState(0)
  const [minElapsed, setMinElapsed] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), MIN_LOADING_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadedSteps((n) => Math.max(n, 1))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Keyed on the user id, not the session object: Supabase emits several auth
  // events on sign-in, each with a fresh session object, which would otherwise
  // give this callback a new identity and fire a second concurrent boot.
  const authUserId = session?.user?.id
  const refresh = useCallback(async () => {
    if (!authUserId) return
    // Each request bumps the counter as it lands, so the bar and the skeleton
    // reflect real work rather than a timer.
    let done = 1
    const step = <T,>(p: Promise<T>): Promise<T> =>
      p.then((v) => {
        done += 1
        setLoadedSteps((n) => Math.max(n, done))
        return v
      })

    try {
      setBootError(null)
      const [b, e, r, t, s] = await Promise.all([
        step(fetchBooks(authUserId)),
        step(fetchEntries(authUserId)),
        step(fetchReadingLog(authUserId)),
        step(fetchTrackedApps(authUserId)),
        step(fetchSettings(authUserId)),
      ])
      setBooks(b)
      setEntries(e)
      setReadingLog(r)
      setTrackedApps(t)
      setSettings(s)
      maybeNotifyToday(e, b.find((x) => x.id === s.active_book_id) ?? null, s)
    } catch (err) {
      // Without this the boot gate below waits on `settings` forever and the
      // loading screen spins with the cause swallowed.
      console.error('[boot] loading data failed', err)
      setBootError(err instanceof Error ? err.message : String(err))
    }
  }, [authUserId])

  useEffect(() => {
    if (authUserId) refresh()
  }, [authUserId, refresh])

  // Surface a failed boot instead of spinning on it forever.
  if (bootError) {
    return (
      <div className="loading-screen">
        <div className="loading-slow">
          <p>Couldn't load your shelf.</p>
          <p className="muted">{bootError}</p>
          <div className="row">
            <button type="button" onClick={refresh}>
              try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // The minimum-duration floor applies only once signed in — a logged-out
  // visitor has no pages to count, so the landing page shouldn't wait on it.
  const booting = session === undefined || (session !== null && (!settings || !minElapsed))
  if (booting) return <LoadingScreen loaded={loadedSteps} total={BOOT_STEPS} onRetry={refresh} />

  if (session === null) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<AuthPage mode="sign-up" />} />
          <Route path="/signin" element={<AuthPage mode="sign-in" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

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

  async function handleClearQueue() {
    await clearQueuedBooks(userId)
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

  if (!settings) return null // unreachable: `booting` above covers it, kept for narrowing

  const activeBook = books.find((b) => b.id === settings.active_book_id) ?? null

  return (
    <BrowserRouter>
      <Layout onSignOut={() => supabase.auth.signOut()}>
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
                onClearQueue={handleClearQueue}
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
