import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HotelHero() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("city", location.trim());
    }

    if (checkIn) {
      params.set("checkIn", checkIn);
    }

    if (checkOut) {
      params.set("checkOut", checkOut);
    }

    if (guests) {
      params.set("guests", guests);
    }

    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <section className="hotel-hero">
      <div className="hero-overlay"></div>

      <div className="hero-content">

        <p className="hero-small">
          WELCOME TO SMARTSTAY
        </p>

        <h1>
          A smarter place to
          <br />
          stay on your next journey
        </h1>

        <p className="hero-description">
          Find hotels and rooms using the locations and
          prices available in our database.
        </p>

        <form
          className="hotel-search"
          onSubmit={handleSearch}
        >

          {/* LOCATION */}
          <div className="search-field">
            <label>LOCATION</label>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city or hotel"
            />
          </div>

          {/* CHECK IN */}
          <div className="search-field">
            <label>CHECK IN</label>

            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          {/* CHECK OUT */}
          <div className="search-field">
            <label>CHECK OUT</label>

            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          {/* GUESTS */}
          <div className="search-field">
            <label>GUESTS</label>

            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
            </select>
          </div>

          <button
            type="submit"
            className="search-button"
          >
            Search
          </button>

        </form>

      </div>
    </section>
  );
}