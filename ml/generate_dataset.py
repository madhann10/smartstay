import pandas as pd
import numpy as np

# For reproducible results
np.random.seed(42)

# Number of records
n = 5000

# Generate basic hotel pricing data
base_price = np.random.randint(1500, 6001, n)

demand = np.random.randint(10, 101, n)

occupancy = np.random.randint(10, 101, n)

weekend = np.random.randint(0, 2, n)

season = np.random.randint(0, 3, n)

lead_days = np.random.randint(1, 61, n)

rating = np.round(
    np.random.uniform(3.0, 5.0, n),
    1
)

# Calculate dynamic price
# Demand effect
demand_effect = base_price * (demand / 100) * 0.25

# Occupancy effect
occupancy_effect = base_price * (occupancy / 100) * 0.20

# Weekend effect
weekend_effect = base_price * weekend * 0.10

# Season effect
season_effect = base_price * season * 0.12

# Early booking / last-minute effect
lead_effect = np.where(
    lead_days <= 7,
    base_price * 0.10,
    -base_price * 0.03
)

# Rating effect
rating_effect = base_price * ((rating - 3) / 2) * 0.05

# Random variation
noise = np.random.normal(0, 100, n)

# Final dynamic price
final_price = (
    base_price
    + demand_effect
    + occupancy_effect
    + weekend_effect
    + season_effect
    + lead_effect
    + rating_effect
    + noise
)

# Prevent unrealistic prices
final_price = np.maximum(final_price, base_price * 0.8)

# Round price
final_price = np.round(final_price, 0)

# Create DataFrame
data = pd.DataFrame({
    "basePrice": base_price,
    "demand": demand,
    "occupancy": occupancy,
    "weekend": weekend,
    "season": season,
    "leadDays": lead_days,
    "rating": rating,
    "finalPrice": final_price
})

# Save dataset
data.to_csv("database.csv", index=False)

print("Dataset generated successfully!")
print(f"Total records: {len(data)}")
print("\nFirst 10 records:")
print(data.head(10))