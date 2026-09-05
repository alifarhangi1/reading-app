import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PaperBook } from './PaperBook'
import { formatHm } from '../lib/calculations'

/*
 * Pace used only for the landing-page illustration. The wireframe's own numbers
 * (2h40m -> 64 pages) imply 24 pages/hour; its SPEC note reads "time / 30 min x
 * 24 pages", which would give 128 for the same input. Following the drawn value,
 * since the daily-log wireframes show 64 for 2h40m too.
 */
const DEMO_PAGES_PER_HOUR = 24

/*
 * The SPEC asks for 15-minute steps AND a 2h40m default, which can't both hold:
 * 160 isn't a multiple of 15, so the handle would snap to 165 while the label
 * still read "2h 40m". Stepping by 10 keeps the drawn default reachable, since
 * 2h40m -> 64 pages is the number repeated across the other wireframes too.
 */
const STEP_MINUTES = 10
const MAX_MINUTES = 8 * 60
const DEFAULT_MINUTES = 160

function pagesFor(minutes: number): number {
  return Math.round((minutes / 60) * DEMO_PAGES_PER_HOUR)
}

export function Landing() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES)

  return (
    <div className="marketing">
      <header className="marketing-header">
        <Link to="/signin">log in</Link>
      </header>

      <div className="marketing-body">
        <div className="marketing-figure">
          <PaperBook label="502 pp" />
        </div>

        <div className="marketing-content">
          <h1 className="landing-headline">
            <span className="dashed-value">{formatHm(minutes)}</span> of scrolling is{' '}
            <span className="dashed-value">{pagesFor(minutes)} pages</span> of your book.
          </h1>

          <p className="landing-sub">
            Log your social media time once a day. See the pages you read against the pages you could
            have.
          </p>

          <div className="slider-card">
            <span className="slider-value">{formatHm(minutes)}</span>
            <input
              type="range"
              className="slider"
              min={0}
              max={MAX_MINUTES}
              step={STEP_MINUTES}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              aria-label="Time spent scrolling per day"
              aria-valuetext={formatHm(minutes)}
              style={{ ['--fill' as string]: `${(minutes / MAX_MINUTES) * 100}%` }}
            />
            <div className="slider-ticks">
              <span>0 h</span>
              <span>4 h</span>
              <span>8 h</span>
            </div>
          </div>

          <Link to="/join" className="button-link">
            start tracking
          </Link>
        </div>
      </div>
    </div>
  )
}
