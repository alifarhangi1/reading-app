import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { fetchBooks, fetchEntries, fetchSettings, saveSettings as saveSettingsApi, addBook, finishBook, setActiveBook } from './lib/data'
import type { Book, ScreenTimeEntry, Settings as SettingsType, BookSource } from './lib/types'
import { Landing } from './components/Landing'
import { Dashboard } from './components/Dashboard'
import { BookSearch } from './components/BookSearch'
import { Settings } from './components/Settings'

type Tab = 'dashboard' | 'books' | 'settings'

function maybeNotifyToday(entries: ScreenTimeEntry[], activeBook: Book | null, settings: SettingsType) {
  const today = new Date().toISOString().slice(0, 10)
  const lastNotified = localStorage.getItem('lastNotifiedDate')
  if (lastNotified === today) return

  const todaysEntries = entries.filter((e) => e.date === today)
  if (todaysEntries.length === 0) return

  const todaysMinutes = todaysEntries.reduce((sum, e) => sum + e.minutes, 0)
  const rate = activeBook?.minutes_per_page_override ?? settings.default_minutes_per_page
  const pages = (todaysMinutes / rate).toFixed(0)
  const bookPart = activeBook ? ` of ${activeBook.title}` : ''

  const fire = () => {
    new Notification('Pages you could have read', {
      body: `${todaysMinutes} min on TikTok/Instagram/YouTube today — that's about ${pages} pages${bookPart}.`,
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
  const [tab, setTab] = useState<Tab>('dashboard')
  const [books, setBooks] = useState<Book[]>([])
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([])
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
    const [b, e, s] = await Promise.all([
      fetchBooks(session.user.id),
      fetchEntries(session.user.id),
      fetchSettings(session.user.id),
    ])
    setBooks(b)
    setEntries(e)
    setSettings(s)
    setLoading(false)
    maybeNotifyToday(e, b.find((x) => x.id === s.active_book_id) ?? null, s)
  }, [session])

  useEffect(() => {
    if (session?.user) refresh()
  }, [session, refresh])

  if (session === undefined) return <div className="center-message">Loading...</div>
  if (session === null) return <Landing />

  const userId = session.user.id

  async function handleAddBook(fields: { title: string; author: string | null; page_count: number; source: BookSource; cover_url: string | null }) {
    const isFirstBook = !settings?.active_book_id
    const newBook = await addBook({
      user_id: userId,
      title: fields.title,
      author: fields.author,
      page_count: fields.page_count,
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

  async function handleFinishAndAddNew(fields: { title: string; author: string | null; page_count: number; source: BookSource; cover_url: string | null }) {
    if (!settings?.active_book_id) return
    await finishBook(settings.active_book_id)
    const newBook = await addBook({
      user_id: userId,
      title: fields.title,
      author: fields.author,
      page_count: fields.page_count,
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

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="tabs">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
          <button className={tab === 'books' ? 'active' : ''} onClick={() => setTab('books')}>
            Books
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            Settings
          </button>
        </div>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>

      {loading && !settings ? (
        <div className="center-message">Loading your data...</div>
      ) : settings ? (
        <>
          {tab === 'dashboard' && (
            <Dashboard
              userId={userId}
              books={books}
              entries={entries}
              settings={settings}
              onRefresh={refresh}
              onEntrySaved={refresh}
              onFinishAndPickExisting={handleFinishAndPickExisting}
              onFinishAndAddNew={handleFinishAndAddNew}
              onFinishAndSkip={handleFinishAndSkip}
            />
          )}
          {tab === 'books' && (
            <div className="books-page">
              <h1>Your books</h1>
              <BookSearch onAdd={handleAddBook} />
              <ul className="book-list">
                {books.map((b) => (
                  <li key={b.id}>
                    <span>
                      {b.title} {b.author ? `— ${b.author}` : ''} ({b.page_count} pages) — {b.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'settings' && <Settings settings={settings} books={books} onSave={handleSaveSettings} />}
        </>
      ) : null}
    </div>
  )
}

export default App
