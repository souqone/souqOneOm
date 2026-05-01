import json
import csv
import os

def test_csv_file():
    print("=== Testing CSV File ===")
    if not os.path.exists('full_car_dataset.csv'):
        print("❌ CSV file not found")
        return False
    
    try:
        with open('full_car_dataset.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)  # Read header
            print(f"✅ Headers: {headers}")
            
            count = 0
            brands = set()
            for row in reader:
                if len(row) == 5:  # Check row structure
                    brands.add(row[0])
                    count += 1
                else:
                    print(f"❌ Invalid row structure: {row}")
                    return False
            
            print(f"✅ Total records: {count}")
            print(f"✅ Unique brands: {len(brands)}")
            print(f"✅ Sample brands: {list(brands)[:5]}")
            
            # Test specific record
            f.seek(0)
            next(reader)  # Skip header
            first_row = next(reader)
            print(f"✅ First record: {first_row}")
            
            return True
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return False

def test_json_file():
    print("\n=== Testing JSON File ===")
    if not os.path.exists('full_car_dataset.json'):
        print("❌ JSON file not found")
        return False
    
    try:
        with open('full_car_dataset.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"✅ Data type: {type(data)}")
        print(f"✅ Total records: {len(data)}")
        
        if len(data) > 0:
            first_record = data[0]
            print(f"✅ First record keys: {list(first_record.keys())}")
            print(f"✅ First record: {first_record}")
            
            # Check record structure
            required_keys = ['brand', 'model', 'category', 'type', 'years']
            for key in required_keys:
                if key not in first_record:
                    print(f"❌ Missing key: {key}")
                    return False
            
            # Check years format
            years = first_record['years']
            if isinstance(years, list) and len(years) > 0:
                print(f"✅ Years range: {years[0]}-{years[-1]} ({len(years)} years)")
            else:
                print(f"❌ Invalid years format: {years}")
                return False
            
            # Count unique brands
            brands = set(record['brand'] for record in data)
            print(f"✅ Unique brands: {len(brands)}")
            print(f"✅ Sample brands: {list(brands)[:5]}")
        
        return True
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return False

def compare_file_sizes():
    print("\n=== File Sizes ===")
    csv_size = os.path.getsize('full_car_dataset.csv') / 1024  # KB
    json_size = os.path.getsize('full_car_dataset.json') / 1024  # KB
    
    print(f"📄 CSV: {csv_size:.2f} KB")
    print(f"📄 JSON: {json_size:.2f} KB")
    print(f"📊 CSV is {json_size/csv_size:.1f}x smaller than JSON")

if __name__ == "__main__":
    print("🚀 Testing Car Dataset Files\n")
    
    csv_ok = test_csv_file()
    json_ok = test_json_file()
    
    if csv_ok and json_ok:
        compare_file_sizes()
        print("\n✅ All tests passed! Dataset is ready to use.")
    else:
        print("\n❌ Some tests failed. Please check the files.")
