import { useState } from 'react'
import type { FormEvent } from 'react'
import { searchBooks } from '../lib/bookLookup'
import type { BookLookupResult } from '../lib/bookLookup'
import type { BookSource } from '../lib/types'

interface Props {
  onAdd: (book: {
    title: string
    author: string | null
    page_count: number
    source: BookSource
    cover_url: string | null
  }) => Promise<void>
}

export function BookSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookLookupResult[]>([])
  const [searching, setSearching] = useState(false)
  const [manual, setManual] = useState<{ title: string; author: string; source: BookSource; coverUrl: string | null } | null>(null)
  const [pageCountInput, setPageCountInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults(await searchBooks(query))
    setSearching(false)
  }

  async function pickResult(result: BookLookupResult) {
    if (result.pageCount) {
      setSubmitting(true)
      await onAdd({
        title: result.title,
        author: result.author,
        page_count: result.pageCount,
        source: result.source,
        cover_url: result.coverUrl,
      })
      setSubmitting(false)
      resetForm()
      return
    }
    // No page count found — fall through to manual entry, pre-filled.
    setManual({ title: result.title, author: result.author ?? '', source: result.source, coverUrl: result.coverUrl })
  }

  function startManualEntry() {
    setManual({ title: query, author: '', source: 'manual', coverUrl: null })
  }

  async function submitManual(e: FormEvent) {
    e.preventDefault()
    if (!manual) return
    const pageCount = parseInt(pageCountInput, 10)
    if (!pageCount || pageCount <= 0) return
    setSubmitting(true)
    await onAdd({
      title: manual.title,
      author: manual.author || null,
      page_count: pageCount,
      source: manual.source === 'manual' ? 'manual' : manual.source,
      cover_url: manual.coverUrl,
    })
    setSubmitting(false)
    resetForm()
  }

  function resetForm() {
    setQuery('')
    setResults([])
    setManual(null)
    setPageCountInput('')
  }

  if (manual) {
    return (
      <form className="book-manual-form" onSubmit={submitManual}>
        <p>
          {manual.title !== '' ? `Add "${manual.title}"` : 'Add a book manually'} — enter its page count
          {manual.author ? ` (${manual.author})` : ''}:
        </p>
        <label>
          Title
          <input
            value={manual.title}
            onChange={(e) => setManual({ ...manual, title: e.target.value })}
            required
          />
        </label>
        <label>
          Author
          <input value={manual.author} onChange={(e) => setManual({ ...manual, author: e.target.value })} />
        </label>
        <label>
          Page count
          <input
            type="number"
            min={1}
            required
            value={pageCountInput}
            onChange={(e) => setPageCountInput(e.target.value)}
          />
        </label>
        <div className="row">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add book'}
          </button>
          <button type="button" onClick={() => setManual(null)}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="book-search">
      <form onSubmit={handleSearch}>
        <input
          placeholder="Search for a book title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="book-results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pickResult(r)} disabled={submitting}>
                {r.coverUrl && <img src={r.coverUrl} alt="" />}
                <span>
                  <strong>{r.title}</strong>
                  {r.author && <span> — {r.author}</span>}
                  {r.pageCount ? <span> ({r.pageCount} pages)</span> : <span className="muted"> (page count unknown)</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {results.length === 0 && !searching && query && <p className="muted">No results yet — try Search, or enter it manually.</p>}

      <button type="button" className="link-button" onClick={startManualEntry}>
        Enter a book manually instead
      </button>
    </div>
  )
}
