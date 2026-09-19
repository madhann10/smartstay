import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">

      {/* LOGO */}

      <Link
        to="/dashboard"
        className="navbar-logo"
      >
        <div className="logo-icon">
          🏨
        </div>

        <div>
          <span className="logo-dark">
            Smart
          </span>

          <span className="logo-gold">
            Stay
          </span>
        </div>
      </Link>


      {/* NAVIGATION */}

      <nav className="navbar-links">

        {/* HOME */}

        <NavLink
          to="/dashboard"
          end
        >
          Home
        </NavLink>


        {/* HOTELS */}

        <NavLink
          to="/hotels"
        >
          Hotels
        </NavLink>


        {/* DYNAMIC PRICING */}

        <NavLink
          to="/dynamic-pricing"
        >
          Dynamic Pricing
        </NavLink>


        {/* FEATURES */}

        <a
          href="/dashboard#features"
        >
          Features
        </a>

      </nav>


      {/* RIGHT SIDE */}

      <div className="navbar-actions">

        <Link
          to="/login"
          className="nav-login"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="nav-register"
        >
          Book Now
        </Link>

      </div>

    </header>
  );
}