import json
import csv

# Comprehensive car dataset with 300+ brands and models
# Remove duplicates by converting to set and back to list
all_brands = [
        # Luxury brands
        "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Cadillac", 
        "Genesis", "Infiniti", "Jaguar", "Lamborghini", "Land Rover", "Lexus", "Lincoln", 
        "Lucid", "Maserati", "McLaren", "Mercedes-Benz", "Polestar", "Porsche", "Rolls-Royce", 
        "Tesla", "Volvo",
        
        # European brands
        "ABT", "Alpine", "Ariel", "BAC", "Caterham", "Dacia", "DS", "Ferrari", "Fiat", "Ford",
        "Honda", "Hyundai", "Isuzu", "Iveco", "Jeep", "Kia", "Lada", "Lancia", 
        "MG", "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Renault", 
        "Seat", "Skoda", "Smart", "SsangYong", "Subaru", "Suzuki", "Toyota", "Vauxhall", 
        "Volkswagen",
        
        # American brands
        "Buick", "Chevrolet", "Chrysler", "Dodge", "GMC", "Hummer", 
        "Mercury", "Oldsmobile", "Plymouth", "Pontiac", "Ram", "Saturn",
        
        # Asian brands
        "Daihatsu", "Lexus", 
        "Toyota",
        
        # Chinese brands
        "BYD", "Changan", "Chery", "FAW", "Geely", "Great Wall", "Haval", "Hongqi", "Jac", 
        "Li Auto", "NIO", "Qoros", "Roewe", "SAIC", "Xpeng",
        
        # Indian brands
        "Mahindra", "Tata",
        
        # Korean brands
        "Hyundai", "Kia", "SsangYong",
        
        # Malaysian brands
        "Perodua", "Proton",
        
        # Russian brands
        "UAZ",
        
        # Specialty/Sports brands
        "Ariel", "Ascari", "BAC", "Gumpert", "Hennessey", "Koenigsegg", "Lotus", 
        "Pagani", "Rimac", "Spyker", "TVR", "Ultima", 
        "Vector", "Wiesmann", "Zenvo",
        
        # Classic/Vintage brands
        "Austin", "Citroën", "Datsun", "Hillman", 
        "Morris", "Rover", "Saab", "Standard", "Triumph",
        
        # Truck/Van brands
        "MAN", "Scania", "DAF", 
        "Hino", "Mitsubishi Fuso", "UD Trucks",
        
        # Additional global brands
        "Abarth", "Adria", "Alpina", "Arash", "Arrinera", "Ashok Leyland", 
        "Austin-Healey", "Bizzarrini", "Borgward", 
        "Brilliance", "Caterham", 
        "Daewoo", "De Tomaso", 
        "Donkervoort", "Fisker", "Force", "GAC", 
        "GAZ", "Gillet", "Ginetta", "Haval", 
        "Holden", "Hummer", "Innocenti", 
        "JAC", "KTM", "LDV", 
        "Marcos", "Maybach", "Microcar", "Morgan", "Noble", "Oltcit", 
        "Pininfarina", "Polestar", 
        "Proton", "Qoros", "Rally", "Renault", "Rezvani", "Rolls-Royce", 
        "Saleen", "Scion", "Shelby", "Skoda", 
        "Steyr", "Tata", 
        "Trabant", "UAZ", "Venturi", 
        "Wartburg", "Wiesmann", "Zastava", "ZIL"
]

car_data = {
    "brands": list(set(all_brands)),  # Remove duplicates
    "models": {
        # Toyota models
        "Toyota": ["Camry", "Corolla", "Prius", "RAV4", "Highlander", "Sienna", "Tacoma", "Tundra", 
                  "Yaris", "Avalon", "C-HR", "Venza", "Sequoia", "4Runner", "Land Cruiser", 
                  "GR Supra", "GR86", "Mirai", "bZ4X", "Crown"],
        
        # Honda models
        "Honda": ["Accord", "Civic", "CR-V", "Pilot", "Odyssey", "HR-V", "Fit", "Ridgeline", 
                 "Insight", "Clarity", "Passport", "Element", "S2000", "NSX", "Prelude", "Crosstour"],
        
        # Ford models
        "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Fusion", "Focus", "Edge", "Expedition", 
                "Ranger", "Transit", "Bronco", "Maverick", "EcoSport", "Taurus", "C-Max", 
                "Flex", "GT", "Shelby GT500"],
        
        # Chevrolet models
        "Chevrolet": ["Silverado", "Malibu", "Equinox", "Tahoe", "Suburban", "Traverse", "Camaro", 
                     "Corvette", "Blazer", "Colorado", "Spark", "Sonic", "Impala", "Cruze", 
                     "Volt", "Bolt EV", "Trax"],
        
        # BMW models
        "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "2 Series", "4 Series", 
               "6 Series", "8 Series", "Z4", "i3", "i4", "iX", "i8", "M3", "M5", "X3 M", "X5 M"],
        
        # Mercedes-Benz models
        "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "A-Class", "CLA", "CLS", "GLA", "GLC", 
                         "GLE", "GLS", "G-Class", "SLK", "SL", "AMG GT", "EQS", "EQC", "EQA", 
                         "EQB", "Maybach S-Class"],
        
        # Audi models
        "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "TT", "R8", 
                "e-tron", "e-tron GT", "Q4 e-tron", "S3", "S4", "S5", "S6", "S7", "S8", 
                "RS3", "RS4", "RS5", "RS6", "RS7", "SQ5", "SQ7"],
        
        # Volkswagen models
        "Volkswagen": ["Golf", "Jetta", "Passat", "Tiguan", "Atlas", "Beetle", "Arteon", "Taos", 
                      "ID.4", "ID.3", "Polo", "Touareg", "CC", "Eos", "Routan", "Tiguan Allspace"],
        
        # Nissan models
        "Nissan": ["Altima", "Sentra", "Maxima", "Rogue", "Murano", "Pathfinder", "Armada", 
                  "Frontier", "Titan", "Leaf", "Kicks", "Versa", "370Z", "GT-R", "Quest", 
                  "NV200", "Ariya"],
        
        # Hyundai models
        "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona", "Venue", 
                   "Accent", "Veloster", "Genesis G70", "Genesis G80", "Genesis G90", "Ioniq 5", 
                   "Ioniq 6", "Nexo", "Santa Cruz"],
        
        # Kia models
        "Kia": ["Optima", "Forte", "Sorento", "Sportage", "Telluride", "Carnival", "Rio", 
               "Soul", "Stinger", "K5", "Seltos", "EV6", "Niro", "Stonic", "Mohave"],
        
        # Mazda models
        "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "CX-30", "MX-5 Miata", "CX-50", 
                 "CX-90", "Mazda2", "Mazda5", "RX-7", "RX-8", "Millenia", "Protege"],
        
        # Subaru models
        "Subaru": ["Outback", "Forester", "Impreza", "Legacy", "Crosstrek", "Ascent", "BRZ", 
                  "WRX", "STI", "Tribeca", "Baja", "SVX", "XT", "GL", "Loyale"],
        
        # Mitsubishi models
        "Mitsubishi": ["Outlander", "Eclipse Cross", "Mirage", "Lancer", "Galant", "Endeavor", 
                      "Montero", "Raider", "i-MiEV", "ASX", "Pajero", "Shogun", "Lancer Evolution"],
        
        # Lexus models
        "Lexus": ["ES", "LS", "GS", "IS", "NX", "RX", "GX", "LX", "UX", "RC", "LC", "CT", 
                 "HS", "SC", "LFA", "IS F", "RC F", "GX 460", "LX 570"],
        
        # Infiniti models
        "Infiniti": ["Q50", "Q60", "Q70", "QX50", "QX55", "QX60", "QX80", "Q30", "QX30", 
                    "G35", "G37", "M35", "M37", "EX35", "EX37", "JX35", "FX35", "FX37", "FX50"],
        
        # Acura models
        "Acura": ["ILX", "TLX", "RLX", "MDX", "RDX", "NSX", "TSX", "RSX", "Legend", "Vigor", 
                 "Integra", "CL", "SLX", "ZDX"],
        
        # Volvo models
        "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "XC40 Recharge", 
                 "C40", "S40", "S70", "S80", "V50", "V70", "XC70", "C30", "C70"],
        
        # Jaguar models
        "Jaguar": ["XE", "XF", "XJ", "F-Pace", "E-Pace", "I-Pace", "F-Type", "X-Type", "S-Type", 
                  "XJR", "XK", "XKR", "XFR", "XFR-S", "XJ6", "XJ8", "XJ12"],
        
        # Land Rover models
        "Land Rover": ["Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", 
                      "Discovery", "Discovery Sport", "Defender", "LR2", "LR3", "LR4", "Freelander"],
        
        # Porsche models
        "Porsche": ["911", "718 Cayman", "718 Boxster", "Panamera", "Macan", "Cayenne", "Taycan", 
                   "918 Spyder", "Carrera GT", "911 GT3", "911 Turbo", "911 Targa", "718 Spyder", 
                   "911 GT2 RS", "911 Dakar"],
        
        # Tesla models
        "Tesla": ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster", "Semi"],
        
        # Additional popular models for other brands
        "Jeep": ["Wrangler", "Cherokee", "Grand Cherokee", "Renegade", "Compass", "Gladiator", 
                "Patriot", "Liberty", "Commander"],
        
        "Ram": ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
        
        "Dodge": ["Challenger", "Charger", "Durango", "Journey", "Grand Caravan", "Viper", 
                 "Magnum", "Avenger", "Caliber", "Nitro", "Dakota"],
        
        "Buick": ["Enclave", "Envision", "Encore", "LaCrosse", "Regal", "Verano", "Lucerne", 
                 "Terraza", "Rainier", "Rendezvous", "Centurion"],
        
        "GMC": ["Sierra", "Acadia", "Terrain", "Yukon", "Canyon", "Savana", "Envoy", "Jimmy", 
               "Sonoma", "Syclone", "Typhoon"],
        
        "Cadillac": ["Escalade", "XT5", "XT4", "CT4", "CT5", "XT6", "Lyriq", "Celestiq", 
                    "DeVille", "Fleetwood", "Eldorado", "Seville", "Cimarron", "Allante", 
                    "Brougham", "Catera", "CTS", "STS", "XLR", "SRX"],
        
        "Lincoln": ["Navigator", "Aviator", "Corsair", "Nautilus", "MKC", "MKZ", "MKS", "MKX", 
                   "MKT", "Continental", "Town Car", "LS", "Blackwood", "Mark LT", "Zephyr"],
        
        "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20", "GranTurismo", "GranCabrio", 
                    "Biturbo", "Spyder", "Coupe", "3200 GT", "4200 GT", "Shamal", "Ghibli II"],
        
        "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "4C", "8C", "Giulietta", "MiTo", "156", 
                      "166", "147", "GT", "Brera", "Spider", "159"],
        
        "Fiat": ["500", "500X", "500L", "Panda", "Tipo", "Punto", "Bravo", "Idea", "Linea", 
                "Palio", "Siena", "Strada", "Uno", "Tempra", "Croma", "Doblò", "Fiorino", 
                "Qubo", "Freemont"],
        
        "Mini": ["Cooper", "Clubman", "Countryman", "Paceman", "Coupe", "Roadster", "Convertible", 
                "Hardtop", "John Cooper Works", "GP", "Electric"],
        
        "Bentley": ["Continental GT", "Flying Spur", "Bentayga", "Mulsanne", "Azure", "Arnage", 
                   "Brooklands", "Turbo R", "Eight", "Continental", "T2", "S1", "S2", "S3"],
        
        "Rolls-Royce": ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Silver Shadow", 
                       "Silver Spirit", "Silver Spur", "Corniche", "Camargue", "Park Ward", 
                       "Silver Cloud", "Silver Seraph", "Goodwood"],
        
        "Lamborghini": ["Huracán", "Aventador", "Urus", "Gallardo", "Murciélago", "Diablo", 
                       "Countach", "Miura", "Jalpa", "Silhouette", "Urraco", "Jarama", "Espada", 
                       "Islero", "400 GT", "350 GT"],
        
        "Ferrari": ["488", "458", "F8", "Portofino", "Roma", "SF90", "812", "GTC4", "FF", 
                   "California", "LaFerrari", "Enzo", "F40", "F50", "288 GTO", "308", "328", 
                   "348", "355", "360", "430", "512", "Testarossa", "Mondial", "Maranello"],
        
        "McLaren": ["720S", "570S", "600LT", "765LT", "Artura", "GT", "P1", "650S", "12C", 
                   "MP4-12C", "570GT", "540C", "675LT", "F1", "Senna", "Speedtail", "Elva", 
                   "Sabre", "Gulf", "720S Spider"],
        
        "Aston Martin": ["DB11", "Vantage", "DBS", "DBX", "Vanquish", "Rapide", "Virage", 
                        "DB9", "V12 Vantage", "V8 Vantage", "DB7", "DBS Superleggera", 
                        "Valhalla", "Valkyrie", "Victor", "Zagato"],
        
        "Bugatti": ["Chiron", "Veyron", "Divo", "Centodieci", "La Voiture Noire", "Bolide", 
                   "EB110", "Type 35", "Type 41", "Type 57", "Atlantic", "Atalante"]
    }
}

# Create structured dataset
structured_data = []
for brand in car_data["brands"]:
    if brand in car_data["models"]:
        # Add all models for brands with specific models
        for model in car_data["models"][brand]:
            structured_data.append({
                "brand": brand,
                "model": model,
                "category": "Car",
                "type": "Passenger Vehicle",
                "years": list(range(1980, 2027))
            })
    else:
        # Add brand entry without specific models
        structured_data.append({
            "brand": brand,
            "model": "Various",
            "category": "Car",
            "type": "Passenger Vehicle",
            "years": list(range(1980, 2027))
        })

# Check if files already exist
import os
json_exists = os.path.exists('full_car_dataset.json')
csv_exists = os.path.exists('full_car_dataset.csv')

if json_exists or csv_exists:
    print("⚠️  Warning: Files already exist!")
    response = input("Overwrite existing files? (y/n): ").lower()
    if response != 'y':
        print("Operation cancelled.")
        exit()

# Save as JSON
with open('full_car_dataset.json', 'w', encoding='utf-8') as f:
    json.dump(structured_data, f, ensure_ascii=False, indent=2)

# Save as CSV
with open('full_car_dataset.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['brand', 'model', 'category', 'type', 'years'])
    for item in structured_data:
        years_str = ",".join(map(str, item["years"]))
        writer.writerow([item['brand'], item['model'], item['category'], item['type'], years_str])

# Print summary
print(f"Full dataset created with {len(structured_data)} records")
print(f"Total brands in list: {len(car_data['brands'])}")
print(f"Brands with models: {len(car_data['models'])}")

# Count unique brands in the generated data
unique_brands_in_data = set(item['brand'] for item in structured_data)
print(f"Unique brands in generated data: {len(unique_brands_in_data)}")

# Show which brands are missing
missing_brands = set(car_data['brands']) - unique_brands_in_data
if missing_brands:
    print(f"Missing brands: {missing_brands}")

print("Files saved: full_car_dataset.json and full_car_dataset.csv")
print("\nSample data:")
for i, item in enumerate(structured_data[:5]):
    print(f"{i+1}. {item['brand']} {item['model']} - Years: {item['years'][0]}-{item['years'][-1]}")
