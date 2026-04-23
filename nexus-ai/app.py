from flask import Flask, render_template, request
import joblib
import math

app = Flask(__name__)

model = joblib.load("model.pkl")

soil_map = {'Sandy': 0, 'Loam': 1, 'Clay': 2}
season_map = {'Kharif': 0, 'Rabi': 1, 'Summer': 2}

# ── Crop-specific data derived from dataset analysis ──────────────────────────

# N/P/K thresholds per crop — derived from dataset mean values.
# Format: (N_mean, P_mean, K_mean)
CROP_NPK_MEAN = {
    "rice":        (80,  48,  40),
    "maize":       (78,  48,  20),
    "cotton":      (118, 46,  20),
    "jute":        (78,  47,  40),
    "coffee":      (101, 29,  30),
    "banana":      (100, 82,  50),
    "mango":       (20,  27,  30),
    "apple":       (21,  134, 200),
    "grapes":      (23,  133, 200),
    "coconut":     (22,  17,  31),
    "papaya":      (50,  59,  50),
    "orange":      (20,  17,  10),
    "muskmelon":   (100, 18,  50),
    "watermelon":  (99,  17,  50),
    "chickpea":    (40,  68,  80),
    "kidneybeans": (21,  68,  20),
    "lentil":      (19,  68,  19),
    "blackgram":   (40,  67,  19),
    "mungbean":    (21,  47,  20),
    "mothbeans":   (21,  48,  20),
    "pigeonpeas":  (21,  68,  20),
    "pomegranate": (19,  19,  40),
}

# Crop-specific fertilizer recommendations per nutrient deficiency
# Format: { crop: (N_fertilizer, P_fertilizer, K_fertilizer, balanced_fertilizer) }
CROP_FERTILIZER = {
    "rice":        ("Urea for nitrogen boost",                       "Single Super Phosphate (SSP) for tillering",         "Muriate of Potash (MOP) for grain filling",        "NPK 14-35-14 as basal dose"),
    "maize":       ("Urea or Ammonium Nitrate for growth",           "DAP for root development",                           "MOP for stalk strength",                           "NPK 12-32-16 at sowing"),
    "cotton":      ("Urea for boll development",                     "SSP for early root growth",                          "MOP for fiber quality",                            "NPK 19-19-19 balanced dose"),
    "jute":        ("Ammonium Sulphate for fiber growth",            "SSP for stem strength",                              "MOP for stress tolerance",                         "NPK 15-15-15 maintenance dose"),
    "coffee":      ("Urea for leaf growth",                          "Rock Phosphate for root health",                     "Sulphate of Potash (SOP) for bean quality",        "NPK 17-17-17 foliar spray"),
    "banana":      ("Urea for bunch development",                    "DAP for flowering",                                  "MOP for fruit filling (high K needed)",            "NPK 13-8-27 for fruiting stage"),
    "mango":       ("Ammonium Sulphate for shoot growth",            "SSP for root establishment",                         "MOP for fruit sweetness",                          "NPK 10-26-26 at flowering"),
    "apple":       ("Calcium Ammonium Nitrate (CAN) for fruit set",  "DAP for blossom development",                        "SOP for fruit color and quality",                  "NPK 12-12-17 maintenance"),
    "grapes":      ("Urea for canopy growth",                        "SSP for berry set",                                  "SOP for sugar accumulation in berries",            "NPK 15-10-30 at veraison"),
    "coconut":     ("Urea for frond development",                    "Rock Phosphate for root health",                     "MOP for nut formation (critical for coconut)",     "NPK 12-12-17+2MgO per palm"),
    "papaya":      ("Ammonium Nitrate for fast growth",              "DAP for flowering",                                  "MOP for fruit size and sweetness",                 "NPK 15-15-15 every 2 months"),
    "orange":      ("Calcium Ammonium Nitrate for fruit development", "SSP for root strength",                             "SOP for peel quality and shelf life",              "NPK 12-6-22 at fruit development"),
    "muskmelon":   ("Urea for vine growth",                          "SSP for fruit set",                                  "MOP for sweetness and fruit weight",               "NPK 13-0-46 at flowering"),
    "watermelon":  ("Ammonium Nitrate for rapid growth",             "DAP for root and fruit development",                 "MOP for fruit sweetness and size",                 "NPK 15-5-30 at fruiting"),
    "chickpea":    ("Rhizobium inoculant + small Urea starter",      "DAP for pod filling",                                "MOP for drought tolerance",                        "NPK 20-60-20 as basal"),
    "kidneybeans": ("Rhizobium inoculant + Ammonium Sulphate",       "SSP for seed development",                           "MOP for pod strength",                             "NPK 15-30-15 at sowing"),
    "lentil":      ("Rhizobium inoculant + small Urea dose",         "DAP for nodulation support",                         "MOP for seed filling",                             "NPK 10-40-10 basal dose"),
    "blackgram":   ("Urea split dose for vegetative growth",         "SSP for root nodule development",                    "MOP for pod setting",                              "NPK 20-40-0 at sowing"),
    "mungbean":    ("Ammonium Sulphate for early growth",            "DAP for flowering support",                          "MOP for pod development",                          "NPK 20-40-0 as basal"),
    "mothbeans":   ("Urea for vegetative stage",                     "SSP for phosphorus in dry soil",                     "MOP for stress resistance",                        "NPK 15-30-15 at sowing"),
    "pigeonpeas":  ("Ammonium Sulphate for branching",               "Rock Phosphate for deep root growth",                "MOP for pod filling",                              "NPK 20-60-0 basal dose"),
    "pomegranate": ("Calcium Ammonium Nitrate for fruiting",         "SSP for flower retention",                           "SOP for fruit color and aril quality",             "NPK 12-12-24 at flowering"),
}

# Crop-specific pesticide recommendations
CROP_PESTICIDE = {
    "rice":        "Carbofuran for stem borer; Tricyclazole for blast disease",
    "maize":       "Spinosad spray for fall armyworm; Mancozeb for leaf blight",
    "cotton":      "Bt spray (Bacillus thuringiensis) for bollworm; Imidacloprid for aphids",
    "jute":        "Chlorpyrifos for stem weevil; Copper oxychloride for stem rot",
    "coffee":      "Endosulfan for stem borer; Copper fungicide for leaf rust",
    "banana":      "Chlorpyrifos for weevil borer; Mancozeb for Sigatoka leaf spot",
    "mango":       "Lambda-cyhalothrin for mango hopper; Carbendazim for anthracnose",
    "apple":       "Captan fungicide for scab; Chlorpyrifos for codling moth",
    "grapes":      "Copper-based fungicide for downy mildew; Imidacloprid for mealybug",
    "coconut":     "Carbaryl for rhinoceros beetle; Bordeaux mixture for bud rot",
    "papaya":      "Neem oil for aphids & mites; Ridomil for Phytophthora root rot",
    "orange":      "Chlorpyrifos for citrus psylla; Copper hydroxide for citrus canker",
    "muskmelon":   "Neem oil spray for aphids; Metalaxyl for downy mildew",
    "watermelon":  "Neem oil for whitefly; Mancozeb for downy mildew",
    "chickpea":    "Imidacloprid for pod borer; Carbendazim for wilt disease",
    "kidneybeans": "Chlorpyrifos for bean fly; Mancozeb for angular leaf spot",
    "lentil":      "Dimethoate for aphids; Carbendazim for rust",
    "blackgram":   "Imidacloprid for thrips; Mancozeb for yellow mosaic (vector control)",
    "mungbean":    "Imidacloprid for jassids; Carbendazim for powdery mildew",
    "mothbeans":   "Chlorpyrifos for pod borer; Thiram seed treatment for root rot",
    "pigeonpeas":  "Indoxacarb for pod borer; Mancozeb for sterility mosaic",
    "pomegranate": "Imidacloprid for fruit borer; Copper fungicide for bacterial blight",
}

# Image filename map — keys lowercase, values match actual filenames on disk
CROP_IMAGE_MAP = {
    "rice":        "rice.jpg",
    "maize":       "maize.jpg",
    "cotton":      "cotton.jpg",
    "jute":        "jute.jpg",
    "coffee":      "coffee.jpg",
    "banana":      "banana.jpg",
    "mango":       "mango.jpg",
    "apple":       "apple.jpg",
    "grapes":      "grapes.jpg",
    "coconut":     "coconut.jpg",
    "papaya":      "papaya.jpg",
    "orange":      "orange.jpg",
    "muskmelon":   "Muskmelon.jpg",
    "watermelon":  "watermelon.jpg",
    "chickpea":    "chickpea.jpg",
    "kidneybeans": "Kidneybeans.jpg",
    "lentil":      "Lentil.jpg",
    "blackgram":   "Blackgram.jpg",
    "mungbean":    "Mungbean.jpg",
    "mothbeans":   "Mothbeans.jpg",
    "pigeonpeas":  "Pigeonpeas.jpg",
    "pomegranate": "pomegranate.jpg",
}

# Crop harvest days (realistic agronomic values)
CROP_HARVEST_DAYS = {
    "rice":        120,
    "maize":       110,
    "cotton":      155,
    "jute":        120,
    "coffee":      270,   # ~9 months from flowering to harvest
    "banana":      300,
    "mango":       120,   # after flowering; varies by variety
    "apple":       150,
    "grapes":      150,
    "coconut":     365,   # first nut harvest after ~12 months of flowering cycle
    "papaya":      270,
    "orange":      240,
    "muskmelon":   75,
    "watermelon":  80,
    "chickpea":    100,
    "kidneybeans": 90,
    "lentil":      110,
    "blackgram":   70,
    "mungbean":    65,
    "mothbeans":   80,
    "pigeonpeas":  180,
    "pomegranate": 180,
}


def recommend_fertilizer(crop, N, P, K):
    """
    Compare the user's soil N/P/K against the crop's mean requirement.
    Return crop-specific named fertilizer recommendations for each deficient nutrient,
    similar to how pesticide recommendations are given.
    """
    crop_key = crop.lower()
    means = CROP_NPK_MEAN.get(crop_key)
    ferts = CROP_FERTILIZER.get(crop_key)

    if means is None or ferts is None:
        return {"Balanced Fertilizer (NPK)": 100}

    N_mean, P_mean, K_mean = means
    N_fert, P_fert, K_fert, balanced = ferts

    recs = []
    if N < N_mean:
        recs.append(N_fert.split(" for ")[0].strip())
    if P < P_mean:
        recs.append(P_fert.split(" for ")[0].strip())
    if K < K_mean:
        recs.append(K_fert.split(" for ")[0].strip())

    if not recs:
        recs.append(balanced.split(" for ")[0].split(" at ")[0].strip())

    pct_map = {}
    total_recs = len(recs)
    if total_recs == 1:
        pct_map[recs[0]] = 100
    elif total_recs == 2:
        pct_map[recs[0]] = 60
        pct_map[recs[1]] = 40
    elif total_recs == 3:
        pct_map[recs[0]] = 40
        pct_map[recs[1]] = 30
        pct_map[recs[2]] = 30

    return pct_map


# HOME PAGE
@app.route('/')
def home():
    return render_template("home.html")


# FORM PAGE
@app.route('/form')
def form():
    return render_template("form.html")


# PREDICTION
@app.route('/predict', methods=['POST'])
def predict():
    try:
        ph   = float(request.form['ph'])
        N    = int(request.form['N'])
        P    = int(request.form['P'])
        K    = int(request.form['K'])
        temp = float(request.form['temperature'])

        wet = float(request.form['wet'])
        dry = float(request.form['dry'])

        # Moisture calculation
        moisture = ((wet - dry) * 100) / dry

        soil   = soil_map[request.form['soil']]
        season = season_map[request.form['season']]

        features = [[ph, N, P, K, moisture, season, soil, temp]]

        crop = model.predict(features)[0]
        crop_key = crop.lower()

        # Find 2 alternative crop suggestions based on NPK similarity
        distances = []
        for c_name, (c_n, c_p, c_k) in CROP_NPK_MEAN.items():
            if c_name != crop_key:
                dist = math.sqrt((N - c_n)**2 + (P - c_p)**2 + (K - c_k)**2)
                distances.append((c_name, dist))
        distances.sort(key=lambda x: x[1])
        alt1 = distances[0][0].capitalize()
        alt2 = distances[1][0].capitalize()

        # ── Crop-specific recommendations ────────────────────────────────────
        fertilizer_dict = recommend_fertilizer(crop, N, P, K)
        
        pest_str = CROP_PESTICIDE.get(crop_key, "General pest monitoring")
        pest_list = [p.strip().split(" for ")[0] for p in pest_str.split(";")]
        pesticide_dict = {}
        if len(pest_list) == 1:
            pesticide_dict[pest_list[0]] = 100
        elif len(pest_list) == 2:
            pesticide_dict[pest_list[0]] = 70
            pesticide_dict[pest_list[1]] = 30
        else:
            pesticide_dict["General pest monitoring"] = 100
            
        harvest_days = CROP_HARVEST_DAYS.get(crop_key, 100)

        # Resolve correct image filename (handles mixed-case filenames on disk)
        image_file = CROP_IMAGE_MAP.get(crop_key, f"{crop_key}.jpg")

        result = {
            "crop":         crop.capitalize(),
            "alt1":         alt1,
            "alt2":         alt2,
            "image":        image_file,
            "fertilizer":   fertilizer_dict,
            "pesticide":    pesticide_dict,
            "harvest_days": harvest_days,
        }

        return render_template("result.html", result=result)

    except Exception as e:
        return str(e)


if __name__ == "__main__":
    app.run(debug=True)