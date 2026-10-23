# convert_dataset.py - Run this once to convert your file
import pandas as pd
import os

def convert_dataset():
    input_path = 'Datasets/Agmarknet_Price_Report.xls'
    output_path = 'Datasets/Agmarknet_Price_Report.csv'
    
    try:
        # Read as text file first
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        print("File content sample:")
        print(content[:500])
        
        # Try to detect delimiter
        lines = content.split('\n')
        first_line = lines[0] if lines else ''
        
        # Count common delimiters
        delimiters = {',': first_line.count(','), 
                     '\t': first_line.count('\t'),
                     ';': first_line.count(';'),
                     '|': first_line.count('|')}
        
        best_delimiter = max(delimiters, key=delimiters.get)
        print(f"Detected delimiter: '{best_delimiter}'")
        
        # Read as CSV with detected delimiter
        df = pd.read_csv(input_path, delimiter=best_delimiter, encoding='utf-8')
        print(f"✅ Successfully read {len(df)} records")
        
        # Save as proper CSV
        df.to_csv(output_path, index=False)
        print(f"✅ Converted to CSV: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return False

if __name__ == '__main__':
    convert_dataset()