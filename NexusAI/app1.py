from flask import Flask, render_template, request
from sklearn.tree import DecisionTreeClassifier
import numpy as np

app = Flask(__name__)

# Encode categories
levels = ["Low", "Medium", "High"]
soil_types = ["Sandy", "Loam", "Clay"]
seasons = ["Kharif", "Rabi", "Summer"]
moisture_levels = ["Low", "Medium", "High"]

# Simple synthetic training data
X = [
    [6.5, 1,1,1,2,30,2,0],  # Rice
    [6.8, 1,1,1,1,20,1,1],  # Wheat
    [7.0, 1,1,1,0,32,0,0],  # Cotton
    [6.0, 1,1,1,0,28,0,0],  # Groundnut
    [6.5, 1,1,1,1,25,1,0],  # Maize
]

y = ["Rice", "Wheat", "Cotton", "Groundnut", "Maize"]

model = DecisionTreeClassifier()
model.fit(X, y)


def fertilizer_rule(n, p, k):
    result = []
    if n == "Low":
        result.append("Apply Urea")
    if p == "Low":
        result.append("Apply DAP")
    if k == "Low":
        result.append("Apply MOP")
    if not result:
        result.append("Balanced NPK recommended")
    return ", ".join(result)


def harvest_time(crop):
    days = {
        "Rice": 120,
        "Wheat": 100,
        "Cotton": 150,
        "Groundnut": 110,
        "Maize": 105
    }
    return days.get(crop, 100)


@app.route("/", methods=["GET", "POST"])
def index():
    result = None

    if request.method == "POST":
        ph = float(request.form["ph"])
        n = request.form["nitrogen"]
        p = request.form["phosphorus"]
        k = request.form["potassium"]
        soil = request.form["soil"]
        moisture = request.form["moisture"]
        temp = float(request.form["temperature"])
        season = request.form["season"]

        input_data = [[
            ph,
            levels.index(n),
            levels.index(p),
            levels.index(k),
            moisture_levels.index(moisture),
            temp,
            soil_types.index(soil),
            seasons.index(season)
        ]]

        crop = model.predict(input_data)[0]

        result = {
            "crop": crop,
            "fertilizer": fertilizer_rule(n, p, k),
            "harvest": harvest_time(crop),
            "pesticide": "Neem oil recommended for common pests"
        }

    return render_template("index.html", result=result)


if __name__ == "__main__":
    app.run(debug=True)              

