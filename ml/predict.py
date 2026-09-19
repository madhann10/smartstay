import sys
import pandas as pd
import joblib


# Load trained ML model
model = joblib.load("ml/pricing_model.pkl")


# Check that Node.js sent all 7 values
if len(sys.argv) != 8:
    print("Error: Expected 7 input values")
    sys.exit(1)


# Read values sent by Node.js
base_price = float(sys.argv[1])
demand = float(sys.argv[2])
occupancy = float(sys.argv[3])
weekend = int(sys.argv[4])
season = int(sys.argv[5])
lead_days = int(sys.argv[6])
rating = float(sys.argv[7])


# Create input for the ML model
room = pd.DataFrame([{
    "basePrice": base_price,
    "demand": demand,
    "occupancy": occupancy,
    "weekend": weekend,
    "season": season,
    "leadDays": lead_days,
    "rating": rating
}])


# Predict dynamic price
predicted_price = model.predict(room)[0]


# Return ONLY the predicted price
print(f"{predicted_price:.2f}")