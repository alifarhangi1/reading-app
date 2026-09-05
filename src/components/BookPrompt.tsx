import { BookSearch } from './BookSearch'
import type { Book, NewBookInput } from '../lib/types'

interface Props {
  finishedBook: Book
  queuedBooks: Book[]
  onPickExisting: (bookId: string) => Promise<void>
  onAddNew: (book: NewBookInput) => Promise<void>
  onSkip: () => Promise<void>
}

export function BookPrompt({ finishedBook, queuedBooks, onPickExisting, onAddNew, onSkip }: Props) {
  return (
    <div className="book-prompt">
      <h2>You've finished "{finishedBook.title}"!</h2>
      <p>Pick what's next, or skip for now and we'll keep tallying pages you could've read.</p>

      {queuedBooks.length > 0 && (
        <ul className="book-list">
          {queuedBooks.map((b) => (
            <li key={b.id}>
              <span>
                {b.title}
                {b.author ? ` — ${b.author}` : ''} ({b.page_count} pages)
              </span>
              <button type="button" className="link-button" onClick={() => onPickExisting(b.id)}>
                make active
              </button>
            </li>
          ))}
        </ul>
      )}

      <BookSearch onAdd={onAddNew} />

      <button type="button" className="link-button" onClick={onSkip}>
        Skip for now — keep tallying unattributed pages
      </button>
    </div>
  )
}
