# agmarknet_gujarat_cotton_selenium.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
from datetime import datetime, timedelta

START_DATE = "2019-01-01"
END_DATE = datetime.today().strftime("%Y-%m-%d")
OUT_CSV = "gujarat_cotton_prices_2019_to_present.csv"

driver = webdriver.Chrome()  # Make sure chromedriver is installed
wait = WebDriverWait(driver, 30)

def month_ranges(start, end):
    s = datetime.strptime(start, "%Y-%m-%d").date().replace(day=1)
    e = datetime.strptime(end, "%Y-%m-%d").date()
    while s <= e:
        next_month = (s.replace(day=28) + timedelta(days=4)).replace(day=1)
        yield s.strftime("%d-%b-%Y"), min(next_month - timedelta(days=1), e).strftime("%d-%b-%Y")
        s = next_month

all_data = []
driver.get("https://agmarknet.gov.in/SearchCmmMkt.aspx")
time.sleep(3)

for from_d, to_d in month_ranges(START_DATE, END_DATE):
    try:
        # Select State = Gujarat
        state_select = Select(wait.until(EC.presence_of_element_located((By.ID, "ddlState"))))
        state_select.select_by_visible_text("Gujarat")
        time.sleep(1)

        # Select Commodity = Cotton
        comm_select = Select(wait.until(EC.presence_of_element_located((By.ID, "ddlCommodity"))))
        comm_select.select_by_visible_text("Cotton")
        time.sleep(1)

        # Enter dates
        driver.find_element(By.ID, "txtDate").clear()
        driver.find_element(By.ID, "txtDate").send_keys(from_d)
        driver.find_element(By.ID, "txtDateTo").clear()
        driver.find_element(By.ID, "txtDateTo").send_keys(to_d)

        # Submit
        driver.find_element(By.ID, "btnGo").click()

        # Wait for table
        wait.until(EC.presence_of_element_located((By.ID, "cphBody_Grid")))

        # Parse HTML table
        html = driver.page_source
        tables = pd.read_html(html)
        for df in tables:
            if "Market" in df.columns and "Min Price" in " ".join(df.columns):
                df["state"] = "Gujarat"
                df["source_url"] = driver.current_url
                all_data.append(df)
                print(f"Fetched {from_d} → {to_d} ({len(df)} rows)")
                break
    except Exception as e:
        print(f"Error fetching {from_d} → {to_d}: {e}")
    time.sleep(3)

driver.quit()

if all_data:
    full_df = pd.concat(all_data, ignore_index=True)
    # Normalize columns
    rename_map = {
        "Date": "date",
        "District Name": "district",
        "Market": "market",
        "Variety": "variety",
        "Min Price (Rs./Quintal)": "min_price_qtl",
        "Max Price (Rs./Quintal)": "max_price_qtl",
        "Modal Price (Rs./Quintal)": "avg_price_qtl",
        "Arrival (Tonnes)": "arrival_qty_qtl",
    }
    for k in rename_map:
        if k in full_df.columns:
            full_df = full_df.rename(columns={k: rename_map[k]})

    final_cols = [
        "date", "state", "district", "market", "variety",
        "min_price_qtl", "max_price_qtl", "avg_price_qtl",
        "arrival_qty_qtl", "source_url"
    ]
    full_df = full_df[[c for c in final_cols if c in full_df.columns]]
    full_df.to_csv(OUT_CSV, index=False)
    print(f"\n✅ Data saved to {OUT_CSV} with {len(full_df)} rows")
else:
    print("❌ No data fetched.")
