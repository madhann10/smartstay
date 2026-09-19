import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateAccount() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    city: "",
    preferredRoom: "Deluxe Room",
    guests: "2",
    purpose: "Leisure",
    notifications: true
  });


  function handleChange(event) {

    const { name, value, type, checked } =
      event.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value
    });

  }


  function handleSubmit(event) {

    event.preventDefault();


    localStorage.setItem(
      "hotelPreferences",
      JSON.stringify(form)
    );


    navigate("/dashboard");

  }


  return (

    <div className="account-page">

      <div className="account-card">

        <div className="account-icon">
          🏨
        </div>


        <p className="section-label">
          ONE LAST STEP
        </p>


        <h1>
          Set up your
          <br />
          hotel preferences
        </h1>


        <p className="account-description">
          Tell us a little about your stay preferences.
          This helps us provide better hotel recommendations
          and pricing information.
        </p>


        <form
          onSubmit={handleSubmit}
          className="account-form"
        >

          {/* CITY */}

          <div className="form-group">

            <label>
              Preferred City
            </label>

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Example: Bengaluru"
              required
            />

          </div>


          {/* ROOM */}

          <div className="form-group">

            <label>
              Preferred Room
            </label>

            <select
              name="preferredRoom"
              value={form.preferredRoom}
              onChange={handleChange}
            >

              <option>
                Standard Room
              </option>

              <option>
                Deluxe Room
              </option>

              <option>
                Executive Room
              </option>

              <option>
                Suite
              </option>

            </select>

          </div>


          {/* GUESTS */}

          <div className="form-group">

            <label>
              Number of Guests
            </label>

            <select
              name="guests"
              value={form.guests}
              onChange={handleChange}
            >

              <option value="1">
                1 Guest
              </option>

              <option value="2">
                2 Guests
              </option>

              <option value="3">
                3 Guests
              </option>

              <option value="4">
                4 Guests
              </option>

              <option value="5+">
                5+ Guests
              </option>

            </select>

          </div>


          {/* PURPOSE */}

          <div className="form-group">

            <label>
              Purpose of Stay
            </label>

            <div className="purpose-options">

              <label>

                <input
                  type="radio"
                  name="purpose"
                  value="Leisure"
                  checked={
                    form.purpose === "Leisure"
                  }
                  onChange={handleChange}
                />

                Leisure

              </label>


              <label>

                <input
                  type="radio"
                  name="purpose"
                  value="Business"
                  checked={
                    form.purpose === "Business"
                  }
                  onChange={handleChange}
                />

                Business

              </label>


              <label>

                <input
                  type="radio"
                  name="purpose"
                  value="Family"
                  checked={
                    form.purpose === "Family"
                  }
                  onChange={handleChange}
                />

                Family

              </label>

            </div>

          </div>


          {/* NOTIFICATIONS */}

          <label className="terms">

            <input
              type="checkbox"
              name="notifications"
              checked={form.notifications}
              onChange={handleChange}
            />

            <span>
              Send me updates about bookings,
              room availability and price changes.
            </span>

          </label>


          <button
            className="auth-button"
            type="submit"
          >
            Complete Account Setup →
          </button>

        </form>

      </div>

    </div>

  );
}