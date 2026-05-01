import json
import csv
import os

# Arabic translations
arabic_translations = {
    "brand": "العلامة التجارية",
    "model": "الموديل", 
    "category": "الفئة",
    "type": "النوع",
    "years": "السنوات",
    "Car": "سيارة",
    "Passenger Vehicle": "مركبة ركاب",
    "Various": "متنوع"
}

# Load existing data
with open('full_car_dataset.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create Arabic version
arabic_data = []
for item in data:
    arabic_item = {
        "العلامة التجارية": item["brand"],
        "الموديل": item["model"],
        "الفئة": "سيارة",
        "النوع": "مركبة ركاب",
        "السنوات": item["years"]
    }
    arabic_data.append(arabic_item)

# Save Arabic JSON
with open('full_car_dataset_arabic.json', 'w', encoding='utf-8') as f:
    json.dump(arabic_data, f, ensure_ascii=False, indent=2)

# Save Arabic CSV
with open('full_car_dataset_arabic.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['العلامة التجارية', 'الموديل', 'الفئة', 'النوع', 'السنوات'])
    for item in arabic_data:
        years_str = ",".join(map(str, item["السنوات"]))
        writer.writerow([item['العلامة التجارية'], item['الموديل'], item['الفئة'], item['النوع'], years_str])

print("✅ Arabic dataset created!")
print(f"📄 Arabic JSON: full_car_dataset_arabic.json")
print(f"📄 Arabic CSV: full_car_dataset_arabic.csv")
print(f"📊 Total records: {len(arabic_data)}")

# Show sample
print("\n📋 Sample Arabic data:")
for i, item in enumerate(arabic_data[:3]):
    print(f"{i+1}. {item['العلامة التجارية']} {item['الموديل']} - {item['الفئة']}")

# Compare file sizes
json_size = os.path.getsize('full_car_dataset_arabic.json') / 1024
csv_size = os.path.getsize('full_car_dataset_arabic.csv') / 1024
print(f"\n📏 File sizes:")
print(f"   Arabic JSON: {json_size:.2f} KB")
print(f"   Arabic CSV: {csv_size:.2f} KB")
