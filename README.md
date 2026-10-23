# AI Cotton Price Predictor (कपास मूल्य भविष्यवाणी)

> **Intelligent Gujarat Mandi Cotton Price Forecasting & Market Analytics System**

An end-to-end Machine Learning web application designed to help Gujarat cotton farmers, traders, and mandi operators forecast cotton (Kapas) market prices up to 12 months in advance. The system combines 5 years of verified Agmarknet daily transaction records, ARIMA time-series modeling with annual seasonal decomposition, weather sensitivity intelligence, and live Data.gov.in Agmarknet API integration.

---

## 🌟 Key Features

- **Full Gujarat State Coverage**: Pre-trained historical profiles and predictions for all **34 Gujarat districts** (Rajkot, Amreli, Ahmedabad, Surat, Bhavnagar, Gandhinagar, etc.).
- **ARIMA & Seasonality Modeling**: Trained on **41,606 daily Agmarknet market transactions (2020–2025)** using additive seasonal decomposition and ARIMA trend analysis.
- **Weather Impact Intelligence**: Dynamic sliders for rainfall and temperature anomalies to simulate price impacts based on yield expectations.
- **Smart Advisory & Best Selling Months**: Highlights the best and worst months to sell, preventing distress selling during supply gluts.
- **Live Agmarknet Sync**: Optional integration with Data.gov.in Agmarknet API with automatic fail-safe circuit breaker.
- **Interactive Visualizations**: Dynamic Chart.js visualizations (Line Chart and Bar Chart) with hover inspections.
- **AI Voice Assistant (AI सहायक)**: Audio advisory narration using Web Speech Synthesis.

---

## 🛠️ Tech Stack & Languages

- **Backend**: Python, Flask, Flask-CORS, Requests, Python-Dotenv
- **Machine Learning & Data**: Pandas, NumPy, Statsmodels (ARIMA & Seasonal Decomposition), Scikit-Learn
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism design), JavaScript (ES6+), Chart.js, FontAwesome

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/KaushalMuniwala/AI-Cotton-Price-Predictor.git
cd AI-Cotton-Price-Predictor
```

### 2. Set Up Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r Cotton_Prediction_Interface/requirements.txt
```

### 4. Run the Application
```bash
cd Cotton_Prediction_Interface
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📁 Repository Structure

```
AI-Cotton-Price-Predictor/
├── Cotton_Prediction_Interface/
│   ├── app.py                      # Flask REST API server
│   ├── cotton_predictor.py         # Time-series ML engine (ARIMA + Seasonality)
│   ├── datasets/
│   │   └── Agmarknet_Price_Report.csv  # 41,606 cleaned Gujarat market records
│   ├── static/                     # CSS styling and JavaScript
│   ├── templates/                  # HTML5 dashboard interface
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Sample environment configuration
├── PROJECT_DETAILS.txt             # Comprehensive architecture & documentation
└── README.md                       # Project overview and setup instructions
```

---

## 📜 License & Acknowledgments

- **Data Source**: Agmarknet (Directorate of Marketing & Inspection, Ministry of Agriculture, Govt. of India).
