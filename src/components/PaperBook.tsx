/*
 * The illustrated book used on the logged-out pages and while loading — a
 * generic paper card, distinct from BookCover which shows a real cover.
 * `inked` drives the loading skeleton: lines ink in top-to-bottom, one per
 * completed request, so the book is drawn by the arriving data (spec 6a).
 */
interface Props {
  label?: string
  inked?: number
  shimmer?: boolean
  dashed?: boolean
}

const LINES = ['title', 'title-short', 'body', 'body', 'body-short'] as const

export function PaperBook({ label, inked = LINES.length, shimmer = false, dashed = false }: Props) {
  return (
    <div className={`paper-book${dashed ? ' is-dashed' : ''}`}>
      <div className="paper-book-card">
        {shimmer && <span className="paper-book-shimmer" aria-hidden="true" />}
        {dashed ? (
          <span className="paper-book-empty">{label}</span>
        ) : (
          <>
            <div className="paper-book-lines" aria-hidden="true">
              {LINES.map((kind, i) => (
                <span key={i} className={`paper-line is-${kind}${i < inked ? ' is-inked' : ''}`} />
              ))}
            </div>
            {label && <span className="paper-book-label">{label}</span>}
          </>
        )}
      </div>
    </div>
  )
}
