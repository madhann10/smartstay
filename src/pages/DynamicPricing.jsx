import { useEffect, useState } from 'react';

export default function DynamicPricing() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkInDate, setCheckInDate] = useState('');

  // Fetch hotels from backend
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const cleanBase = apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
        const response = await fetch(`${cleanBase}/hotels`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch hotels'
          );
        }

        setHotels(data.hotels || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHotels();
  }, []);

  // Handle hotel selection
  const handleHotelChange = (e) => {
    const hotelId = e.target.value;

    setSelectedHotel(hotelId);
    setSelectedRoom('');
    setResult(null);
    setError('');
  };

  // Find selected hotel
  const hotel = hotels.find(
    (hotel) => hotel._id === selectedHotel
  );

  // Get dynamic price
  const getDynamicPrice = async () => {
    if (!selectedHotel || !selectedRoom || !checkInDate) {
  setError('Please select a hotel, room and check-in date.');
  return;
}

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const cleanBase = apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
      const response = await fetch(
        `${cleanBase}/pricing/predict-room`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
  hotelId: selectedHotel,
  roomNumber: selectedRoom,
  checkInDate: checkInDate,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Price prediction failed'
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Price change calculations
  const priceDifference = result
    ? result.pricing.dynamicPrice -
      result.pricing.basePrice
    : 0;

  const percentageChange = result
    ? (priceDifference /
        result.pricing.basePrice) *
      100
    : 0;

  return (
    <div className="pricing-page">
      <div className="pricing-container">

        {/* Header */}
        <div className="pricing-header">
          <h1>🏨 Dynamic Hotel Pricing</h1>

          <p>
            AI-powered room price prediction
          </p>
        </div>

        {/* Selection Form */}
        <div className="pricing-form">

          {/* Hotel */}
          <div className="form-group">
            <label>Select Hotel</label>

            <select
              value={selectedHotel}
              onChange={handleHotelChange}
            >
              <option value="">
                -- Select Hotel --
              </option>

              {hotels.map((hotel) => (
                <option
                  key={hotel._id}
                  value={hotel._id}
                >
                  {hotel.name} -{' '}
                  {hotel.location?.city}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          {hotel && (
            <div className="form-group">
              <label>Select Room</label>

              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setResult(null);
                  setError('');
                }}
              >
                <option value="">
                  -- Select Room --
                </option>

                {hotel.rooms?.map((room) => (
                  <option
                    key={room._id}
                    value={room.roomNumber}
                  >
                    Room {room.roomNumber} -{' '}
                    {room.type} - ₹
                    {room.basePrice}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
  <label>Check-in Date</label>

  <input
    type="date"
    value={checkInDate}
    min={new Date().toISOString().split('T')[0]}
    onChange={(e) => {
      setCheckInDate(e.target.value);
      setResult(null);
      setError('');
    }}
  />
</div>

          {/* Button */}
          <button
            className="pricing-button"
            onClick={getDynamicPrice}
            disabled={loading}
          >
            {loading
              ? 'Calculating...'
              : '✨ Calculate Dynamic Price'}
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="result-card">

            {/* Hotel information */}
            <div className="hotel-title">
              <h2>{result.hotel}</h2>

              <p>
                {result.room.type} Room •{' '}
                {result.room.roomNumber}
              </p>
            </div>

            {/* Prices */}
            <div className="price-section">

              <div className="price-box">
                <span>Base Price</span>

                <strong>
                  ₹{result.pricing.basePrice}
                </strong>
              </div>

              <div className="price-box dynamic">
                <span>AI Dynamic Price</span>

                <strong>
                  ₹{result.pricing.dynamicPrice}
                </strong>
              </div>

            </div>

            {/* Price Explanation */}
            <div className="price-explanation">

              {priceDifference > 0 ? (
                <>
                  <strong>
                    📈 Price increased by ₹
                    {priceDifference.toFixed(2)}
                  </strong>

                  <p>
                    The AI model adjusted the price
                    based on demand, occupancy,
                    season, weekend conditions,
                    hotel rating and booking lead
                    time.
                  </p>

                  <span>
                    Increase:{' '}
                    {percentageChange.toFixed(1)}%
                  </span>
                </>
              ) : priceDifference < 0 ? (
                <>
                  <strong>
                    📉 Price decreased by ₹
                    {Math.abs(
                      priceDifference
                    ).toFixed(2)}
                  </strong>

                  <p>
                    Lower demand and occupancy
                    contributed to the reduced
                    dynamic price.
                  </p>

                  <span>
                    Decrease:{' '}
                    {Math.abs(
                      percentageChange
                    ).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <strong>
                    ➡️ Price remains unchanged
                  </strong>

                  <p>
                    The AI model recommends the
                    current base price.
                  </p>
                </>
              )}

            </div>

            {/* Pricing Factors */}
            <h3>📊 Pricing Factors</h3>

            <div className="factors-grid">

              <div className="factor">
                <span>📈 Demand</span>
                <strong>
                  {result.factors.demand}%
                </strong>
              </div>

              <div className="factor">
                <span>🏨 Occupancy</span>
                <strong>
                  {result.factors.occupancy}%
                </strong>
              </div>

              <div className="factor">
                <span>⭐ Rating</span>
                <strong>
                  {result.factors.rating}
                </strong>
              </div>

              <div className="factor">
                <span>📅 Weekend</span>
                <strong>
                  {result.factors.weekend
                    ? 'Yes'
                    : 'No'}
                </strong>
              </div>

              <div className="factor">
                <span>🌤️ Season</span>
                <strong>
                  {result.factors.season}
                </strong>
              </div>

              <div className="factor">
                <span>🕒 Lead Days</span>
                <strong>
                  {result.factors.leadDays}
                </strong>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}