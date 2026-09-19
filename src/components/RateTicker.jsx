const FACTORS = [
  {
    label: 'Average base price',
    value: '₹3,779'
  },
  {
    label: 'Average demand',
    value: '55.6%'
  },
  {
    label: 'Average occupancy',
    value: '55.2%'
  },
  {
    label: 'Average hotel rating',
    value: '4.0 / 5'
  }
];

export default function RateTicker() {

  return (
    <div className="rate-ticker">

      <p className="rate-ticker__label">
        Pricing Model Snapshot
      </p>

      <ul className="rate-ticker__list">

        {FACTORS.map((factor) => (

          <li
            key={factor.label}
            className="rate-ticker__row"
          >

            <span className="rate-ticker__room">
              {factor.label}
            </span>

            <span className="rate-ticker__rate">
              {factor.value}
            </span>

          </li>

        ))}

      </ul>

      <p className="rate-ticker__note">
        AI predicts room prices using demand, occupancy,
        weekend, season, lead days and hotel rating.
      </p>

    </div>
  );
}