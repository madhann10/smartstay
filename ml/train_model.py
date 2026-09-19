import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# -----------------------------------
# 1. Load Dataset
# -----------------------------------

data = pd.read_csv("database.csv")

print("Dataset loaded successfully!")
print("Total records:", len(data))


# -----------------------------------
# 2. Select Features
# -----------------------------------

features = [
    "basePrice",
    "demand",
    "occupancy",
    "weekend",
    "season",
    "leadDays",
    "rating"
]

X = data[features]

# Target variable
y = data["finalPrice"]


# -----------------------------------
# 3. Split Dataset
# -----------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training records:", len(X_train))
print("Testing records:", len(X_test))


# -----------------------------------
# 4. Create ML Model
# -----------------------------------

model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)


# -----------------------------------
# 5. Train Model
# -----------------------------------

print("\nTraining model...")

model.fit(X_train, y_train)

print("Model training completed!")


# -----------------------------------
# 6. Make Predictions
# -----------------------------------

predictions = model.predict(X_test)


# -----------------------------------
# 7. Evaluate Model
# -----------------------------------

mae = mean_absolute_error(y_test, predictions)

mse = mean_squared_error(y_test, predictions)

rmse = mse ** 0.5

r2 = r2_score(y_test, predictions)


print("\n========== MODEL PERFORMANCE ==========")

print("MAE :", round(mae, 2))

print("RMSE:", round(rmse, 2))

print("R2 Score:", round(r2, 4))


# -----------------------------------
# 8. Save Model
# -----------------------------------

joblib.dump(model, "ml/pricing_model.pkl")

print("\nModel saved successfully!")
print("File: ml/pricing_model.pkl")