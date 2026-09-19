import RateTicker from './RateTicker.jsx';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">

      {/* LEFT SIDE */}
      <aside className="auth-hero">

        <div className="auth-hero__top">
          <div className="auth-hero__logo">
            🏨
          </div>

          <span className="auth-hero__wordmark">
            SmartStay
          </span>
        </div>

        <div className="auth-hero__body">

          <div className="auth-hero__eyebrow">
            AI-POWERED HOTEL BOOKING
          </div>

          <h1 className="auth-hero__headline">
            Book smarter.
            <br />
            Pay the right price.
          </h1>

          <p className="auth-hero__copy">
            Find the best rooms, compare hotel prices, and get
            AI-powered dynamic pricing based on demand,
            occupancy, season, weekends, lead time and hotel rating.
          </p>

          <RateTicker />

        </div>

        <p className="auth-hero__foot">
          Smart pricing • Real-time hotel data • Better booking decisions
        </p>

      </aside>

      {/* RIGHT SIDE */}
      <main className="auth-panel">

        <div className="auth-card">

          <h2 className="auth-card__title">
            {title}
          </h2>

          {subtitle && (
            <p className="auth-card__subtitle">
              {subtitle}
            </p>
          )}

          {children}

        </div>

      </main>

    </div>
  );
}