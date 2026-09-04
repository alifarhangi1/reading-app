import { supabase } from './supabase'
import type { Book, ScreenTimeEntry, Settings, TrackedApp } from './types'

export async function fetchSettings(userId: string): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data) return data as Settings

  const defaults: Settings = {
    user_id: userId,
    start_date: new Date().toISOString().slice(0, 10),
    default_minutes_per_page: 2.0,
    active_book_id: null,
  }
  const { data: inserted, error: insertError } = await supabase.from('settings').insert(defaults).select().single()
  if (insertError) throw insertError
  return inserted as Settings
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const { data, error } = await supabase.from('settings').update(settings).eq('user_id', settings.user_id).select().single()
  if (error) throw error
  return data as Settings
}

export async function fetchBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: true })
  if (error) throw error
  return data as Book[]
}

export async function addBook(book: Omit<Book, 'id' | 'added_at' | 'finished_at'>): Promise<Book> {
  const { data, error } = await supabase.from('books').insert(book).select().single()
  if (error) throw error
  return data as Book
}

export async function finishBook(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', bookId)
  if (error) throw error
}

export async function setActiveBook(bookId: string | null): Promise<void> {
  if (bookId) {
    const { error: activateError } = await supabase.from('books').update({ status: 'active' }).eq('id', bookId)
    if (activateError) throw activateError
  }
}

export async function fetchEntries(userId: string): Promise<ScreenTimeEntry[]> {
  const { data, error } = await supabase
    .from('screen_time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data as ScreenTimeEntry[]
}

export async function upsertEntry(entry: {
  user_id: string
  date: string
  app: TrackedApp
  minutes: number
  active_book_id_at_entry: string | null
}): Promise<void> {
  const { error } = await supabase.from('screen_time_entries').upsert(entry, { onConflict: 'user_id,date,app' })
  if (error) throw error
}
