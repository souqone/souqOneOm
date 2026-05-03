# Forms Audit — SouqOne Add & Edit Listing Forms

---

## 1. Inventory

### Add Forms Found

| Form Component | File Path | Route |
|----------------|-----------|-------|
| AddCarForm | `features/ads/components/forms/add-car-form.tsx` | `/add-listing/car` |
| AddBusForm | `features/ads/components/forms/add-bus-form.tsx` | `/add-listing/bus` |
| AddEquipmentForm | `features/ads/components/forms/add-equipment-form.tsx` | `/add-listing/equipment` |
| AddOperatorForm | `features/ads/components/forms/add-operator-form.tsx` | `/add-listing/operator` |
| AddPartForm | `features/ads/components/forms/add-part-form.tsx` | `/add-listing/parts` |
| AddServiceForm | `features/ads/components/forms/add-service-form.tsx` | `/add-listing/service` |

**Shared base used by Add:**
- `ListingForm` (`features/ads/components/listing-form.tsx`) — used by AddCarForm and EditCarListingPage
- `MultiStepForm` (`components/ui/multi-step-form.tsx`) — used by all add forms except car

### Edit Forms Found

| Form Component | File Path | Route |
|----------------|-----------|-------|
| EditCarListingPage | `app/[locale]/edit-listing/car/[id]/page.tsx` | `/edit-listing/car/[id]` |
| EditBusForm | `features/ads/components/forms/edit-bus-form.tsx` | `/edit-listing/bus/[id]` |
| EditEquipmentForm | `features/ads/components/forms/edit-equipment-form.tsx` | `/edit-listing/equipment/[id]` |
| EditOperatorForm | `features/ads/components/forms/edit-operator-form.tsx` | `/edit-listing/operator/[id]` |
| EditPartsForm | `features/ads/components/forms/edit-parts-form.tsx` | `/edit-listing/parts/[id]` |
| EditServiceForm | `features/ads/components/forms/edit-service-form.tsx` | `/edit-listing/service/[id]` |
| EditJobPage | `app/[locale]/edit-listing/job/[id]/page.tsx` | `/edit-listing/job/[id]` |

**Shared base used by Edit:**
- `ListingForm` — EditCarListingPage passes `initialData` + `initialImages` to reuse add form
- `GenericEditForm` (`components/generic-edit-form.tsx`) — used by EditBusForm, EditEquipmentForm, EditOperatorForm, EditPartsForm, EditServiceForm
- EditJobPage — fully custom, no shared base, inline `<form>`

### Coverage Matrix

| Entity | Has Add | Has Edit | Share Logic? |
|--------|---------|----------|-------------|
| car | ✅ | ✅ | ✅ (`ListingForm` shared for both add and edit) |
| bus | ✅ | ✅ | ❌ (add = full `MultiStepForm`, edit = thin `GenericEditForm`) |
| equipment | ✅ | ✅ | ❌ (add = full `MultiStepForm`, edit = thin `GenericEditForm`) |
| parts | ✅ | ✅ | ❌ (add = full `MultiStepForm`, edit = thin `GenericEditForm`) |
| service | ✅ | ✅ | ❌ (add = full `MultiStepForm`, edit = thin `GenericEditForm`) |
| operator | ✅ | ✅ | ❌ (add = full `MultiStepForm`, edit = thin `GenericEditForm`) |
| job | ❌ (job posting is at `/jobs/new`) | ✅ | ❌ (edit = custom standalone page) |

---

## 2. Inconsistencies Found

### Layout & Structure

- **Car** (add + edit): thin shell; `ListingForm` owns layout, `MultiStepForm` inside, 3 steps. Page container: `max-w-[900px]`.
- **Bus, Equipment, Parts, Service, Operator** (add): fat self-contained components, `MultiStepForm` directly rendered. Page container inherited from add-listing page: `max-w-[900px]`.
- **Bus, Equipment, Parts, Service, Operator** (edit): rendered inside `GenericEditForm` which has its own `<Navbar>` + `<Footer>` + `<AuthGuard>` + hero banner. Page container: `max-w-[900px]`.
- **Job** (edit): standalone page with its own `<Navbar>` + `<Footer>` + `<AuthGuard>` + hero banner. Page container: `max-w-3xl` (**different** from all others — 768px vs 900px).
- **GenericEditForm** vs custom job edit — both render identical hero banners (same gradient/pattern) but via copy-paste, not shared component.

### Input Styles

All add forms and the job edit page import from `form-styles.ts` and use `inputCls`:
```
w-full bg-surface-container-low dark:bg-surface-container-high/50 border border-outline-variant/10 dark:border-outline-variant/20 rounded-xl py-3 px-4 focus:bg-surface-container-lowest dark:focus:bg-surface-container focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all placeholder:text-on-surface-variant/40
```

`GenericEditForm` also imports `inputCls` from the same file — consistent across all forms.

**No inconsistency in input class.** Every form uses the shared constant.

### Section Headers

All forms use the same pattern:
```jsx
<h2 className={sectionTitleCls}>
  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
  {label}
</h2>
```
Where `sectionTitleCls = 'text-[15px] sm:text-base font-black text-on-surface mb-5 flex items-center gap-2.5 pb-3 border-b border-outline-variant/10'`.

**Consistent across all forms.** ✅

### Submit Button

**`GenericEditForm` (bus, equipment, operator, parts, service edit):**
```jsx
<button
  type="submit"
  disabled={isBusy}
  className="w-full bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
>
```

**`EditJobPage` (job edit):**
```jsx
<button type="submit" disabled={update.isPending}
  className="flex-1 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg">
```
Job edit uses `flex-1` instead of `w-full` because it sits inside a flex row with a Cancel button. Otherwise identical.

**`MultiStepForm`** — submit button is inside the shared wizard component (not repeated in each form).

**Inconsistency:** Job edit has its own Cancel button alongside submit; no other form has this pattern.

### Loading State

| Form | Loading Strategy |
|------|-----------------|
| AddCarForm | `createListing.isPending \|\| uploading` state → `submitLabel` changes to "جارٍ الرفع..." |
| AddBusForm | `createBus.isPending` → MultiStepForm `isLoading` prop |
| AddEquipmentForm | `createEquip.isPending` → MultiStepForm `isLoading` prop |
| AddOperatorForm | `createOp.isPending` → MultiStepForm `isLoading` prop |
| AddPartForm | `createPart.isPending` → MultiStepForm `isLoading` prop (separate uploading tracked via toast) |
| AddServiceForm | `create.isPending` → MultiStepForm `isLoading` prop |
| EditCarListingPage | `updateListing.isPending \|\| uploading` → `submitLabel` changes |
| GenericEditForm | `isUpdating \|\| uploading` → spinner in submit button |
| EditJobPage | `update.isPending` → spinner in submit button |

**Inconsistency:** Only car (add + edit) tracks image upload separately (`uploading` state). Other add forms upload images during submit but do not set a separate uploading state — the loading indicator disappears as soon as the API call completes even if images are still uploading.

### Error Handling

| Form | Error Strategy |
|------|---------------|
| AddCarForm | `setErrorMessages` + `<FormErrorOverlay>` |
| AddBusForm | `setErrorMessages` + `<FormErrorOverlay>` |
| AddEquipmentForm | `addToast('error', ...)` only — **no FormErrorOverlay** |
| AddOperatorForm | `addToast('error', ...)` only — **no FormErrorOverlay** |
| AddPartForm | `setErrorMessages` + `<FormErrorOverlay>` (inside last step only) |
| AddServiceForm | `setErrorMessages` + `<FormErrorOverlay>` (inside last step only) |
| GenericEditForm (5 edit forms) | `addToast('error', ...)` only |
| EditJobPage | `addToast('error', ...)` only |

**Inconsistency:** Equipment and Operator add forms use toast-only for errors; all other add forms use `FormErrorOverlay`. The overlay is also positioned inconsistently — Parts and Service render it inside the last step's `<div>`, while Bus renders it outside `MultiStepForm` entirely.

### Image Upload

| Form | Upload Mechanism | Upload Endpoint | `isPrimary` sent? | Error handling |
|------|-----------------|-----------------|-------------------|---------------|
| AddCarForm | sequential `apiFetch` loop after create | `/uploads/listings/{id}/images` | ✅ | checks `!res.ok`, throws |
| AddBusForm | sequential `apiFetch` loop after create | `/uploads/buses/{id}/images` | ✅ | **no** `res.ok` check |
| AddEquipmentForm | sequential `apiFetch` loop after create | `/uploads/equipment/{id}/images` | ❌ | **no** `res.ok` check |
| AddOperatorForm | ❌ **no image upload** | — | — | — |
| AddPartForm | sequential `apiFetch` loop after create | `/uploads/parts/{id}/images` | ✅ | no explicit `res.ok` check |
| AddServiceForm | sequential `apiFetch` loop after create | `/uploads/services/{id}/images` | ✅ | no explicit `res.ok` check |
| GenericEditForm | sequential `apiFetch` loop + image diff (delete removed) | prop `uploadEndpoint` | ✅ | no explicit `res.ok` check |
| EditCarListingPage | sequential `apiFetch` loop + image diff | `/uploads/listings/{id}/images` | ✅ | checks `!res.ok`, throws |

**Inconsistencies:**
1. Equipment add does not send `isPrimary`.
2. Only car forms check `!res.ok` and throw a meaningful error; all others swallow upload errors.
3. Only car edit + `GenericEditForm` handle image deletion (diff against initial IDs). Equipment add has no such logic.
4. Operator add has no image upload at all.

### Success Redirect

| Form | Redirect |
|------|---------|
| AddCarForm | `/${listingType === 'RENTAL' ? '/rental' : '/sale'}/car/${id}` |
| AddBusForm | `/${busListingType === 'BUS_RENT' ? '/rental' : '/sale'}/bus/${id}` |
| AddEquipmentForm | `/${listingType === 'EQUIPMENT_RENT' ? '/rental' : '/sale'}/equipment/${id}` |
| AddOperatorForm | `/equipment/operators/${id}` |
| AddPartForm | `/sale/part/${id}` |
| AddServiceForm | `/sale/service/${id}` |
| EditCarListingPage | `/sale/car/${id}` (**hardcoded** — ignores rental type) |
| EditBusForm (GenericEditForm) | `/sale/bus/${id}` (**hardcoded** — ignores rental type) |
| EditEquipmentForm (GenericEditForm) | `/sale/equipment/${id}` (**hardcoded**) |
| EditPartsForm | `/sale/part/${id}` |
| EditServiceForm | `/sale/service/${id}` |
| EditOperatorForm | `/equipment/operators/${id}` |
| EditJobPage | `/jobs/${id}` |

**Bug:** Car edit always redirects to `/sale/car/${id}` even if the listing is `RENTAL` type — should go to `/rental/car/${id}`.

### Add vs Edit Differences

**Car:** Edit reuses `ListingForm` with `initialData` and `initialImages` props. `ListingForm` has `useEffect` hooks to auto-sync `initialData` into form state and to auto-select brand/model/year dropdowns from string values. This is the only entity with proper add/edit code sharing.

**Bus, Equipment, Parts, Service, Operator:** Edit uses `GenericEditForm` which is a stripped-down generic field renderer — it only exposes a flat `fields` config array. The add form's multi-step UX (chip selectors, feature toggles, rental-specific fields, location map) is entirely absent in the edit form. Users lose access to most fields after initial creation.

**Job:** Edit has its own full-featured form page (more complete than the GenericEditForm approach) but is entirely separate from any add form.

### City Field Inconsistency

| Form | City input type |
|------|----------------|
| AddBusForm | `<select>` (from `getCities()`) cascaded from governorate |
| AddPartForm | `<select>` (from `getCities()`) cascaded from governorate |
| AddServiceForm | `<select>` (from `getCities()`) cascaded from governorate |
| ListingForm (car) | `<select>` (from `getCities()`) cascaded from governorate |
| AddEquipmentForm | `<input type="text">` — **free text, no select** |
| AddOperatorForm | `<input type="text">` — **free text, no select** |
| EditJobPage | `<input type="text">` — **free text** |

### Governorate Value Storage Inconsistency

| Form | What's stored in DB |
|------|---------------------|
| Most forms | `g.value` (the ISO code) |
| AddEquipmentForm | `g.label` — stores the display label (Arabic text) instead of value |
| AddOperatorForm | `g.label` — stores the display label |

This means equipment and operator records have governorate stored as Arabic text ("مسقط") rather than a code ("muscat"), breaking filter queries that compare against code values.

---

## 3. Form Details

### AddCarForm

- **File:** `features/ads/components/forms/add-car-form.tsx`
- **Route:** `/add-listing/car?type=SALE|RENTAL`
- **Submit API:** `POST /listings` (via `useCreateListing`)

**Architecture:** Thin wrapper — delegates entirely to `ListingForm`. Handles submit, image upload loop, toast, and redirect. Form UI lives in `listing-form.tsx`.

#### Fields Table (from `listing-form.tsx`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| listingType | chip toggle (SALE/RENTAL/WANTED) | ✅ | default from URL `?type=` |
| make | select (brands API) | ✅ | cascades to model |
| model | select (models API) | ✅ | cascades to year |
| year | select (years API) | ✅ | cascades from model |
| condition | chip (NEW/USED/LIKE_NEW) | — | |
| mileage | number input | — | |
| fuelType | select | — | |
| transmission | select | — | |
| bodyType | select | — | |
| exteriorColor | select (with swatch preview) | — | |
| interiorColor | select (with swatch preview) | — | |
| engineSize | text | — | |
| horsepower | number | — | |
| doors | number | — | |
| features | multi-chip (27 options) | — | |
| dailyPrice | number | ✅ if RENTAL | |
| weeklyPrice | number | — | |
| monthlyPrice | number | — | |
| minRentalDays | number | — | default 1 |
| kmLimitPerDay | number | — | |
| depositAmount | number | — | |
| withDriver | checkbox | — | |
| deliveryAvailable | checkbox | — | |
| insuranceIncluded | checkbox | — | |
| cancellationPolicy | select | — | |
| title | text | ✅ | step 3 |
| description | textarea | — | |
| price | number | ✅ if SALE | |
| isPriceNegotiable | checkbox | — | |
| governorate | select | — | |
| city | select (cascaded) | — | |
| latitude/longitude | map picker | — | |
| images | ImageUploader | — | |

#### Section Layout
```
Step 1 — البيانات الأساسية
  [Listing Type toggle]
  [Image Uploader]
  [Brand / Model / Year selects]
  [Condition chips / Mileage]

Step 2 — تفاصيل السيارة والملكية
  [Fuel / Transmission / Body / Drive / Colors selects]
  [Engine / HP / Doors]
  [Features chips (27)]
  [Rental fields: min days / km limit / cancel policy / checkboxes] (RENTAL only)

Step 3 — تفاصيل الإعلان وبيانات الاتصال
  [Title / Description]
  [Pricing section]
  [Governorate / City / Map]
```

#### Input Class Used
```
w-full bg-surface-container-low dark:bg-surface-container-high/50 border border-outline-variant/10
dark:border-outline-variant/20 rounded-xl py-3 px-4 focus:bg-surface-container-lowest
dark:focus:bg-surface-container focus:border-primary/40 focus:ring-2 focus:ring-primary/10
outline-none text-sm transition-all placeholder:text-on-surface-variant/40
```

#### Submit Button Class (inside MultiStepForm)
Handled by `MultiStepForm` component — not inline.

#### Section Header JSX Pattern
```jsx
<h2 className={sectionTitleCls}>
  <span className="material-symbols-outlined text-primary text-lg">sell</span>
  {tp('lfSectionLabel')}
</h2>
```

#### Success Redirect
```
→ /sale/car/{id}   (SALE)
→ /rental/car/{id} (RENTAL)
```

---

### AddBusForm

- **File:** `features/ads/components/forms/add-bus-form.tsx`
- **Route:** `/add-listing/bus?type=`
- **Submit API:** `POST /buses` (via `useCreateBusListing`)

**Architecture:** Fat self-contained component, 4 steps, single `form` object with `set()` helper.

#### Fields Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| busListingType | card selector (4 options) | ✅ step 0 | |
| busType | chip (5 options) | ✅ step 0 | |
| title | text | ✅ step 1 | |
| description | textarea | — | |
| make | text | ✅ step 1 | |
| year | number | ✅ step 1 | |
| capacity | number | ✅ step 1 | |
| model | text | — | |
| mileage | number | — | |
| plateNumber | text | — | |
| fuelType | chip (4 options) | — | |
| transmission | chip (2 options) | — | |
| condition | chip (5 options) | — | default USED |
| features | multi-chip (12 options) | — | |
| price | number | ✅ if SALE | |
| isPriceNegotiable | checkbox | — | |
| contractType | chip (5 options) | — | if BUS_CONTRACT |
| contractClient | text | — | |
| contractMonthly | number | — | |
| contractDuration | number | — | |
| contractExpiry | date | — | |
| dailyPrice | number | ✅ if RENT | |
| monthlyPrice | number | — | |
| minRentalDays | number | — | |
| withDriver | checkbox | — | |
| deliveryAvailable | checkbox | — | |
| insuranceIncluded | checkbox | — | |
| depositAmount | number | — | |
| availableFrom | date | — | |
| availableTo | date | — | |
| cancellationPolicy | textarea | — | |
| governorate | select (cascaded) | — | |
| city | select (cascaded from gov) | — | |
| latitude/longitude | map picker | — | |
| contactPhone | tel (with +968 prefix) | — | |
| whatsapp | tel (with +968 prefix) | — | |
| images | ImageUploader | — | max 10 |

#### Section Layout
```
Step 0 — نوع الإعلان
  [busListingType card grid 2×2]
  [busType chips]

Step 1 — بيانات الباص
  [title / description]
  [make / model / year / capacity / mileage / plateNumber grid]
  [fuel / transmission chips]
  [condition chips]
  [features chips]

Step 2 — السعر / العقد / الإيجار  (conditional per listing type)
  [price + negotiable] (SALE/SALE_WITH_CONTRACT)
  [contract fields grid] (BUS_CONTRACT or SALE_WITH_CONTRACT)
  [rental prices grid + checkboxes + dates] (BUS_RENT)

Step 3 — الموقع والصور
  [governorate / city selects]
  [Map picker]
  [phone / whatsapp with +968 prefix]
  [ImageUploader]
```

#### Success Redirect
```
→ /rental/bus/{id}  (BUS_RENT)
→ /sale/bus/{id}    (all others)
```

---

### AddEquipmentForm

- **File:** `features/ads/components/forms/add-equipment-form.tsx`
- **Route:** `/add-listing/equipment?type=`
- **Submit API:** `POST /equipment` (via `useCreateEquipmentListing`)

**Architecture:** Fat self-contained, 4 steps, individual `useState` per field (not a single form object).

#### Fields Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| listingType | card selector (SALE/RENT) | ✅ step 0 | |
| equipmentType | icon-chip grid (15 options) | ✅ step 0 | |
| title | text | ✅ step 1 | |
| description | textarea | ✅ step 1 | |
| make | text | — | |
| model | text | — | |
| year | number | — | |
| condition | chip (5 options) | — | default USED |
| capacity | text | — | |
| power | text | — | |
| weight | text | — | |
| hoursUsed | number | — | |
| price | number | ✅ if SALE | |
| dailyPrice | number | ✅ if RENT | |
| weeklyPrice | number | — | |
| monthlyPrice | number | — | |
| isPriceNegotiable | checkbox | — | |
| withOperator | checkbox | — | |
| deliveryAvailable | checkbox | — | |
| minRentalDays | number | — | |
| features | text (comma-separated) | — | ⚠️ plain text, not chips |
| depositAmount | number | — | |
| insuranceIncluded | checkbox | — | |
| availableFrom | date | — | |
| availableTo | date | — | |
| cancellationPolicy | textarea | — | |
| governorate | select | — | ⚠️ stores `g.label` not `g.value` |
| city | text input | — | ⚠️ free text, not select |
| latitude/longitude | map picker | — | |
| contactPhone | tel with +968 prefix | — | |
| whatsapp | tel with +968 prefix | — | |
| images | ImageUploader | — | |

#### Section Layout
```
Step 0 — نوع الإعلان
  [SALE / RENT card selector]
  [equipment type icon-chip grid 2×3 to 2×5]

Step 1 — المواصفات
  [title / description]
  [make / model / year / condition / capacity / power / weight / hoursUsed grid]

Step 2 — السعر والموقع
  [price (SALE) or daily/weekly/monthly grid (RENT)]
  [checkboxes: negotiable / operator / delivery]
  [rental extras: min days / features text / deposit / dates / insurance / cancellation]
  [governorate select / city text input]
  [phone / whatsapp]
  [Map picker]

Step 3 — الصور
  [ImageUploader]
```

#### Success Redirect
```
→ /rental/equipment/{id}  (EQUIPMENT_RENT)
→ /sale/equipment/{id}    (EQUIPMENT_SALE)
```

---

### AddOperatorForm

- **File:** `features/ads/components/forms/add-operator-form.tsx`
- **Route:** `/add-listing/operator`
- **Submit API:** `POST /equipment/operators` (via `useCreateOperatorListing`)

**Architecture:** Fat self-contained, 3 steps, individual `useState` per field.

#### Fields Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorType | card selector (4 options) | ✅ step 0 | |
| title | text | ✅ step 1 | |
| description | textarea | ✅ step 1 | |
| experienceYears | number | — | |
| specializations | text (comma-separated) | — | ⚠️ plain text |
| certifications | text (comma-separated) | — | ⚠️ plain text |
| equipmentTypes | multi-chip (12 options) | — | |
| dailyRate | number | — | |
| hourlyRate | number | — | |
| isPriceNegotiable | checkbox | — | |
| governorate | select | — | ⚠️ stores `g.label` not `g.value` |
| city | text input | — | ⚠️ free text |
| latitude/longitude | map picker | — | |
| contactPhone | tel with +968 prefix | — | |
| whatsapp | tel with +968 prefix | — | |
| images | ❌ **no image upload** | — | |

#### Section Layout
```
Step 0 — نوع الخدمة
  [operatorType card grid 2×2]

Step 1 — المعلومات والمهارات
  [title / description]
  [experience / specializations grid]
  [certifications]
  [equipmentTypes multi-chip grid 3×4]

Step 2 — الأسعار والموقع
  [dailyRate / hourlyRate grid]
  [negotiable checkbox]
  [governorate select / city text input]
  [phone / whatsapp]
  [Map picker]
```

#### Success Redirect
```
→ /equipment/operators/{id}
```

---

### AddPartForm

- **File:** `features/ads/components/forms/add-part-form.tsx`
- **Route:** `/add-listing/parts?cat=`
- **Submit API:** `POST /parts` (via `useCreatePart`)

**Architecture:** Fat self-contained, 3 steps, single `form` object with `set()` helper. Unique: uses `useBrands()` API for a dropdown-multi-select with outside-click detection.

#### Fields Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| partCategory | chip grid (11 options) | ✅ step 0 | pre-filled from `?cat=` |
| condition | chip (NEW/USED/REFURBISHED) | — | default USED |
| title | text | ✅ step 0 | |
| images | ImageUploader | — | step 0 |
| partNumber | text | — | step 1 |
| compatibleMakes | multi-select dropdown (from brands API) | — | step 1 |
| yearFrom | select (year options) | — | step 1 |
| yearTo | select (year options) | — | step 1 |
| isOriginal | checkbox | — | step 1 |
| description | textarea | — | step 1 |
| price | number (step 0.01) | ✅ step 2 | |
| isPriceNegotiable | checkbox | — | step 2 |
| governorate | select (cascaded) | — | step 2 |
| city | select (cascaded from gov) | — | step 2 |
| latitude/longitude | map picker | — | step 2 |
| contactPhone | tel with +968 prefix | — | step 2 |
| whatsapp | tel with +968 prefix | — | step 2 |

#### Section Layout
```
Step 0 — الأساسيات
  [breadcrumb indicator]
  [partCategory chip grid]
  [ImageUploader]
  [title input]
  [condition chips]

Step 1 — التفاصيل
  [partNumber]
  [compatibleMakes dropdown (multi-select from API)]
  [yearFrom / yearTo selects]
  [isOriginal checkbox]
  [description textarea]

Step 2 — السعر والموقع
  [price]
  [isPriceNegotiable checkbox]
  [governorate / city cascaded selects]
  [Map picker]
  [phone / whatsapp]
```

#### Success Redirect
```
→ /sale/part/{id}
```

---

### AddServiceForm

- **File:** `features/ads/components/forms/add-service-form.tsx`
- **Route:** `/add-listing/service?type=`
- **Submit API:** `POST /services` (via `useCreateCarService`)

**Architecture:** Fat self-contained, 3 steps, single `form` object with `set()` helper.

#### Fields Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceType | chip grid (9 options) | ✅ step 0 | pre-filled from `?type=` |
| images | ImageUploader | — | step 0 |
| title | text | ✅ step 0 | |
| providerName | text | ✅ step 0 | |
| providerType | chip (4 options) | — | default WORKSHOP |
| description | textarea | — | step 1 |
| priceFrom | number | — | step 1 |
| priceTo | number | — | step 1 |
| isHomeService | checkbox | — | step 1 |
| workingHoursOpen | time | — | step 1, default 08:00 |
| workingHoursClose | time | — | step 1, default 20:00 |
| workingDays | multi-chip (7 days) | — | step 1, default SAT-THU |
| specializations | array | — | not exposed in UI |
| governorate | select (cascaded) | ✅ step 2 | |
| city | select (cascaded from gov) | — | step 2 |
| address | text | — | step 2 |
| latitude/longitude | map picker | — | step 2 |
| contactPhone | tel with +968 prefix | — | step 2 |
| whatsapp | tel with +968 prefix | — | step 2 |
| website | url | — | step 2 |

#### Section Layout
```
Step 0 — الأساسيات
  [serviceType chip grid]
  [ImageUploader]
  [title / providerName]
  [providerType chips]

Step 1 — التفاصيل
  [description]
  [priceFrom / priceTo grid]
  [isHomeService checkbox]
  [workingHoursOpen / workingHoursClose]
  [workingDays chips]

Step 2 — الموقع والتواصل
  [governorate / city selects]
  [address]
  [Map picker]
  [phone / whatsapp]
  [website]
```

#### Success Redirect
```
→ /sale/service/{id}
```

---

### EditCarListingPage

- **File:** `app/[locale]/edit-listing/car/[id]/page.tsx`
- **Route:** `/edit-listing/car/[id]`
- **Submit API:** `PATCH /listings/{id}` (via `useUpdateListing`)

**Architecture:** Reuses `ListingForm` with `initialData` + `initialImages`. Has 4 `useEffect` hooks to auto-select cascaded dropdowns from initial string values. Separately tracks image delete (diff against initial IDs) and new image upload.

#### Add vs Edit Differences
- Same form UI as add
- Pre-fills all fields from API data
- Auto-selects brand/model/year cascade from stored string values
- Handles deleted images (diff against `initialImageIdsRef`)
- submit label changes to "جارٍ الحفظ..." / "جارٍ الرفع..."
- **Bug:** always redirects to `/sale/car/${id}` regardless of listing type

---

### EditBusForm / EditEquipmentForm / EditPartsForm / EditServiceForm / EditOperatorForm

All 5 delegate to `GenericEditForm`.

- **Files:** `features/ads/components/forms/edit-{bus,equipment,operator,parts-form,service}-form.tsx`
- **Routes:** `/edit-listing/{bus,equipment,operator,parts,service}/[id]`
- **Submit APIs:** `PATCH /buses/{id}` / `PATCH /equipment/{id}` / `PATCH /operators/{id}` / `PATCH /parts/{id}` / `PATCH /services/{id}`

**Architecture:** Each defines a `fields: FieldConfig[]` array and passes it to `GenericEditForm`. The generic form renders all fields in a flat `grid-cols-2` layout. Multi-step UX is lost; chip selectors become plain selects; feature toggles are absent; map is absent.

**`GenericEditForm` Submit Button:**
```jsx
className="w-full bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
```

**`GenericEditForm` Section Header JSX:**
```jsx
<h2 className={sectionTitleCls}>
  <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
  {tp('editListingBasicInfo')}
</h2>
```

**Field coverage per edit form:**

| Entity | Edit fields exposed | Notable missing vs add |
|--------|--------------------|-----------------------|
| bus | title, busType, make, model, year, price, passengerCapacity, governorate, description | ALL rental fields, contract fields, features, condition, fuel, transmission, contact |
| equipment | title, equipmentType, make, model, year, price, condition, governorate, description | ALL rental fields, features, hours used, contact |
| operator | title, operatorType, experienceYears, dailyRate, governorate, phone, description | hourlyRate, equipmentTypes, certifications, location map |
| parts | title, partCategory, condition, compatibleMake, compatibleModel, price, governorate, description | yearFrom/To, isOriginal, images |
| service | title, serviceType, price, governorate, phone, description | working hours, working days, isHomeService, providerType, contact |

**`GenericEditForm` uses hardcoded English labels** for all fields (e.g. `'Make'`, `'Model'`, `'Price'`). Add forms use translated keys via `useTranslations`.

---

### EditJobPage

- **File:** `app/[locale]/edit-listing/job/[id]/page.tsx`
- **Route:** `/edit-listing/job/[id]`
- **Submit API:** `PATCH /jobs/{id}` (via `useUpdateJob`)

**Architecture:** Fully custom form — single `form` object, `updateField()` helper, `useEffect` to populate from API. Contains sections: Job Type, Basic Info, Salary, Requirements, Contact. No `GenericEditForm`.

**Submit Button:**
```jsx
className="flex-1 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
```
(Paired with Cancel: `className="bg-surface-container-low border border-outline-variant/20 text-on-surface-variant rounded-2xl px-8 py-3.5 text-sm font-bold hover:border-primary/40 transition-colors"`)

**Page container:** `max-w-3xl` — **inconsistent** with all other forms (`max-w-[900px]`).

---

## 4. What's Already Consistent (keep these)

1. **`inputCls`** — 100% consistent across all forms via `lib/constants/form-styles.ts` import.
2. **`labelCls`** — 100% consistent.
3. **`sectionCls`** — 100% consistent.
4. **`sectionTitleCls`** — 100% consistent.
5. **`chipCls`** — 100% consistent (active/inactive states).
6. **`checkboxLabelCls` / `checkboxCls` / `checkboxTextCls`** — 100% consistent.
7. **Section header JSX pattern** — `<h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">{icon}</span>{label}</h2>` used everywhere.
8. **Phone field pattern** — `🇴🇲 +968` prefix + `rounded-s-none` input used in every form that has phone/whatsapp.
9. **Step navigation** — `window.scrollTo({ top: 0, behavior: 'smooth' })` on every next/back.
10. **`MultiStepForm` wrapper** — all add forms except car use it.
11. **Payload building pattern** — `if (form.field) payload.field = ...` for optional fields.
12. **`LocationPicker` import** — `dynamic(() => import(...), { ssr: false })` everywhere.

---

## 5. Recommended Unified Architecture

### Proposed Shared Components

```
features/ads/components/forms/
  shared/
    FormSection.tsx        ← sectionCls + sectionTitleCls wrapper with icon + title props
    FormInput.tsx          ← labelCls + inputCls + label + error message
    FormSelect.tsx         ← labelCls + inputCls select + cascading support
    FormTextarea.tsx       ← labelCls + inputCls + rows prop
    FormChipGroup.tsx      ← replaces inline chipCls button arrays
    FormToggle.tsx         ← boolean checkbox with checkboxLabelCls/checkboxCls/checkboxTextCls
    FormImageUpload.tsx    ← ImageUploader + upload loop + isPrimary + ok-check error handling
    FormSubmitBar.tsx      ← sticky bottom bar: save button + optional cancel + loading state
    FormPhoneInput.tsx     ← +968 prefix + tel input pattern
    FormLocationBlock.tsx  ← governorate select (value not label) + city cascaded select + LocationPicker
```

### Proposed Add/Edit Pattern

**Recommendation: Option A — Single form with mode prop**, following the car pattern which is the only entity already doing this correctly.

```
Option A: Single form with mode prop
  <BusForm mode="add" />
  <BusForm mode="edit" initialData={data} initialImages={images} />
```

**Rationale:**
- Car already proves this works — `ListingForm` handles both via `initialData`.
- `GenericEditForm` is a dead end — it strips out 80% of the fields and can never match the add form without becoming the add form.
- The `useEffect` sync pattern from `listing-form.tsx` (auto-select cascade from string values) is the right model.
- Avoids maintaining two separate UIs per entity that drift over time (already seeing enum mismatches in parts: `TIRES` in add vs `TIRES_WHEELS` in edit).

### Proposed Unified Input Class

Keep the current `inputCls` from `lib/constants/form-styles.ts` — it is already unified.

```
w-full bg-surface-container-low dark:bg-surface-container-high/50 border border-outline-variant/10
dark:border-outline-variant/20 rounded-xl py-3 px-4 focus:bg-surface-container-lowest
dark:focus:bg-surface-container focus:border-primary/40 focus:ring-2 focus:ring-primary/10
outline-none text-sm transition-all placeholder:text-on-surface-variant/40
```

### High-priority fixes (before architecture refactor)

1. **Fix governorate storage** in AddEquipmentForm + AddOperatorForm: change `g.label` → `g.value`.
2. **Fix car edit redirect** to respect rental type.
3. **Fix upload error handling** in AddBusForm, AddEquipmentForm — add `!res.ok` check.
4. **Fix enum mismatch** in EditPartsForm: `TIRES_WHEELS` → `TIRES`, `TRANSMISSION` not in add form.
5. **Fix city field** in AddEquipmentForm + AddOperatorForm: replace free-text input with cascaded select.
6. **Unify `max-w`**: EditJobPage uses `max-w-3xl`; change to `max-w-[900px]`.

---

## 6. Effort Estimate

| Task | Files Affected | Complexity |
|------|---------------|------------|
| Fix governorate `g.label` → `g.value` (equipment + operator add) | 2 | Low |
| Fix car edit redirect for rental | 1 | Low |
| Fix upload `!res.ok` checks (bus, equipment add) | 2 | Low |
| Fix parts enum mismatch in edit form | 1 | Low |
| Fix city field (equipment + operator: text → cascaded select) | 2 | Low |
| Unify max-w in job edit page | 1 | Low |
| Translate GenericEditForm field labels (hardcoded EN → i18n) | 5 edit forms + GenericEditForm | Medium |
| Build `FormSection`, `FormInput`, `FormSelect`, etc. shared components | 8 new files | Medium |
| Refactor `FormSubmitBar` (extract from GenericEditForm + EditJobPage) | 3 | Medium |
| Merge bus add+edit into single `BusForm mode=add\|edit` | 2 | High |
| Merge equipment add+edit into single form | 2 | High |
| Merge parts add+edit into single form | 2 | High |
| Merge service add+edit into single form | 2 | High |
| Merge operator add+edit into single form | 2 | High |
| Unify image upload helper (loop + isPrimary + ok-check + diff) | All forms | Medium |
| Add image upload to EditOperatorForm | 1 | Low |
