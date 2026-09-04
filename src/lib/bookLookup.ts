import type { BookSource } from './types'

export interface BookLookupResult {
  title: string
  author: string | null
  pageCount: number | null
  coverUrl: string | null
  source: BookSource
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo?: {
      title?: string
      authors?: string[]
      pageCount?: number
      imageLinks?: { thumbnail?: string }
    }
  }>
}

interface OpenLibraryResponse {
  docs?: Array<{
    title?: string
    author_name?: string[]
    number_of_pages_median?: number
    cover_i?: number
  }>
}

async function searchGoogleBooks(query: string): Promise<BookLookupResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`
  const res = await fetch(url)
  if (!res.ok) return []
  const data: GoogleBooksResponse = await res.json()
  return (data.items ?? []).map((item) => ({
    title: item.volumeInfo?.title ?? 'Untitled',
    author: item.volumeInfo?.authors?.join(', ') ?? null,
    pageCount: item.volumeInfo?.pageCount ?? null,
    coverUrl: item.volumeInfo?.imageLinks?.thumbnail ?? null,
    source: 'google-books' as const,
  }))
}

async function searchOpenLibrary(query: string): Promise<BookLookupResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`
  const res = await fetch(url)
  if (!res.ok) return []
  const data: OpenLibraryResponse = await res.json()
  return (data.docs ?? []).map((doc) => ({
    title: doc.title ?? 'Untitled',
    author: doc.author_name?.join(', ') ?? null,
    pageCount: doc.number_of_pages_median ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    source: 'open-library' as const,
  }))
}

/**
 * Tries Google Books first, then Open Library if Google Books returns nothing.
 * Callers should still offer a manual-entry fallback in the UI for results
 * with a null pageCount, or when both sources return empty.
 */
export async function searchBooks(query: string): Promise<BookLookupResult[]> {
  if (!query.trim()) return []

  const googleResults = await searchGoogleBooks(query).catch(() => [])
  if (googleResults.length > 0) return googleResults

  return searchOpenLibrary(query).catch(() => [])
}
