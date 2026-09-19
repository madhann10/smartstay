import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Hotels() {
  const [searchParams] = useSearchParams();

  const city = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "1";

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError("");

      try {
        const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const cleanBase = apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
        let url = `${cleanBase}/hotels`;

        if (city.trim()) {
          url += `?city=${encodeURIComponent(city.trim())}`;
        }

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load hotels"
          );
        }

        setHotels(data.hotels || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [city]);

  return (
    <>
      <Navbar />

      <main className="hotels-page">

        <section className="hotels-header">

          <p className="hero-small">
            SMARTSTAY
          </p>

          <h1>
            {city
              ? `Hotels in ${city}`
              : "Hotels from our database"}
          </h1>

          {(checkIn || checkOut) && (
            <p>
              {checkIn && `Check-in: ${checkIn}`}
              {checkIn && checkOut && " • "}
              {checkOut && `Check-out: ${checkOut}`}
              {" • "}
              {guests} guest
              {guests !== "1" ? "s" : ""}
            </p>
          )}

        </section>

        <section className="hotel-results">

          {loading && (
            <div className="hotel-message">
              Loading hotels from database...
            </div>
          )}

          {error && (
            <div className="hotel-message hotel-error">
              <strong>Error:</strong> {error}
              <br />
              Make sure your backend server is running
              on port 5000.
            </div>
          )}

          {!loading &&
            !error &&
            hotels.length === 0 && (
              <div className="hotel-message">
                No hotels found
                {city ? ` in ${city}` : ""}.
              </div>
            )}

          {!loading &&
            !error &&
            hotels.length > 0 && (

              <div className="hotel-grid">

                {hotels.map((hotel) => (

                  <HotelCard
                    key={hotel._id}
                    hotel={hotel}
                  />

                ))}

              </div>

            )}

        </section>

      </main>
    </>
  );
}


function HotelCard({ hotel }) {

  const rooms = hotel.rooms || [];

  const availableRooms = rooms.filter(
    (room) => room.isAvailable !== false
  );

  const lowestPrice =
    rooms.length > 0
      ? Math.min(
          ...rooms.map((room) =>
            Number(room.basePrice)
          )
        )
      : null;

  return (
    <article className="hotel-card">

      {/* HOTEL IMAGE */}

      {hotel.images?.length > 0 ? (

        <img
          src={hotel.images[0]}
          alt={hotel.name}
          className="hotel-card-image"
        />

      ) : (

        <div className="hotel-card-image hotel-no-image">
          🏨
        </div>

      )}

      {/* HOTEL INFORMATION */}

      <div className="hotel-card-content">

        <div className="hotel-card-top">

          <div>

            <h2>
              {hotel.name}
            </h2>

            <p className="hotel-location">
              📍 {hotel.location?.city}
            </p>

          </div>

          {hotel.rating && (
            <span className="hotel-rating">
              ⭐ {hotel.rating}
            </span>
          )}

        </div>


        {/* PRICE FROM DATABASE */}

        {lowestPrice !== null && (

          <div className="hotel-price">

            <span>
              Starting from
            </span>

            <strong>
              ₹{lowestPrice.toLocaleString("en-IN")}
            </strong>

            <small>
              / night
            </small>

          </div>

        )}


        {/* ROOM TYPES */}

        <div className="hotel-rooms">

          {availableRooms.length > 0 ? (

            availableRooms.map((room) => (

              <div
                className="room-row"
                key={room._id}
              >

                <div>
                  <strong>
                    {room.type}
                  </strong>

                  <span>
                    Room {room.roomNumber}
                  </span>
                </div>

                <strong>
                  ₹{Number(room.basePrice).toLocaleString("en-IN")}
                </strong>

              </div>

            ))

          ) : (

            <p>
              No available rooms
            </p>

          )}

        </div>

      </div>

    </article>
  );
}