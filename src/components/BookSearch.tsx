import { useState } from 'react'
import type { FormEvent } from 'react'
import { searchBooks } from '../lib/bookLookup'
import type { BookLookupResult } from '../lib/bookLookup'
import type { BookSource, NewBookInput } from '../lib/types'

interface Props {
  onAdd: (book: NewBookInput) => Promise<void>
}

interface Candidate {
  title: string
  author: string
  pageCount: string
  coverUrl: string | null
  source: BookSource
}

type Progress = 'start' | 'in-progress'

export function BookSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookLookupResult[]>([])
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [progress, setProgress] = useState<Progress>('start')
  const [currentPageInput, setCurrentPageInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults(await searchBooks(query))
    setSearching(false)
  }

  function pickResult(result: BookLookupResult) {
    setCandidate({
      title: result.title,
      author: result.author ?? '',
      pageCount: result.pageCount ? String(result.pageCount) : '',
      coverUrl: result.coverUrl,
      source: result.source,
    })
    setProgress('start')
    setCurrentPageInput('')
  }

  function startManualEntry() {
    setCandidate({ title: query, author: '', pageCount: '', coverUrl: null, source: 'manual' })
    setProgress('start')
    setCurrentPageInput('')
  }

  async function submitCandidate(e: FormEvent) {
    e.preventDefault()
    if (!candidate) return
    const pageCount = parseInt(candidate.pageCount, 10)
    if (!pageCount || pageCount <= 0) return

    const rawStartingPage = progress === 'in-progress' ? parseInt(currentPageInput, 10) || 0 : 0
    const startingPage = Math.max(0, Math.min(rawStartingPage, pageCount))

    setSubmitting(true)
    await onAdd({
      title: candidate.title,
      author: candidate.author || null,
      page_count: pageCount,
      starting_page: startingPage,
      source: candidate.source,
      cover_url: candidate.coverUrl,
    })
    setSubmitting(false)
    resetForm()
  }

  function resetForm() {
    setQuery('')
    setResults([])
    setCandidate(null)
    setProgress('start')
    setCurrentPageInput('')
  }

  if (candidate) {
    return (
      <form className="book-search" onSubmit={submitCandidate}>
        <label>
          Title
          <input
            value={candidate.title}
            onChange={(e) => setCandidate({ ...candidate, title: e.target.value })}
            required
          />
        </label>
        <label>
          Author
          <input value={candidate.author} onChange={(e) => setCandidate({ ...candidate, author: e.target.value })} />
        </label>
        <label>
          Page count
          <input
            type="number"
            min={1}
            required
            value={candidate.pageCount}
            onChange={(e) => setCandidate({ ...candidate, pageCount: e.target.value })}
          />
        </label>

        <fieldset>
          <legend>Where are you starting?</legend>
          <label className="radio-option">
            <input
              type="radio"
              name="progress"
              checked={progress === 'start'}
              onChange={() => setProgress('start')}
            />
            Starting from the beginning
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="progress"
              checked={progress === 'in-progress'}
              onChange={() => setProgress('in-progress')}
            />
            Already partway through
          </label>
        </fieldset>

        {progress === 'in-progress' && (
          <label>
            What page are you on?
            <input
              type="number"
              min={1}
              value={currentPageInput}
              onChange={(e) => setCurrentPageInput(e.target.value)}
            />
          </label>
        )}

        <div className="row">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add book'}
          </button>
          <button type="button" className="button-outline" onClick={() => setCandidate(null)}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="book-search">
      <form className="search-row" onSubmit={handleSearch}>
        <input
          placeholder="Search for a book title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="book-results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pickResult(r)}>
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
