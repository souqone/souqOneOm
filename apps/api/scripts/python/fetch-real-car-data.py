"""
Fetch REAL car data from NHTSA API (free, no API key needed)
https://vpic.nhtsa.dot.gov/api/
"""
import json, csv, urllib.request, urllib.parse, time

BASE = "https://vpic.nhtsa.dot.gov/api/vehicles"

def fetch_json(url):
    url = urllib.parse.quote(url, safe=':/?&=')
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

# Step 1: Get all makes (brands)
print("Step 1/2: Fetching all car brands from NHTSA...")
data = fetch_json(f"{BASE}/GetAllMakes?format=json")
all_makes = data["Results"]
print(f"   Found {len(all_makes)} total makes")

# Filter to passenger vehicle makes only (not motorcycle, trailer, etc.)
print("   Filtering to passenger car makes...")
car_makes_data = fetch_json(f"{BASE}/GetMakesForVehicleType/car?format=json")
car_make_ids = set(m["MakeId"] for m in car_makes_data["Results"])

# Also get truck makes
truck_makes_data = fetch_json(f"{BASE}/GetMakesForVehicleType/truck?format=json")
truck_make_ids = set(m["MakeId"] for m in truck_makes_data["Results"])

# Also get SUV/MPV
mpv_makes_data = fetch_json(f"{BASE}/GetMakesForVehicleType/multipurpose passenger vehicle (mpv)?format=json")
mpv_make_ids = set(m["MakeId"] for m in mpv_makes_data["Results"])

valid_ids = car_make_ids | truck_make_ids | mpv_make_ids
car_makes = [m for m in all_makes if m["Make_ID"] in valid_ids]
print(f"   Filtered to {len(car_makes)} car/truck/SUV makes")

# Sort by name
car_makes.sort(key=lambda x: x["Make_Name"])

# Step 2: Get models for each brand
print("\nStep 2/2: Fetching models for each brand...")
dataset = []
errors = []

for i, make in enumerate(car_makes):
    make_id = make["Make_ID"]
    make_name = make["Make_Name"]
    
    try:
        models_data = fetch_json(f"{BASE}/GetModelsForMakeId/{make_id}?format=json")
        models = models_data["Results"]
        
        if models:
            for model in models:
                dataset.append({
                    "brand": make_name,
                    "brandId": make_id,
                    "model": model["Model_Name"],
                    "modelId": model["Model_ID"],
                })
        
        if (i + 1) % 50 == 0:
            print(f"   {i + 1}/{len(car_makes)} brands processed...")
            time.sleep(0.5)  # Be nice to the API
        
    except Exception as e:
        errors.append(f"{make_name}: {str(e)}")
        continue

print(f"\n✅ Fetched {len(dataset)} brand-model combinations")
print(f"   From {len(set(d['brand'] for d in dataset))} unique brands")
if errors:
    print(f"   ⚠️  {len(errors)} errors (skipped)")

# Save JSON
with open('nhtsa_car_data.json', 'w', encoding='utf-8') as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

# Save CSV
with open('nhtsa_car_data.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['brand', 'brandId', 'model', 'modelId'])
    for item in dataset:
        w.writerow([item['brand'], item['brandId'], item['model'], item['modelId']])

# Save brands summary
brands_summary = []
brand_counts = {}
for d in dataset:
    if d['brand'] not in brand_counts:
        brand_counts[d['brand']] = 0
    brand_counts[d['brand']] += 1

for brand, count in sorted(brand_counts.items()):
    brands_summary.append({"brand": brand, "modelCount": count})

with open('nhtsa_brands_summary.json', 'w', encoding='utf-8') as f:
    json.dump(brands_summary, f, ensure_ascii=False, indent=2)

print(f"\nFiles saved:")
print(f"  - nhtsa_car_data.json ({len(dataset)} records)")
print(f"  - nhtsa_car_data.csv")
print(f"  - nhtsa_brands_summary.json ({len(brands_summary)} brands)")
print(f"\nTop 20 brands by model count:")
for b in sorted(brands_summary, key=lambda x: x['modelCount'], reverse=True)[:20]:
    print(f"  {b['brand']}: {b['modelCount']} models")
