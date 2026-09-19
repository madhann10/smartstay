import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {

    event.preventDefault();

    // Later connect this to backend authentication.

    navigate("/dashboard");

  }


  return (

    <div className="auth-page">

      {/* LEFT */}

      <div className="auth-brand">

        <div className="brand-logo">
          🏨 Smart<span>Stay</span>
        </div>


        <div className="brand-content">

          <p>
            AI-POWERED HOTEL BOOKING
          </p>

          <h1>
            Book smarter.
            <br />
            Pay the right price.
          </h1>

          <p>
            Discover hotels, compare rooms and
            understand how AI-powered dynamic pricing
            determines your room rate.
          </p>

        </div>


        <div className="login-statistics">

          <div>
            <strong>
              ₹3,779
            </strong>

            <span>
              Avg. Base Price
            </span>
          </div>


          <div>
            <strong>
              55.6%
            </strong>

            <span>
              Avg. Demand
            </span>
          </div>


          <div>
            <strong>
              55.2%
            </strong>

            <span>
              Avg. Occupancy
            </span>
          </div>

        </div>

      </div>


      {/* RIGHT */}

      <div className="auth-container">

        <div className="auth-box">

          <h2>
            Welcome back
          </h2>

          <p className="auth-subtitle">
            Sign in to manage your bookings and
            explore live room prices.
          </p>


          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
              />

            </div>


            <div className="form-group">

              <div className="password-label">

                <label>
                  Password
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>

              </div>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
              />

            </div>


            <label className="terms">

              <input
                type="checkbox"
                defaultChecked
              />

              <span>
                Keep me signed in
              </span>

            </label>


            <button
              type="submit"
              className="auth-button"
            >
              Sign In
            </button>

          </form>


          <p className="auth-footer">

            New to SmartStay?

            {" "}

            <Link to="/register">
              Create an account
            </Link>

          </p>

        </div>

      </div>

    </div>

  );
}