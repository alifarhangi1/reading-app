import { AuthForm } from './AuthForm'

export function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <h1>How many pages could you have read instead?</h1>
        <p>
          Log your time on TikTok, Instagram, and YouTube. Pick a book. Watch your
          scrolling turn into the pages you could've read instead.
        </p>
      </section>
      <AuthForm />
    </div>
  )
}
