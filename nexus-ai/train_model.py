import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

# Load dataset
df = pd.read_csv("modified_crop_dataset.csv")

# Encode
df['soil_type'] = df['soil_type'].map({'Sandy':0,'Loam':1,'Clay':2})
df['season'] = df['season'].map({'Kharif':0,'Rabi':1,'Summer':2})

# Features
X = df[['ph','N','P','K','moisture','season','soil_type','temperature']]
y = df['label']

# Train model
model = DecisionTreeClassifier(max_depth=6)
model.fit(X, y)

# Save model
joblib.dump(model, "model.pkl")

print("model.pkl created successfully!")