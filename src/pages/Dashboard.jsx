import Navbar from "../components/Navbar";
import HotelHero from "../components/HotelHero";
import FeatureCard from "../components/FeatureCard";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="hotel-page">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <HotelHero />

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="features-section"
      >

        <div className="section-heading">

          <p>OUR ADVANTAGES</p>

          <h2>
            Everything you need for
            smarter hotel booking
          </h2>

        </div>


        <div className="features-grid">

          <FeatureCard
            icon="🏨"
            title="Online Booking"
            description="Search hotels, select rooms and book your stay online with ease."
          />


          <FeatureCard
            icon="🧑‍💼"
            title="Receptionist Panel"
            description="Manage guest check-ins, room availability and offline bookings."
          />


          <FeatureCard
            icon="🛏️"
            title="Room Distribution"
            description="Track room availability and allocate rooms efficiently."
          />


          <FeatureCard
            icon="📈"
            title="Dynamic Pricing"
            description="AI predicts optimal room prices based on demand and occupancy."
          />

        </div>

      </section>


      {/* DYNAMIC PRICING SECTION */}
      <section className="pricing-preview">

        <div className="pricing-text">

          <p className="section-label">
            AI-POWERED PRICING
          </p>


          <h2>
            The right price,
            <br />
            at the right time.
          </h2>


          <p>
            Our dynamic pricing model considers
            demand, occupancy, weekend patterns,
            season, lead days and hotel rating to
            recommend an optimal room price.
          </p>


          <Link
            to="/dynamic-pricing"
            className="gold-button"
          >
            Try Dynamic Pricing
          </Link>

        </div>


        {/* PRICE CARD */}
        <div className="pricing-card">

          <div className="pricing-card-header">

            <span>
              AI PRICE PREDICTION
            </span>

            <span>
              ● LIVE
            </span>

          </div>


          <h3>
            Deluxe Room
          </h3>


          <p className="hotel-name">
            SmartStay Hotel
          </p>


          <div className="price">

            ₹3,779

            <small>
              / night
            </small>

          </div>


          <div className="pricing-factors">

            <div>

              <span>
                Demand
              </span>

              <strong>
                55.6%
              </strong>

            </div>


            <div>

              <span>
                Occupancy
              </span>

              <strong>
                55.2%
              </strong>

            </div>


            <div>

              <span>
                Rating
              </span>

              <strong>
                4.0 ⭐
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="hotel-footer">

        <div>

          <strong>
            SmartStay
          </strong>

          <p>
            AI-powered hotel booking and
            dynamic pricing platform.
          </p>

        </div>


        <div>

          <p>
            © 2026 SmartStay
          </p>

        </div>

      </footer>

    </div>
  );
}