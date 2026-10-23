# Agmarknet Gujarat Cotton Price Predictor (AI/ML)

An intelligent cotton price prediction dashboard specifically tailored for Gujarat mandis, combining 5 years of historical Agmarknet market data (2020–2025), ARIMA time-series models with seasonal decomposition, weather intelligence, and live Data.gov.in Agmarknet API integration.

## Key Features

- **Full Gujarat Coverage**: All 34 districts and major agricultural mandis (Rajkot, Amreli, Ahmedabad, Surat, Bhavnagar, etc.).
- **Agmarknet Time-Series Modeling**: Trained on 41,000+ real Gujarat cotton market records with seasonality decomposition.
- **Live Data Integration**: Automatic synchronization with Data.gov.in Agmarknet live price feeds.
- **Weather Impact Intelligence**: Dynamic sliders for rainfall and temperature impact estimation on harvest pricing.
- **Interactive Analytics Dashboard**: Interactive Chart.js graphs, month-by-month forecasting, best/worst month indicators, and price range metrics.
- **Historical Trends**: Historical price trajectory explorer with min, max, and modal averages.

## Installation & Setup

1. **Activate Virtual Environment**:
   ```bash
   ..\.venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Application**:
   ```bash
   python app.py
   ```

4. **Access in Browser**:
   Open [http://localhost:5000](http://localhost:5000)

## Project Structure

```
Cotton_Prediction_Interface/
├── app.py                 # Flask server with REST API routes
├── cotton_predictor.py    # ARIMA & seasonal forecasting engine
├── datasets/              # Clean Agmarknet price datasets
├── static/                # Frontend CSS styling & interactive JavaScript
├── templates/             # Modern dashboard HTML template
├── .env                   # API keys configuration
└── requirements.txt       # Python dependencies
```
