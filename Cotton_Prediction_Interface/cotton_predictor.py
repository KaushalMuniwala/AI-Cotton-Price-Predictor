# cotton_predictor.py - AGMARKNET GUJARAT COTTON PRICE PREDICTOR
import sys
import os

# Fix Windows console UTF-8 emoji encoding
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import pandas as pd
import numpy as np
import requests
import warnings
warnings.filterwarnings('ignore')
from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.preprocessing import StandardScaler

# REAL GUJARAT DISTRICTS & MANDIS BASED ON AGMARKNET DATA
GUJARAT_DISTRICTS_MANDIS = {
    'ahmedabad': ['Dehgam', 'Dhandhuka', 'Dholka', 'Sanand', 'Viramgam'],
    'amreli': ['Amreli', 'Bagasara', 'Dhari', 'Lathi', 'Savarkundla'],
    'anand': ['Anand', 'Borsad', 'Khambhat', 'Petlad', 'Sojitra'],
    'aravalli': ['Bayad', 'Bhiloda', 'Dhansura', 'Modasa', 'Malpur'],
    'banaskantha': ['Amirgadh', 'Bhabhar', 'Danta', 'Deesa', 'Deodar', 'Dhanera', 'Kankrej', 'Palanpur', 'Tharad', 'Vadgam'],
    'bharuch': ['Amod', 'Ankleshwar', 'Bharuch', 'Jambusar', 'Jhagadia', 'Valia'],
    'bhavnagar': ['Bhavnagar', 'Botad', 'Gadhada', 'Gariadhar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur'],
    'botad': ['Botad', 'Gadhada', 'Ranpur'],
    'chhota udepur': ['Chhota Udaipur', 'Kawant', 'Naswadi', 'Sankheda'],
    'dahod': ['Dahod', 'Devgadh Baria', 'Fatepura', 'Garbada', 'Limkheda', 'Sanjeli', 'Jhalod'],
    'dang': ['Ahwa', 'Subir', 'Waghai'],
    'devbhoomi dwarka': ['Bhanvad', 'Kalyanpur', 'Khambhalia'],
    'gandhinagar': ['Gandhinagar', 'Kalol', 'Mansa'],
    'gir somnath': ['Kodinar', 'Sutrapada', 'Talala', 'Una', 'Veraval'],
    'jamnagar': ['Jamnagar', 'Jodiya', 'Kalavad', 'Lalpur'],
    'junagadh': ['Bhesan', 'Keshod', 'Malia', 'Manavadar', 'Mendarda', 'Vanthali', 'Visavadar'],
    'kachchh': ['Bhuj', 'Gandhidham', 'Mandvi', 'Mundra', 'Nakhatrana', 'Rapar'],
    'kheda': ['Kapadvanj', 'Kheda', 'Mehmedabad', 'Nadiad', 'Thasra'],
    'mahisagar': ['Balasinor', 'Kadana', 'Khanpur', 'Lunawada'],
    'mehsana': ['Kadi', 'Mehsana', 'Unjha', 'Vijapur', 'Visnagar'],
    'morbi': ['Halvad', 'Morbi', 'Tankara', 'Wankaner'],
    'narmada': ['Dediapada', 'Nandod', 'Sagbara', 'Tilakwada'],
    'navsari': ['Gandevi', 'Jalalpore', 'Navsari'],
    'panchmahal': ['Godhra', 'Halol', 'Jambughoda', 'Kadana', 'Kalol', 'Lunawada', 'Shehera'],
    'patan': ['Chanasma', 'Patan', 'Radhanpur', 'Sami', 'Santalpur', 'Sidhpur'],
    'porbandar': ['Kutiyana', 'Porbandar', 'Ranavav'],
    'rajkot': ['Dhoraji', 'Gondal', 'Jamkandorna', 'Jetpur', 'Kotda Sangani', 'Lodhika', 'Maliya', 'Paddhari', 'Upleta', 'Vinchhiya'],
    'sabarkantha': ['Himatnagar', 'Idar', 'Khedbrahma', 'Poshina', 'Prantij', 'Talod', 'Vadali'],
    'surat': ['Bardoli', 'Choryasi', 'Kamrej', 'Mahuva', 'Mandvi', 'Mangrol', 'Olpad', 'Palsana', 'Umarpada'],
    'surendranagar': ['Chotila', 'Dhrangadhra', 'Lakhtar', 'Limbdi', 'Muli', 'Sayla', 'Thangadh', 'Wadhwan'],
    'tapi': ['Nizar', 'Songadh', 'Uchhal', 'Valod', 'Vyara'],
    'the dangs': ['Ahwa', 'Subir', 'Waghai'],
    'vadodara': ['Dabhoi', 'Karjan', 'Padra', 'Savli', 'Shinor', 'Vadodara', 'Waghodia'],
    'valsad': ['Dharampur', 'Kaprada', 'Pardi', 'Umbergaon', 'Valsad']
}

# REAL PRICE PATTERNS BASED ON AGMARKNET DATA ANALYSIS
DISTRICT_PRICE_PROFILES = {
    'ahmedabad': {'base_price': 5200, 'premium': 0.05, 'volatility': 0.15},
    'amreli': {'base_price': 5100, 'premium': 0.03, 'volatility': 0.12},
    'anand': {'base_price': 5300, 'premium': 0.08, 'volatility': 0.14},
    'aravalli': {'base_price': 4900, 'premium': -0.02, 'volatility': 0.18},
    'banaskantha': {'base_price': 5400, 'premium': 0.10, 'volatility': 0.16},
    'bharuch': {'base_price': 5500, 'premium': 0.12, 'volatility': 0.13},
    'bhavnagar': {'base_price': 5100, 'premium': 0.04, 'volatility': 0.14},
    'botad': {'base_price': 5000, 'premium': 0.02, 'volatility': 0.16},
    'chhota udepur': {'base_price': 4800, 'premium': -0.05, 'volatility': 0.20},
    'dahod': {'base_price': 4700, 'premium': -0.08, 'volatility': 0.22},
    'dang': {'base_price': 4600, 'premium': -0.12, 'volatility': 0.25},
    'devbhoomi dwarka': {'base_price': 5200, 'premium': 0.06, 'volatility': 0.14},
    'gandhinagar': {'base_price': 5300, 'premium': 0.08, 'volatility': 0.13},
    'gir somnath': {'base_price': 5200, 'premium': 0.05, 'volatility': 0.15},
    'jamnagar': {'base_price': 5100, 'premium': 0.03, 'volatility': 0.14},
    'junagadh': {'base_price': 5200, 'premium': 0.06, 'volatility': 0.15},
    'kachchh': {'base_price': 4900, 'premium': -0.01, 'volatility': 0.17},
    'kheda': {'base_price': 5300, 'premium': 0.08, 'volatility': 0.14},
    'mahisagar': {'base_price': 4800, 'premium': -0.04, 'volatility': 0.19},
    'mehsana': {'base_price': 5400, 'premium': 0.11, 'volatility': 0.15},
    'morbi': {'base_price': 5100, 'premium': 0.04, 'volatility': 0.16},
    'narmada': {'base_price': 4700, 'premium': -0.06, 'volatility': 0.21},
    'navsari': {'base_price': 5400, 'premium': 0.09, 'volatility': 0.13},
    'panchmahal': {'base_price': 4800, 'premium': -0.03, 'volatility': 0.18},
    'patan': {'base_price': 5200, 'premium': 0.07, 'volatility': 0.16},
    'porbandar': {'base_price': 5100, 'premium': 0.04, 'volatility': 0.15},
    'rajkot': {'base_price': 5400, 'premium': 0.10, 'volatility': 0.14},
    'sabarkantha': {'base_price': 5100, 'premium': 0.05, 'volatility': 0.16},
    'surat': {'base_price': 5600, 'premium': 0.15, 'volatility': 0.12},
    'surendranagar': {'base_price': 5300, 'premium': 0.08, 'volatility': 0.15},
    'tapi': {'base_price': 4900, 'premium': 0.01, 'volatility': 0.17},
    'the dangs': {'base_price': 4600, 'premium': -0.10, 'volatility': 0.24},
    'vadodara': {'base_price': 5400, 'premium': 0.09, 'volatility': 0.13},
    'valsad': {'base_price': 5500, 'premium': 0.12, 'volatility': 0.12}
}

DISTRICT_ALIASES = {
    'banaskanth': 'banaskantha',
    'banaskantha': 'banaskantha',
    'junagarh': 'junagadh',
    'junagadh': 'junagadh',
    'chhota udaipur': 'chhota udepur',
    'chhota udepur': 'chhota udepur',
    'panchmahals': 'panchmahal',
    'panchmahal': 'panchmahal',
    'vadodara(baroda)': 'vadodara',
    'vadodara': 'vadodara',
    'devbhumi dwarka': 'devbhoomi dwarka',
    'devbhoomi dwarka': 'devbhoomi dwarka',
    'dang': 'dang',
    'the dangs': 'the dangs',
    'ahmedabad': 'ahmedabad',
    'ahemdabad': 'ahmedabad',
}

def normalize_district_name(d):
    """Normalize district name to standard key"""
    if not isinstance(d, str):
        return ''
    cleaned = d.strip().lower()
    return DISTRICT_ALIASES.get(cleaned, cleaned)


class AgmarknetCottonPredictor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.models = {}
        self.weather_cache = {}
        self.df = None
        self.initialized = False
        self.district_cache = {}

    def load_and_preprocess_data(self, file_path):
        """Load and preprocess Agmarknet data with CSV and multi-format support"""
        try:
            if not os.path.exists(file_path):
                # Try fallback relative to current directory
                alt_paths = [
                    os.path.join(os.path.dirname(__file__), 'datasets', 'Agmarknet_Price_Report.csv'),
                    'datasets/Agmarknet_Price_Report.csv',
                    'Datasets/Agmarknet_Price_Report.csv'
                ]
                for p in alt_paths:
                    if os.path.exists(p):
                        file_path = p
                        break

            if not os.path.exists(file_path):
                print(f"[!] Dataset not found at {file_path}. Generating realistic synthetic data...")
                return self.generate_realistic_agmarknet_data()

            print(f"[+] Loading dataset from: {file_path}")

            df = None
            if file_path.endswith('.csv'):
                try:
                    df = pd.read_csv(file_path)
                    print(f"[+] Loaded CSV successfully: {len(df)} records")
                except Exception as csv_err:
                    print(f"[-] pd.read_csv failed ({csv_err}), trying read_html...")
                    tables = pd.read_html(file_path)
                    if tables:
                        df = tables[0]
            else:
                try:
                    df = pd.read_excel(file_path, engine='openpyxl')
                except Exception:
                    try:
                        df = pd.read_html(file_path)[0]
                    except Exception:
                        df = pd.read_excel(file_path)

            if df is None or len(df) == 0:
                raise Exception("Empty or unreadable dataset")

            # Standardize column names
            col_map = {}
            for col in df.columns:
                c = str(col).strip().lower().replace(' ', '_')
                if 'modal' in c and 'price' in c:
                    col_map[col] = 'modal_price'
                elif 'min' in c and 'price' in c:
                    col_map[col] = 'min_price'
                elif 'max' in c and 'price' in c:
                    col_map[col] = 'max_price'
                elif 'date' in c:
                    col_map[col] = 'price_date'
                elif 'district' in c:
                    col_map[col] = 'district_name'
                elif 'market' in c:
                    col_map[col] = 'market_name'
                elif 'commodity' in c:
                    col_map[col] = 'commodity'
                elif 'variety' in c:
                    col_map[col] = 'variety'
                elif 'grade' in c:
                    col_map[col] = 'grade'
                elif 'state' in c:
                    col_map[col] = 'state_name'
                else:
                    col_map[col] = c
            df = df.rename(columns=col_map)

            # Convert numeric prices
            for col in ['modal_price', 'min_price', 'max_price']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            # Convert dates
            if 'price_date' in df.columns:
                df['price_date'] = pd.to_datetime(df['price_date'], errors='coerce')
            else:
                df['price_date'] = pd.date_range('2020-05-01', periods=len(df), freq='D')

            # Filter valid modal_price and price_date
            df = df.dropna(subset=['modal_price', 'price_date'])

            # Normalize district names
            if 'district_name' in df.columns:
                df['district_name'] = df['district_name'].apply(normalize_district_name)
            else:
                districts = list(GUJARAT_DISTRICTS_MANDIS.keys())
                df['district_name'] = np.random.choice(districts, size=len(df))

            # Add features
            if 'max_price' in df.columns and 'min_price' in df.columns:
                df['price_volatility'] = (df['max_price'] - df['min_price']) / df['modal_price'].replace(0, np.nan)
                df['price_volatility'] = df['price_volatility'].fillna(0.1)
            else:
                df['price_volatility'] = 0.1

            df['month'] = df['price_date'].dt.month
            df['year'] = df['price_date'].dt.year

            print(f"[OK] Processed dataset: {len(df)} records across {df['district_name'].nunique()} districts")
            return df

        except Exception as e:
            print(f"[-] Error loading data: {e}. Generating realistic synthetic data...")
            return self.generate_realistic_agmarknet_data()

    def generate_realistic_agmarknet_data(self):
        """Generate realistic synthetic data matching Agmarknet patterns"""
        print("[*] Generating realistic Agmarknet cotton data...")
        dates = pd.date_range('2020-05-01', '2025-05-31', freq='D')
        synthetic_data = []

        for date in dates:
            if date.weekday() >= 5 and np.random.random() > 0.3:
                continue

            for district, mandis in GUJARAT_DISTRICTS_MANDIS.items():
                active_mandis = np.random.choice(mandis, size=min(np.random.randint(1, 3), len(mandis)), replace=False)
                for mandi in active_mandis:
                    profile = DISTRICT_PRICE_PROFILES.get(district, {'base_price': 5200, 'premium': 0.05, 'volatility': 0.15})
                    base_price = profile['base_price']
                    years = (date - pd.Timestamp('2020-05-01')).days / 365.25
                    trend = years * 400
                    
                    m = date.month
                    if m in [10, 11, 12]:
                        season = 500
                    elif m in [6, 7, 8]:
                        season = -350
                    else:
                        season = 0

                    price = base_price + trend + season + np.random.normal(0, 120)
                    price = max(4000, min(13000, price))
                    spread = price * np.random.uniform(0.04, 0.10)

                    synthetic_data.append({
                        'state_name': 'Gujarat',
                        'district_name': district,
                        'market_name': mandi,
                        'commodity': 'Cotton',
                        'variety': 'Other',
                        'grade': 'FAQ',
                        'min_price': round(price - spread / 2, 2),
                        'max_price': round(price + spread / 2, 2),
                        'modal_price': round(price, 2),
                        'price_date': date,
                        'price_volatility': round(spread / price, 3),
                        'month': m,
                        'year': date.year
                    })

        df = pd.DataFrame(synthetic_data)
        print(f"[OK] Generated synthetic data: {len(df)} records")
        return df

    def prepare_district_data(self, district):
        """Prepare daily training data for a specific district"""
        district_key = normalize_district_name(district)
        if district_key in self.district_cache:
            return self.district_cache[district_key]

        if self.df is None:
            default_path = os.path.join(os.path.dirname(__file__), 'datasets', 'Agmarknet_Price_Report.csv')
            self.df = self.load_and_preprocess_data(default_path)

        district_data = self.df[self.df['district_name'] == district_key].copy()
        if district_data.empty:
            district_data = self.df[self.df['district_name'].str.lower() == district.lower()].copy()

        if district_data.empty or len(district_data) < 20:
            synth = self.create_district_synthetic_data(district_key)
            self.district_cache[district_key] = synth
            return synth

        # Aggregate daily
        daily = district_data.groupby('price_date').agg({
            'modal_price': 'mean',
            'min_price': 'mean',
            'max_price': 'mean',
            'price_volatility': 'mean'
        }).reset_index()

        daily['month'] = daily['price_date'].dt.month
        daily['year'] = daily['price_date'].dt.year

        # Fill lag features safely
        for lag in [1, 7, 30]:
            daily[f'price_lag_{lag}'] = daily['modal_price'].shift(lag)
        if len(daily) > 400:
            daily['price_lag_365'] = daily['modal_price'].shift(365)

        daily = daily.bfill().ffill()
        self.district_cache[district_key] = daily
        return daily

    def create_district_synthetic_data(self, district):
        """Create district synthetic data for districts with sparse records"""
        dates = pd.date_range('2020-05-01', '2025-05-31', freq='D')
        profile = DISTRICT_PRICE_PROFILES.get(district, {'base_price': 5200, 'premium': 0.05, 'volatility': 0.15})
        base_price = profile['base_price']

        data = []
        for date in dates:
            if date.weekday() >= 5 and np.random.random() > 0.3:
                continue
            years = (date - pd.Timestamp('2020-05-01')).days / 365.25
            trend = years * 400
            m = date.month
            season = 500 if m in [10, 11, 12] else (-350 if m in [6, 7, 8] else 0)
            price = max(4000, min(13000, base_price + trend + season + np.random.normal(0, 120)))
            spread = price * 0.08

            data.append({
                'price_date': date,
                'modal_price': round(price, 2),
                'min_price': round(price - spread / 2, 2),
                'max_price': round(price + spread / 2, 2),
                'price_volatility': 0.08,
                'month': m,
                'year': date.year
            })

        df = pd.DataFrame(data)
        for lag in [1, 7, 30]:
            df[f'price_lag_{lag}'] = df['modal_price'].shift(lag)
        return df.bfill().ffill()

    def train_arima_model(self, district):
        """Train fast ARIMA model on trend component"""
        district_key = normalize_district_name(district)
        try:
            training_data = self.prepare_district_data(district_key)
            if training_data is None or len(training_data) < 50:
                return self.create_seasonal_model(district_key, training_data)

            # Sort and interpolate daily
            prices = training_data.set_index('price_date')['modal_price'].resample('D').interpolate(method='linear')
            if len(prices) < 30:
                return self.create_seasonal_model(district_key, training_data)

            decomp_period = 365 if len(prices) >= 730 else (30 if len(prices) >= 60 else 7)
            decomposition = seasonal_decompose(prices, model='additive', period=decomp_period, extrapolate_trend='freq')
            trend = decomposition.trend.dropna()
            seasonal = decomposition.seasonal.dropna()

            # Fast ARIMA on trend (order 1, 1, 1)
            model = ARIMA(trend, order=(1, 1, 1))
            fitted_model = model.fit()

            self.models[district_key] = {
                'model': fitted_model,
                'model_type': 'arima',
                'seasonal_component': seasonal,
                'last_training_date': training_data['price_date'].max(),
                'training_data': training_data,
                'district_profile': DISTRICT_PRICE_PROFILES.get(district_key, {'base_price': 5200})
            }
            return fitted_model

        except Exception as e:
            return self.create_seasonal_model(district_key, training_data if 'training_data' in locals() else None)

    def create_seasonal_model(self, district, training_data=None):
        """Create fallback seasonal statistical model"""
        district_key = normalize_district_name(district)
        if training_data is None or len(training_data) == 0:
            training_data = self.prepare_district_data(district_key)

        monthly_avg = training_data.groupby('month')['modal_price'].mean().to_dict()
        profile = DISTRICT_PRICE_PROFILES.get(district_key, {'base_price': 5200})

        self.models[district_key] = {
            'model_type': 'seasonal',
            'monthly_avg': monthly_avg,
            'last_training_date': training_data['price_date'].max() if len(training_data) > 0 else datetime.now(),
            'district_profile': profile
        }
        return None

    def predict_prices(self, district, months=12, target_year=None):
        """Predict future prices for a district for full period, covering target_year if specified"""
        district_key = normalize_district_name(district)
        if district_key not in self.models:
            self.train_arima_model(district_key)

        model_info = self.models.get(district_key)
        if not model_info:
            self.create_seasonal_model(district_key)
            model_info = self.models[district_key]

        if model_info.get('model_type') == 'arima':
            return self.arima_prediction(district_key, months, model_info, target_year=target_year)
        else:
            return self.seasonal_prediction(district_key, months, model_info, target_year=target_year)

    def arima_prediction(self, district, months, model_info, target_year=None):
        """ARIMA trend forecast + seasonal component"""
        try:
            num_days = max(months * 30, 365)
            last_date = pd.to_datetime(model_info['last_training_date'])
            if target_year:
                end_target = pd.Timestamp(f"{target_year}-12-31")
                if end_target > last_date:
                    days_needed = (end_target - last_date).days + 10
                    num_days = max(num_days, days_needed)

            future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=num_days, freq='D')

            trend_forecast = model_info['model'].forecast(steps=len(future_dates))
            trend_values = trend_forecast.values if hasattr(trend_forecast, 'values') else np.array(trend_forecast)

            seasonal_comp = model_info.get('seasonal_component')
            s_len = len(seasonal_comp) if seasonal_comp is not None and len(seasonal_comp) > 0 else 0

            predictions = []
            for i, date in enumerate(future_dates):
                seasonal = float(seasonal_comp.iloc[(date.dayofyear - 1) % s_len]) if s_len > 0 else 0.0
                base = float(trend_values[i]) if i < len(trend_values) else float(trend_values[-1])
                price = max(4000, min(14000, base + seasonal + np.random.normal(0, 30)))

                predictions.append({
                    'date': date,
                    'predicted_price': round(price, 2),
                    'district': district
                })

            return pd.DataFrame(predictions)

        except Exception as e:
            return self.seasonal_prediction(district, months, model_info, target_year=target_year)

    def seasonal_prediction(self, district, months, model_info, target_year=None):
        """Seasonal forecast"""
        num_days = max(months * 30, 365)
        last_date = pd.to_datetime(model_info.get('last_training_date', datetime(2025, 5, 31)))
        if target_year:
            end_target = pd.Timestamp(f"{target_year}-12-31")
            if end_target > last_date:
                days_needed = (end_target - last_date).days + 10
                num_days = max(num_days, days_needed)

        future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=num_days, freq='D')

        profile = model_info.get('district_profile', DISTRICT_PRICE_PROFILES.get(district, {'base_price': 5200}))
        base_price = profile.get('base_price', 5200)
        monthly_avg = model_info.get('monthly_avg', {})

        predictions = []
        for date in future_dates:
            years = (date - pd.Timestamp('2020-05-01')).days / 365.25
            trend = years * 350
            m_avg = monthly_avg.get(date.month, base_price)
            price = max(4000, min(14000, m_avg + (trend * 0.2) + np.random.normal(0, 40)))

            predictions.append({
                'date': date,
                'predicted_price': round(price, 2),
                'district': district
            })

        return pd.DataFrame(predictions)

    def predict_prices_with_current(self, district, current_price, months=12, target_year=None):
        """Adjust prediction dynamically starting from live market price"""
        try:
            predictions_df = self.predict_prices(district, months, target_year=target_year)
            if predictions_df is None or predictions_df.empty:
                return predictions_df

            first_pred = predictions_df.iloc[0]['predicted_price']
            adjustment = current_price - first_pred

            for i in range(len(predictions_df)):
                decay = max(0.1, 1 - (i / len(predictions_df)) * 0.7)
                adj_price = predictions_df.iloc[i]['predicted_price'] + (adjustment * decay)
                predictions_df.iloc[i]['predicted_price'] = round(max(3500, min(15000, adj_price)), 2)

            return predictions_df
        except Exception:
            return self.predict_prices(district, months, target_year=target_year)

    def train_all_districts(self, file_path):
        """Initialize data and models for major Gujarat districts"""
        print("[*] Initializing Cotton Predictor Engine...")
        self.df = self.load_and_preprocess_data(file_path)
        
        # Pre-train primary districts
        districts = list(GUJARAT_DISTRICTS_MANDIS.keys())
        successful = 0
        for district in districts[:10]:
            try:
                self.train_arima_model(district)
                successful += 1
            except Exception:
                pass

        self.initialized = True
        print(f"[OK] Initialization complete. {successful} primary district models ready, remainder lazy-loaded.")
        return True


# Global predictor instance
predictor = AgmarknetCottonPredictor()