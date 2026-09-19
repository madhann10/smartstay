import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Guest"
  });

  const [error, setError] = useState("");

  function handleChange(event) {

    setForm({
      ...form,
      [event.target.name]: event.target.value
    });

  }


  function handleSubmit(event) {

    event.preventDefault();

    setError("");


    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.password
    ) {

      setError(
        "Please fill in all required fields."
      );

      return;
    }


    if (
      form.password !==
      form.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    /*
      Later connect this to:

      POST /api/auth/register
    */


    localStorage.setItem(
      "hotelUser",
      JSON.stringify(form)
    );


    navigate("/create-account");

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
            SMART HOTEL BOOKING
          </p>

          <h1>
            Your stay.
            <br />
            Your comfort.
            <br />
            Your smart price.
          </h1>

          <p>
            Create an account and discover hotels
            with intelligent pricing and seamless
            booking.
          </p>

        </div>


        <div className="brand-bottom">

          AI Pricing • Online Booking •
          Room Management

        </div>

      </div>


      {/* RIGHT */}

      <div className="auth-container">

        <div className="auth-box">

          <Link
            to="/login"
            className="back-link"
          >
            ← Back to login
          </Link>


          <h2>
            Create your account
          </h2>

          <p className="auth-subtitle">
            Register to start booking smarter.
          </p>


          {error && (

            <div className="form-error">
              {error}
            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            <div className="form-group">

              <label>
                Full Name
              </label>

              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

            </div>


            <div className="form-row">

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

              </div>


              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Account Type
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >

                <option value="Guest">
                  Guest
                </option>

                <option value="Receptionist">
                  Receptionist
                </option>

                <option value="Hotel Manager">
                  Hotel Manager
                </option>

              </select>

            </div>


            <div className="form-row">

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create password"
                />

              </div>


              <div className="form-group">

                <label>
                  Confirm Password
                </label>

                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />

              </div>

            </div>


            <label className="terms">

              <input
                type="checkbox"
                required
              />

              <span>
                I agree to the Terms & Conditions
                and Privacy Policy.
              </span>

            </label>


            <button
              type="submit"
              className="auth-button"
            >
              Create Account
            </button>

          </form>


          <p className="auth-footer">

            Already have an account?

            {" "}

            <Link to="/login">
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>

  );
}