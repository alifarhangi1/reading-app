import { useState } from 'react'

interface Props {
  title: string
  author: string | null
  coverUrl: string | null
  pageCount: number
}

/** The cover tilted over a striped shelf block, per the W1/M1 wireframe. */
export function BookCover({ title, author, coverUrl, pageCount }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = coverUrl && !imgFailed

  return (
    <div className="book-figure">
      <div className="book-figure-stage">
        <div className="book-figure-shelf" />
        <div className="book-cover">
          {showImage ? (
            <img src={coverUrl} alt={`Cover of ${title}`} onError={() => setImgFailed(true)} />
          ) : (
            <div className="book-cover-fallback">
              <span className="book-cover-title">{title}</span>
              <span className="book-cover-rule" aria-hidden="true" />
              {author && <span className="book-cover-author">{author}</span>}
            </div>
          )}
        </div>
      </div>
      <span className="book-figure-pages">{pageCount} pp</span>
    </div>
  )
}
