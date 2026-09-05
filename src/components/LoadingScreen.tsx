import { useEffect, useState } from 'react'
import { PaperBook } from './PaperBook'

interface Props {
  /** Completed requests. Drives both the bar and the skeleton ink-in. */
  loaded: number
  /** Total expected requests, or null when unknown (bar then holds at 90%). */
  total: number | null
  variant?: 'shelf' | 'setup'
  onRetry?: () => void
}

const NEARLY_MS = 4000
const SLOW_MS = 10000

export function LoadingScreen({ loaded, total, variant = 'shelf', onRetry }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const nearly = window.setTimeout(() => setElapsed(NEARLY_MS), NEARLY_MS)
    const slow = window.setTimeout(() => setElapsed(SLOW_MS), SLOW_MS)
    return () => {
      window.clearTimeout(nearly)
      window.clearTimeout(slow)
    }
  }, [])

  // Tracks real work, never a timer. Monotonic because `loaded` only ever
  // increases (App clamps it with Math.max) and `total` is fixed — so the bar
  // can't reverse. Floors at 4%, caps at 96% so it never sits at 100% before
  // the app navigates; an unknown total holds at 90%.
  const progress = total ? Math.min(96, Math.max(4, (loaded / total) * 100)) : 90

  const isSlow = elapsed >= SLOW_MS
  const isSetup = variant === 'setup'

  const status = isSetup
    ? 'setting up your shelf…'
    : elapsed >= NEARLY_MS
      ? 'nearly there…'
      : 'counting your pages…'

  return (
    <div className="loading-screen">
      <PaperBook
        label={isSetup ? 'no book yet' : undefined}
        inked={loaded}
        shimmer
        dashed={isSetup}
      />

      <div className="loading-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="loading-status" aria-live="polite">
        {status}
      </p>
      {isSetup && <p className="loading-hint">next: pick the book you're reading</p>}

      {isSlow && !isSetup && (
        <div className="loading-slow">
          <p>Still counting. Your connection's slow.</p>
          <div className="row">
            <button type="button" onClick={onRetry}>
              try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
