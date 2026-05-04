# Forms Audit — SouqOne Add & Edit Listing Forms

> **Read-only audit** — no files were modified.
> Generated: 2026-05-04

---

## 1. Inventory

### Add Forms Found

| Form Component | File Path | Route |
|---|---|---|
| `AddCarForm` | `features/ads/components/forms/add-car-form.tsx` | `/add-listing/car` |
| `ListingForm` *(real car form)* | `features/ads/components/listing-form.tsx` | *(used by AddCarForm + EditCarListingPage)* |
| `AddBusForm` | `features/ads/components/forms/add-bus-form.tsx` | `/add-listing/bus` |
| `AddEquipmentForm` | `features/ads/components/forms/add-equipment-form.tsx` | `/add-listing/equipment` |
| `AddOperatorForm` | `features/ads/components/forms/add-operator-form.tsx` | `/add-listing/operator` |
| `AddPartForm` | `features/ads/components/forms/add-part-form.tsx` | `/add-listing/parts` |
| `AddServiceForm` | `features/ads/components/forms/add-service-form.tsx` | `/add-listing/service` |

### Edit Forms Found

| Form Component | File Path | Route |
|---|---|---|
| `EditCarListingPage` *(inline)* | `app/[locale]/edit-listing/car/[id]/page.tsx` | `/edit-listing/car/[id]` |
| `EditBusForm` | `features/ads/components/forms/edit-bus-form.tsx` | `/edit-listing/bus/[id]` |
| `EditEquipmentForm` | `features/ads/components/forms/edit-equipment-form.tsx` | `/edit-listing/equipment/[id]` |
| `EditOperatorForm` | `features/ads/components/forms/edit-operator-form.tsx` | `/edit-listing/operator/[id]` |
| `EditPartsForm` | `features/ads/components/forms/edit-parts-form.tsx` | `/edit-listing/parts/[id]` |
| `EditServiceForm` | `features/ads/components/forms/edit-service-form.tsx` | `/edit-listing/service/[id]` |

### Shared Infrastructure

| Component | File Path | Role |
|---|---|---|
| `GenericEditForm` | `components/generic-edit-form.tsx` | Shared edit engine for bus/equipment/operator/parts/service |
| `ImageUploader` | `features/ads/components/image-uploader.tsx` | Shared image uploader for ALL forms |
| `form-styles.ts` | `lib/constants/form-styles.ts` | Shared CSS class constants |
| `MultiStepForm` | `components/ui/multi-step-form.tsx` | Shared step wrapper |

### Coverage Matrix

| Entity | Has Add Form | Has Edit Form | Share Logic? |
|---|---|---|---|
| car | ✅ `AddCarForm` (wrapper) + `ListingForm` (real) | ✅ `EditCarListingPage` reuses `ListingForm` | ✅ Yes — same `ListingForm` component |
| bus | ✅ `AddBusForm` (30 KB, self-contained) | ✅ `EditBusForm` → `GenericEditForm` | ❌ No — completely separate implementations |
| equipment | ✅ `AddEquipmentForm` (self-contained) | ✅ `EditEquipmentForm` → `GenericEditForm` | ❌ No |
| operator | ✅ `AddOperatorForm` (self-contained) | ✅ `EditOperatorForm` → `GenericEditForm` | ❌ No |
| parts | ✅ `AddPartForm` (self-contained) | ✅ `EditPartsForm` → `GenericEditForm` | ❌ No |
| service | ✅ `AddServiceForm` (self-contained) | ✅ `EditServiceForm` → `GenericEditForm` | ❌ No |
| job | ❌ No dedicated form | ✅ `edit-listing/job/[id]/page.tsx` exists | N/A |

---

## 2. Inconsistencies Found

### 2.1 State Management Pattern

Three different patterns across forms:

| Pattern | Used By |
|---|---|
| Object state + generic `set<K>()` helper | `ListingForm`, `AddBusForm`, `AddPartForm`, `AddServiceForm` |
| Individual `useState` per field | `AddEquipmentForm`, `AddOperatorForm` |
| `GenericEditForm` flat `Record<string, any>` | All edit forms except car |

**AddEquipmentForm** uses 20+ individual `useState` calls instead of an object:
```tsx
// add-equipment-form.tsx (individual states — 20+ lines)
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [make, setMake] = useState('');
// ... 17 more
```

vs the cleaner object pattern:
```tsx
// add-bus-form.tsx / add-part-form.tsx / listing-form.tsx
const [form, setForm] = useState({ title: '', ... });
function set<K>(key: K, value) { setForm(prev => ({ ...prev, [key]: value })); }
```

### 2.2 Input Class — All Forms Use the Same (✅ Consistent)

All forms import and use `inputCls` from `lib/constants/form-styles.ts`:
```ts
export const inputCls =
  'w-full bg-surface-container-low dark:bg-surface-container-high/50 border border-outline-variant/10 dark:border-outline-variant/20 rounded-xl py-3 px-4 focus:bg-surface-container-lowest dark:focus:bg-surface-container focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all placeholder:text-on-surface-variant/40';
```

**Exception:** `GenericEditForm` submit button uses a **different** class not in `form-styles.ts`:
```tsx
// generic-edit-form.tsx line 245
className="w-full bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
```

### 2.3 Section Header — All Forms Use the Same (✅ Consistent)

All forms use `sectionTitleCls` from `form-styles.ts`:
```ts
export const sectionTitleCls =
  'text-[15px] sm:text-base font-black text-on-surface mb-5 flex items-center gap-2.5 pb-3 border-b border-outline-variant/10';
```

Used as:
```tsx
<h2 className={sectionTitleCls}>
  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
  {sectionTitle}
</h2>
```

### 2.4 Submit Button — Inconsistent

| Form | Submit Button Class |
|---|---|
| `ListingForm` | Delegated to `MultiStepForm` (no direct button) |
| `AddBusForm` | Delegated to `MultiStepForm` |
| `AddEquipmentForm` | Delegated to `MultiStepForm` |
| `AddPartForm` | Delegated to `MultiStepForm` |
| `AddServiceForm` | Delegated to `MultiStepForm` |
| `AddOperatorForm` | Delegated to `MultiStepForm` |
| `GenericEditForm` | `"w-full bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"` |

→ `GenericEditForm` is the only form with a standalone submit button (not inside `MultiStepForm`).

### 2.5 Loading State — Inconsistent

| Form | Loading Behavior |
|---|---|
| `AddCarForm` | `createListing.isPending \|\| uploading` passed as `isLoading` to `ListingForm` |
| `AddBusForm` | `createBus.isPending` only — no separate `uploading` state |
| `AddEquipmentForm` | `createEquip.isPending` only |
| `AddPartForm` | `createPart.isPending` (uploading handled silently) |
| `AddServiceForm` | `create.isPending` only |
| `GenericEditForm` | `isUpdating \|\| uploading` with spinner icon |
| `EditCarListingPage` | `updateListing.isPending \|\| uploading` |

**Inconsistency:** Only `AddCarForm` and `EditCarListingPage` track image upload loading separately. Other add forms upload images after API call without disabling the UI.

### 2.6 Error Handling — Inconsistent

| Form | Error Display |
|---|---|
| `AddCarForm` → `ListingForm` | `<FormErrorOverlay>` — modal overlay, triggered by `setErrorMessages` array |
| `AddBusForm` | `<FormErrorOverlay>` — same overlay pattern |
| `AddEquipmentForm` | `addToast('error', msg)` — toast notification |
| `AddOperatorForm` | `addToast('error', msg)` |
| `AddPartForm` | `<FormErrorOverlay>` |
| `AddServiceForm` | `<FormErrorOverlay>` |
| `GenericEditForm` | `addToast('error', msg)` |
| `EditCarListingPage` | `setErrorMessages` → passed to `ListingForm`'s `FormErrorOverlay` |

→ **Mixed** — equipment/operator/operator use `toast`, others use `FormErrorOverlay`.

### 2.7 Image Upload — Mostly Consistent

All forms that support images use `ImageUploader` component + `POST /uploads/{entity}/{id}/images` via `apiFetch`. Upload happens **after** the listing is created.

| Form | Image Upload Endpoint | Tracks Delete? |
|---|---|---|
| `AddCarForm` | `POST /uploads/listings/{id}/images` | ❌ (add only) |
| `AddBusForm` | `POST /uploads/buses/{id}/images` | ❌ |
| `AddEquipmentForm` | `POST /uploads/equipment/{id}/images` | ❌ |
| `AddPartForm` | `POST /uploads/parts/{id}/images` | ❌ |
| `AddServiceForm` | `POST /uploads/services/{id}/images` | ❌ |
| `EditCarListingPage` | `POST /uploads/listings/{id}/images` | ✅ via `useRemoveListingImage` |
| `GenericEditForm` | `uploadEndpoint` prop | ✅ via `deleteImageFn` prop |
| `AddOperatorForm` | ❌ No image upload | N/A |

### 2.8 Success Redirect

| Form | Redirect |
|---|---|
| `AddCarForm` | `/sale/car/{id}` or `/rental/car/{id}` based on `listingType` |
| `AddBusForm` | `/sale/bus/{id}` or `/rental/bus/{id}` (no WANTED type) |
| `AddEquipmentForm` | `/sale/equipment/{id}` or `/rental/equipment/{id}` |
| `AddOperatorForm` | `/equipment/operators/{id}` (always) |
| `AddPartForm` | `/sale/part/{id}` (always) |
| `AddServiceForm` | `/sale/service/{id}` (always) |
| `EditCarListingPage` | `/sale/car/{id}` (ignores original listingType — **BUG**) |
| `EditBusForm` | `/sale/bus/{id}` (hardcoded — ignores RENTAL type — **BUG**) |
| `EditEquipmentForm` | `/sale/equipment/{id}` (hardcoded — ignores RENTAL type — **BUG**) |
| `EditPartsForm` | `/sale/part/{id}` |
| `EditServiceForm` | `/sale/service/{id}` |
| `EditOperatorForm` | `/equipment/operators/{id}` |

### 2.9 Add vs Edit Differences

**Car:** Edit reuses `ListingForm` exactly — 3 `useEffect`s in `ListingForm` auto-select brand/model/governorate dropdowns from `initialData`:
```tsx
// listing-form.tsx lines 156-174
useEffect(() => {
  if (!initialData?.make || !brands.length || selectedBrandId) return;
  const match = brands.find(b => b.name.toLowerCase() === initialData.make!.toLowerCase());
  if (match) setSelectedBrandId(match.id);
}, [brands, initialData?.make, selectedBrandId]);
```

**Bus/Equipment/Operator/Parts/Service:** Edit uses `GenericEditForm` which pre-fills via a **synchronous check** (anti-pattern — runs during render):
```tsx
// generic-edit-form.tsx lines 66-86
if (item && !initialized) {
  const initial: Record<string, any> = {};
  fields.forEach((f) => { initial[f.name] = item[f.name] ?? ''; });
  setFormData(initial);
  // ...
  setInitialized(true);
}
```

**Edit form field labels are English only** — hardcoded strings, not using `useTranslations`:
```tsx
// edit-bus-form.tsx lines 16-31
const fields = [
  { name: 'title', label: tp('editListingTitle'), required: true },
  { name: 'make', label: 'Make' },      // ← hardcoded English
  { name: 'model', label: 'Model' },    // ← hardcoded English
  { name: 'year', label: 'Year', type: 'number' as const },
  // ...
];
```

**Edit forms expose far fewer fields** than add forms — only basic editable subset. Full multi-step wizard is not reused.

---

## 3. Form Details

### 3.1 AddCarForm + ListingForm

- **File (wrapper):** `features/ads/components/forms/add-car-form.tsx`
- **File (real form):** `features/ads/components/listing-form.tsx`
- **Route:** `/add-listing/car?type=SALE|RENTAL`
- **Submit API:** `POST /listings` via `useCreateListing`

#### Fields Table

| Field | Type | Required | Notes |
|---|---|---|---|
| `listingType` | chip toggle | Yes | SALE / RENTAL / WANTED |
| `make` | select (brand) | Yes | Via `useBrands` API |
| `model` | select (model) | Yes | Depends on brand |
| `year` | select | Yes | Depends on model |
| `condition` | chip | No | NEW / USED / LIKE_NEW |
| `mileage` | number | No | |
| `fuelType` | select | No | |
| `transmission` | select | No | |
| `bodyType` | select | No | |
| `driveType` | select | No | |
| `exteriorColor` | select + color swatch | No | |
| `interiorColor` | select + color swatch | No | |
| `engineSize` | text | No | e.g. "2.5L" |
| `horsepower` | number | No | |
| `doors` | number | No | |
| `features` | multi-chip | No | 27 feature keys |
| `title` | text | Yes (step 3) | |
| `description` | textarea | No | |
| `price` | number | Conditional | Required for SALE |
| `isPriceNegotiable` | checkbox | No | SALE only |
| `dailyPrice` | number | Conditional | RENTAL only, required |
| `weeklyPrice` | number | No | RENTAL |
| `monthlyPrice` | number | No | RENTAL |
| `depositAmount` | number | No | RENTAL |
| `minRentalDays` | number | No | RENTAL, default 1 |
| `kmLimitPerDay` | number | No | RENTAL |
| `withDriver` | checkbox | No | RENTAL |
| `deliveryAvailable` | checkbox | No | RENTAL |
| `insuranceIncluded` | checkbox | No | RENTAL |
| `cancellationPolicy` | select | No | RENTAL |
| `governorate` | select | No | |
| `city` | select | No | Depends on governorate |
| `latitude` / `longitude` | map picker | No | |
| images | ImageUploader | No | Max 10 |

#### Section Layout
```
Step 1 — البيانات الأساسية:
  [نوع الإعلان toggle: SALE / RENTAL / WANTED]
  [Listing Type breadcrumb display]
  [ImageUploader]
  [Brand, Model, Year grid]
  [Condition chips, Mileage]

Step 2 — تفاصيل السيارة:
  [FuelType, Transmission]
  [BodyType, DriveType, ExteriorColor]
  [InteriorColor]
  [EngineSize, Horsepower, Doors]
  [Features chip grid — 27 items]
  [Rental details section — RENTAL only]

Step 3 — تفاصيل الإعلان:
  [Title, Description]
  [Pricing — adaptive: SALE / RENTAL / WANTED]
  [Governorate, City]
  [LocationPicker map]
```

#### Input Class Used
```
inputCls = 'w-full bg-surface-container-low dark:bg-surface-container-high/50 border border-outline-variant/10 dark:border-outline-variant/20 rounded-xl py-3 px-4 focus:bg-surface-container-lowest dark:focus:bg-surface-container focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all placeholder:text-on-surface-variant/40'
```

#### Section Header JSX Pattern
```jsx
<h2 className={sectionTitleCls}>
  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
  {tp('sectionTitle')}
</h2>
```

#### Submit Button
Delegated to `MultiStepForm` — no direct button in `ListingForm`.

#### Success Redirect
```
→ /sale/car/{id}    (listingType = SALE or WANTED)
→ /rental/car/{id}  (listingType = RENTAL)
```

---

### 3.2 AddBusForm

- **File:** `features/ads/components/forms/add-bus-form.tsx`
- **Route:** `/add-listing/bus`
- **Submit API:** `POST /buses` via `useCreateBusListing`

#### Fields Table

| Field | Type | Required | Notes |
|---|---|---|---|
| `busListingType` | card selector | Yes | BUS_SALE / BUS_SALE_WITH_CONTRACT / BUS_RENT / BUS_CONTRACT |
| `busType` | chip | Yes | MINI_BUS / MEDIUM_BUS / LARGE_BUS / COASTER / SCHOOL_BUS |
| `title` | text | Yes | |
| `description` | textarea | No | Defaults to title |
| `make` | text (free) | Yes | Unlike car — free text not API select |
| `model` | text | No | |
| `year` | number | Yes | |
| `capacity` | number | Yes | |
| `mileage` | number | No | |
| `fuelType` | chip | No | |
| `transmission` | chip | No | |
| `condition` | chip | No | |
| `features` | chip multi-select | No | 12 bus features |
| `plateNumber` | text | No | |
| `price` | number | SALE | |
| `isPriceNegotiable` | checkbox | No | SALE |
| `contractType` | chip | No | CONTRACT/SALE_WITH_CONTRACT |
| `contractClient` | text | No | |
| `contractMonthly` | number | No | |
| `contractDuration` | number | No | months |
| `contractExpiry` | date | No | |
| `dailyPrice` | number | RENT | |
| `monthlyPrice` | number | RENT | |
| `minRentalDays` | number | No | |
| `withDriver` | checkbox | No | RENT |
| `deliveryAvailable` | checkbox | No | |
| `depositAmount` | number | No | |
| `insuranceIncluded` | checkbox | No | |
| `availableFrom` | date | No | |
| `availableTo` | date | No | |
| `cancellationPolicy` | textarea | No | |
| `requestPassengers` | number | No | CONTRACT |
| `requestRoute` | text | No | CONTRACT |
| `requestSchedule` | select | No | CONTRACT |
| `governorate` | select | No | |
| `city` | select | No | |
| `latitude` / `longitude` | map | No | |
| `contactPhone` | tel + prefix | No | 🇴🇲 +968 prefix |
| `whatsapp` | tel + prefix | No | 🇴🇲 +968 prefix |
| images | ImageUploader | No | Max 10 |

#### Section Layout
```
Step 0 — نوع الإعلان:
  [BusListingType card grid 2-col]
  [BusType chip row]

Step 1 — بيانات الباص:
  [Title, Description]
  [Brand(free), Model, Year, Capacity, Mileage, PlateNumber grid]
  [FuelType chips, Transmission chips]
  [Condition chips]
  [Features chip grid — 12 items]

Step 2 — السعر/التفاصيل (adaptive):
  [Sale: Price + Negotiable checkbox]
  [Contract: ContractType, Client, Monthly, Duration, Expiry]
  [Contract request: Passengers, Schedule, Route, Budget]
  [Rental: Daily, Monthly, MinDays, Driver/Delivery/Insurance, Deposit, Dates, Cancellation]

Step 3 — الموقع والصور:
  [Governorate, City selects]
  [LocationPicker]
  [Phone, WhatsApp with +968 prefix]
  [ImageUploader]
```

#### Success Redirect
```
→ /sale/bus/{id}    (BUS_SALE / BUS_SALE_WITH_CONTRACT / BUS_CONTRACT)
→ /rental/bus/{id}  (BUS_RENT)
```

---

### 3.3 AddEquipmentForm

- **File:** `features/ads/components/forms/add-equipment-form.tsx`
- **Route:** `/add-listing/equipment`
- **Submit API:** `POST /equipment` via `useCreateEquipmentListing`

#### Fields Table

| Field | Type | Required | Notes |
|---|---|---|---|
| `listingType` | card selector | Yes | EQUIPMENT_SALE / EQUIPMENT_RENT |
| `equipmentType` | icon card grid | Yes | 15 types |
| `title` | text | Yes | |
| `description` | textarea | Yes | |
| `make` | text | No | |
| `model` | text | No | |
| `year` | number | No | |
| `condition` | chip | No | |
| `capacity` | text | No | e.g. "20 ton" |
| `power` | text | No | e.g. "150 HP" |
| `weight` | text | No | e.g. "22,000 kg" |
| `hoursUsed` | number | No | |
| `price` | number | SALE | |
| `dailyPrice` | number | RENT | |
| `weeklyPrice` | number | No | RENT |
| `monthlyPrice` | number | No | RENT |
| `isPriceNegotiable` | checkbox | No | |
| `withOperator` | checkbox | No | |
| `deliveryAvailable` | checkbox | No | |
| `minRentalDays` | number | No | RENT |
| `features` | text (comma-separated) | No | **Not chip selector** — raw input |
| `depositAmount` | number | No | RENT |
| `availableFrom` | date | No | RENT |
| `availableTo` | date | No | RENT |
| `insuranceIncluded` | checkbox | No | RENT |
| `cancellationPolicy` | textarea | No | RENT |
| `governorate` | select | No | Saves `g.label` not `g.value` — **inconsistency** |
| `city` | text (free) | No | **Not a select** — unlike car/bus/part/service |
| `latitude` / `longitude` | map | No | |
| `contactPhone` | tel + prefix | No | |
| `whatsapp` | tel + prefix | No | |
| images | ImageUploader | No | |

#### Section Layout
```
Step 0 — النوع:
  [ListingType card 2-col]
  [EquipmentType icon cards grid 2-5 col]

Step 1 — المواصفات:
  [Title, Description]
  [Make, Model, Year, Condition, Capacity, Power, Weight, HoursUsed grid]

Step 2 — السعر والموقع:
  [Sale: Price OR Rental: Daily/Weekly/Monthly]
  [Negotiable, WithOperator, Delivery checkboxes]
  [MinRentalDays (RENT)]
  [Features text input (comma-sep), Deposit, AvailFrom, AvailTo, Insurance, Cancellation (RENT)]
  [Governorate select, City text, Phone, WhatsApp]
  [LocationPicker]

Step 3 — الصور:
  [ImageUploader]
```

---

### 3.4 AddOperatorForm

- **File:** `features/ads/components/forms/add-operator-form.tsx`
- **Route:** `/add-listing/operator`
- **Submit API:** `POST /equipment/operators` via `useCreateOperatorListing`
- **No image upload**

#### Section Layout
```
Step 0 — النوع:
  [OperatorType card grid 2-col]

Step 1 — المعلومات:
  [Title, Description]
  [ExperienceYears, Specializations]
  [Certifications]
  [EquipmentTypes chip grid 3-4 col]

Step 2 — السعر والموقع:
  [DailyRate, HourlyRate]
  [Negotiable checkbox]
  [Governorate select, City text]
  [Phone, WhatsApp]
  [LocationPicker]
```

#### Success Redirect
```
→ /equipment/operators/{id}
```

---

### 3.5 AddPartForm

- **File:** `features/ads/components/forms/add-part-form.tsx`
- **Route:** `/add-listing/parts?cat={category}`
- **Submit API:** `POST /parts` via `useCreatePart`

#### Section Layout
```
Step 0 — الأساسي:
  [Category breadcrumb display]
  [PartCategory chip grid]
  [ImageUploader]
  [Title, Condition chips]

Step 1 — التفاصيل:
  [PartNumber (OEM)]
  [CompatibleMakes — custom dropdown with checkboxes from useBrands]
  [YearFrom, YearTo selects]
  [IsOriginal checkbox]
  [Description]

Step 2 — السعر والموقع:
  [Price, Negotiable]
  [Governorate, City selects]
  [LocationPicker]
  [Phone, WhatsApp]
```

#### Success Redirect
```
→ /sale/part/{id}
```

---

### 3.6 AddServiceForm

- **File:** `features/ads/components/forms/add-service-form.tsx`
- **Route:** `/add-listing/service?type={serviceType}`
- **Submit API:** `POST /car-services` via `useCreateCarService`

#### Section Layout
```
Step 0 — الأساسي:
  [ServiceType chip grid 2-3 col]
  [ImageUploader]
  [Title, ProviderName, ProviderType chips]

Step 1 — التفاصيل:
  [Description]
  [PriceFrom, PriceTo]
  [IsHomeService checkbox]
  [WorkingHoursOpen, WorkingHoursClose]
  [WorkingDays chip row]

Step 2 — الموقع:
  [Governorate, City selects]
  [Address text]
  [LocationPicker]
  [Phone, WhatsApp]
  [Website URL]
```

#### Success Redirect
```
→ /sale/service/{id}
```

---

### 3.7 Edit Forms (Bus / Equipment / Operator / Parts / Service)

All 5 edit forms follow **identical pattern** — thin wrapper (~40-50 lines) around `GenericEditForm`:

```tsx
// Pattern (all 5 forms):
export function EditXxxForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useXxxListing(id);
  const update = useUpdateXxxListing();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: tp('editListingTitle'), required: true },
    { name: 'make', label: 'Make' },          // ← English labels
    // ...
  ];

  return (
    <GenericEditForm
      item={data as Record<string, any>}
      fields={fields}
      updateFn={(payload) => update.mutateAsync({ id, data: payload })}
      isUpdating={update.isPending}
      redirectPath={`/sale/{entity}/${id}`}
      uploadEndpoint={`/uploads/{entity}/${id}/images`}
      deleteImageFn={(imageId) => removeXxxImage.mutateAsync(imageId)}
    />
  );
}
```

**Pre-fill mechanism in `GenericEditForm`:**
```tsx
// generic-edit-form.tsx lines 66-86 — synchronous during render (anti-pattern)
if (item && !initialized) {
  const initial: Record<string, any> = {};
  fields.forEach((f) => { initial[f.name] = item[f.name] ?? ''; });
  setFormData(initial);
  if (item.images?.length) { /* ... */ }
  setInitialized(true);
}
```

**GenericEditForm submit button:**
```tsx
className="w-full bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
```

**GenericEditForm loading state:**
```tsx
{isBusy ? (
  <span className="flex items-center justify-center gap-2">
    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
    {tp('editListingUploading')}
  </span>
) : (
  <span className="flex items-center justify-center gap-2">
    <span className="material-symbols-outlined text-base">save</span>
    {tp('editListingSave')}
  </span>
)}
```

---

### 3.8 EditCarListingPage

- **File:** `app/[locale]/edit-listing/car/[id]/page.tsx`
- **Route:** `/edit-listing/car/[id]`
- **Submit API:** `PATCH /listings/{id}` via `useUpdateListing`

Directly reuses `ListingForm` with full `initialData` object. Pre-fill handled by 3 `useEffect`s inside `ListingForm`.

Image pre-fill:
```tsx
const existingImages: UploadedImage[] = (car.images || [])
  .sort((a, b) => aOrder - bOrder)
  .map((img, i) => ({
    id: img.id,
    url: getImageUrl(img.url) || img.url,
    isPrimary: img.isPrimary,
    order: i,
  }));
```

---

## 4. ImageUploader — Full API

**File:** `features/ads/components/image-uploader.tsx`

### Type
```ts
export interface UploadedImage {
  id?: string;        // DB id (existing images from server)
  url: string;        // Preview URL (blob:) or remote URL
  file?: File;        // Local File object (new uploads only)
  isPrimary: boolean;
  order: number;
}
```

### Props
```ts
interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;   // default 10
  disabled?: boolean;   // default false
}
```

### Accepted File Types
- `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Max size: **10 MB** per file

### Features
- **Drag-and-drop zone** — detects `Files` type on `dragenter`
- **Reorder by drag** — drag between image items; first item auto-becomes primary
- **Set primary** — hover overlay button; marks `isPrimary=true` for that item
- **Remove** — hover overlay delete button
- **Primary badge** — shown on first/primary image
- **Order badge** — index number shown bottom-left
- **Upload progress indicator** — pulsing bar for `img.file && !img.id` (new, not yet saved)

### Usage Pattern (across all forms)
```tsx
const [images, setImages] = useState<UploadedImage[]>([]);

// Add form: start empty
<ImageUploader images={images} onChange={setImages} />

// Edit form: pre-populate with existing
const existingImages: UploadedImage[] = item.images.map(img => ({
  id: img.id,
  url: getImageUrl(img.url) || img.url,
  isPrimary: img.isPrimary,
  order: i,
}));
const [images, setImages] = useState(existingImages);
<ImageUploader images={images} onChange={setImages} />
```

### Upload Pattern (post-submit loop)
```tsx
for (const img of images) {
  if (img.file) {  // only new files
    const fd = new FormData();
    fd.append('file', img.file);
    fd.append('isPrimary', String(img.isPrimary));
    await apiFetch(`/uploads/{entity}/{id}/images`, { method: 'POST', body: fd });
  }
}
```

---

## 5. What's Already Consistent (keep these)

1. **`inputCls`** — identical across all 6 add forms + 2 edit engines
2. **`labelCls`** — identical (`text-[13px] font-bold text-on-surface-variant block mb-2.5`)
3. **`sectionCls`** + **`sectionTitleCls`** — same structure everywhere
4. **`chipCls(active)`** — same function for all toggle/multi-select chips
5. **`MultiStepForm`** — all 6 add forms use the same wrapper
6. **`ImageUploader`** — same component with same API everywhere
7. **Phone field pattern** — `🇴🇲 +968` prefix + `rounded-s-none` input, consistent across bus/equipment/operator/part/service
8. **`apiFetch` for image upload** — same pattern in all forms
9. **`useTranslations('pages')`** — all forms use the same namespace
10. **`window.scrollTo({ top: 0, behavior: 'smooth' })`** on step change — all `MultiStepForm` usages

---

## 6. Recommended Unified Architecture

### Proposed Shared Components

```
features/ads/components/forms/
  shared/
    FormSection.tsx       ← sectionCls + sectionTitleCls + icon + title
    FormInput.tsx         ← inputCls + labelCls + error state
    FormSelect.tsx        ← inputCls + labelCls + options
    FormTextarea.tsx      ← inputCls + labelCls + resize-none
    FormToggle.tsx        ← checkboxLabelCls + checkboxCls + checkboxTextCls
    FormChipGroup.tsx     ← chipCls multi/single select
    FormPhoneInput.tsx    ← 🇴🇲 +968 prefix + tel input pattern
    FormImageUpload.tsx   ← thin wrapper around ImageUploader
    FormSubmitBar.tsx     ← sticky bottom submit + loading state
    FormErrorDisplay.tsx  ← unified: FormErrorOverlay OR toast based on config
```

### Proposed Add/Edit Pattern

**Option A: Single form with `mode` prop** — ideal for bus/equipment/parts/service since add forms have full field sets and edit forms currently expose only a subset.

```tsx
<BusForm mode="add" />
<BusForm mode="edit" initialData={data} id={id} />
```

**Option B: Shared hook** — more flexible but more complex.

```tsx
const { fields, onSubmit, isLoading } = useBusForm('edit', data);
```

**Recommendation: Option A** — fits the codebase. Car already does this with `ListingForm`. The pattern is proven and `initialData` pre-fill via `useEffect` works reliably. Extend it to bus/equipment/parts/service.

### Proposed Unified Input Class
Keep the current `inputCls` from `lib/constants/form-styles.ts` — it's already consistent. No change needed.

---

## 7. Effort Estimate

| Task | Files Affected | Complexity |
|---|---|---|
| Fix edit form label translations (English → AR) | 5 edit forms | **Low** |
| Fix edit form redirect bugs (RENTAL type) | 2 forms (bus, equipment) | **Low** |
| Unify error handling (toast vs overlay) | 6 files | **Low** |
| Unify loading state (track uploading in all add forms) | 4 add forms | **Low** |
| Fix equipment `governorate` save (label vs value) | 1 form | **Low** |
| Fix equipment `city` (free text → cascading select) | 1 form | **Low** |
| Build `FormPhoneInput` shared component | 1 new + 5 edits | **Low** |
| Build `FormSection` + `FormChipGroup` shared | 2 new + 6 edits | **Medium** |
| Refactor `AddEquipmentForm` state (individual → object) | 1 form | **Low** |
| Fix `GenericEditForm` pre-fill (synchronous → useEffect) | 1 file | **Low** |
| Merge add+edit for bus (BusForm with mode prop) | 1 new + 2 delete | **High** |
| Merge add+edit for equipment | 1 new + 2 delete | **High** |
| Merge add+edit for parts | 1 new + 2 delete | **High** |
| Merge add+edit for service | 1 new + 2 delete | **High** |
| Merge add+edit for operator | 1 new + 2 delete | **Medium** |
