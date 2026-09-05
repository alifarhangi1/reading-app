import { AuthForm } from './AuthForm'

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <section className="landing-hero">
          <span className="brand">PAGE DEBT</span>
          <h1>How many pages could you have read instead?</h1>
          <p>
            Log the time your phone kept today. Pick a book. Watch the scrolling turn
            into the pages you could've read instead.
          </p>
        </section>
        <AuthForm />
      </div>
    </div>
  )
}
