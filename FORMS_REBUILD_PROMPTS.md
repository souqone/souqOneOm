# SouqOne — Forms Rebuild Prompts
> مبني على نتائج `docs/forms-audit.md`
> شغّل على branch جديد: `git checkout -b feature/forms-rebuild`

---

## 📋 فهرس

1. [برومبت ١ — الشيرد كومبوننتس](#prompt-1)
2. [برومبت ٢ — إصلاح المشاكل الحرجة](#prompt-2)
3. [برومبت ٣ — ريبيلد فورم السيارات](#prompt-3)
4. [برومبت ٤ — ريبيلد فورم الباصات](#prompt-4)
5. [برومبت ٥ — ريبيلد فورم المعدات](#prompt-5)
6. [برومبت ٦ — ريبيلد فورم قطع الغيار](#prompt-6)
7. [برومبت ٧ — ريبيلد فورم الخدمات](#prompt-7)
8. [برومبت ٨ — ريبيلد فورم المشغّلين](#prompt-8)
9. [برومبت ٩ — صفحة اختيار النوع](#prompt-9)

> **القاعدة:** شغّل برومبت واحد، تحقق من `typecheck`، بعدين الجاي.

---

<a name="prompt-1"></a>
## برومبت ١ — بناء Shared Form Components

> **افعل أولاً** — كل البرومبات التانية تعتمد على هذه الكومبوننتس

```
Read docs/forms-audit.md fully before writing any code.
Also read:
- apps/web/src/lib/constants/form-styles.ts
- apps/web/src/app/globals.css (design tokens)
- apps/web/src/features/ads/components/image-uploader.tsx

---

## GOAL
Build a shared component library at:
`apps/web/src/features/ads/components/forms/shared/`

These components will be used by ALL 6 rebuilt forms. Build them once, build them right.

---

## COMPONENTS TO BUILD

### 1. FormSection.tsx
```tsx
interface FormSectionProps {
  icon: string          // material-symbols icon name
  title: string         // Arabic title
  children: React.ReactNode
  className?: string
}
```
- Uses existing `sectionCls` + `sectionTitleCls` from form-styles.ts
- Icon: `<span className="material-symbols-outlined text-primary text-lg">`
- Responsive: full width on all breakpoints

---

### 2. FormField.tsx
Wrapper that renders label + field slot + error message:
```tsx
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}
```
- Label: uses `labelCls` from form-styles.ts
- Required star: `<span className="text-error">*</span>` after label
- Error: `<p className="text-error text-xs mt-1.5 flex items-center gap-1">` + error icon
- Hint: `<p className="text-on-surface-variant/60 text-xs mt-1">` below field

---

### 3. FormInput.tsx
```tsx
interface FormInputProps {
  label: string
  name: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date'
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  suffix?: React.ReactNode    // e.g. "ر.ع" or icon
  prefix?: React.ReactNode    // e.g. phone flag
  disabled?: boolean
  min?: number
  max?: number
  className?: string
}
```
- Uses `inputCls` from form-styles.ts
- Suffix renders inside input on the left (RTL)
- Prefix renders inside input on the right (RTL)
- Number type: hide spin arrows with `[appearance:textfield]`
- Focus ring using `focus:ring-2 focus:ring-primary/10`

---

### 4. FormSelect.tsx
```tsx
interface SelectOption {
  value: string
  label: string
  icon?: string    // optional emoji or icon
}

interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}
```
- Uses `inputCls` from form-styles.ts
- Native `<select>` element — NOT Radix (keeps it simple and mobile-friendly)
- RTL: `dir="rtl"` on select
- Placeholder option: `value=""` + `disabled` + `hidden`
- Chevron icon on the left side (RTL) using `appearance-none` + background icon

---

### 5. FormTextarea.tsx
```tsx
interface FormTextareaProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  rows?: number          // default 4
  maxLength?: number
  showCount?: boolean    // show char count if maxLength set
  disabled?: boolean
}
```
- Uses `inputCls` + `resize-none`
- Char count: `{value.length} / {maxLength}` aligned to the left (RTL = start)

---

### 6. FormChipGroup.tsx
```tsx
interface ChipOption {
  value: string
  label: string
  icon?: string     // material-symbols icon or emoji
}

interface FormChipGroupProps {
  label?: string
  options: ChipOption[]
  value: string | string[]    // string = single select, string[] = multi
  onChange: (value: string | string[]) => void
  multiSelect?: boolean       // default false
  required?: boolean
  error?: string
  columns?: 2 | 3 | 4 | 'auto'   // grid columns
  size?: 'sm' | 'md' | 'lg'      // default 'md'
}
```
- Uses `chipCls(active)` function from form-styles.ts
- Single: clicking selected chip deselects it
- Multi: any number can be active
- Grid layout: `grid-cols-2 sm:grid-cols-{columns}`
- Active state: `bg-primary/10 border-primary text-primary font-bold`
- Inactive: `bg-surface-container border-outline-variant/20 text-on-surface`

---

### 7. FormToggle.tsx
```tsx
interface FormToggleProps {
  label: string
  description?: string    // optional subtitle
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}
```
- Full-width clickable row (not just the checkbox)
- Uses `checkboxLabelCls` from form-styles.ts
- Visual: label on right (RTL), toggle/checkbox on left
- Add subtle hover background: `hover:bg-surface-container-low rounded-xl px-3`

---

### 8. FormPhoneInput.tsx
```tsx
interface FormPhoneInputProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
}
```
- Prefix block: `🇴🇲 +968` — `bg-surface-container rounded-s-none` on the left (RTL = end)
- Input: `type="tel"` with `rounded-e-none` on the right (RTL = start)
- Combined with flex row, shared border
- Exactly matches current phone pattern from audit (keep it consistent)

---

### 9. FormPriceInput.tsx
```tsx
interface FormPriceInputProps {
  label: string
  name: string
  value: number | ''
  onChange: (value: number | '') => void
  required?: boolean
  error?: string
  hint?: string
  showNegotiable?: boolean
  isNegotiable?: boolean
  onNegotiableChange?: (v: boolean) => void
}
```
- Number input with `ر.ع` suffix (RTL: on the left side)
- If `showNegotiable=true`: renders a `FormToggle` below for "السعر قابل للتفاوض"
- Positive numbers only (`min={0}`)

---

### 10. FormSubmitBar.tsx
```tsx
interface FormSubmitBarProps {
  onBack?: () => void          // undefined = hide back button
  onNext?: () => void          // undefined = use type="submit"
  isLastStep?: boolean
  isLoading?: boolean
  loadingText?: string         // default "جاري الحفظ..."
  nextLabel?: string           // default "التالي"
  submitLabel?: string         // default "نشر الإعلان"
  backLabel?: string           // default "السابق"
}
```

Layout (sticky bottom bar):
```
┌──────────────────────────────────────────┐
│  [ ← السابق ]        [ التالي ← ]       │
└──────────────────────────────────────────┘
```
- `sticky bottom-0 bg-surface/95 backdrop-blur border-t border-outline-variant/10 py-4 px-4`
- Back: `btn-secondary` or ghost button — hidden on step 0
- Next/Submit: `btn-brand` — full width on mobile, auto width on desktop
- Loading: spinner icon + loadingText, button disabled
- Submit button: green (`btn-success`) with checkmark icon on last step

---

### 11. FormErrorDisplay.tsx
```tsx
interface FormErrorDisplayProps {
  errors: string[]
  onClose: () => void
}
```
- Replaces `FormErrorOverlay` — same visual but unified
- Slide-down banner at top of form (not modal)
- Red background, list of errors, × close button
- Auto-scrolls to top when shown

---

## EXPORT

Create `apps/web/src/features/ads/components/forms/shared/index.ts`:
```ts
export { FormSection } from './FormSection'
export { FormField } from './FormField'
export { FormInput } from './FormInput'
export { FormSelect } from './FormSelect'
export { FormTextarea } from './FormTextarea'
export { FormChipGroup } from './FormChipGroup'
export { FormToggle } from './FormToggle'
export { FormPhoneInput } from './FormPhoneInput'
export { FormPriceInput } from './FormPriceInput'
export { FormSubmitBar } from './FormSubmitBar'
export { FormErrorDisplay } from './FormErrorDisplay'
```

---

## RESPONSIVE RULES (apply to all components)

- Mobile first — all layouts work from 320px width
- Touch targets: minimum 44px height on all interactive elements
- Input font size: minimum `text-sm` (16px on mobile prevents iOS zoom)
- Grid fields: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Full-width on mobile, constrained on desktop
- All RTL: labels right-aligned, icons on correct side, flex direction preserved

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
Must be 0 errors. Report each component built.
```

---

<a name="prompt-2"></a>
## برومبت ٢ — إصلاح المشاكل الحرجة

> شغّله بعد برومبت ١

```
Read docs/forms-audit.md section "2. Inconsistencies" and "Critical Issues" before starting.

Fix these bugs in order. Each fix is small and isolated.

---

## FIX 1 — Edit redirect bug (Bus + Equipment ignore RENTAL type)

File: `features/ads/components/forms/edit-bus-form.tsx`
Current: `redirectPath="/sale/bus/${id}"` — always goes to /sale
Fix:
```tsx
const redirectPath = data?.busListingType === 'BUS_RENT'
  ? `/rental/bus/${id}`
  : `/sale/bus/${id}`;
```
Pass `redirectPath` dynamically to `GenericEditForm`.

File: `features/ads/components/forms/edit-equipment-form.tsx`
Same fix:
```tsx
const redirectPath = data?.listingType === 'EQUIPMENT_RENT'
  ? `/rental/equipment/${id}`
  : `/sale/equipment/${id}`;
```

---

## FIX 2 — GenericEditForm pre-fill anti-pattern

File: `components/generic-edit-form.tsx`

Current (synchronous setState during render — React anti-pattern):
```tsx
if (item && !initialized) {
  setFormData(initial);
  setInitialized(true);
}
```

Fix — replace with useEffect:
```tsx
useEffect(() => {
  if (!item || initialized) return;
  const initial: Record<string, string> = {};
  fields.forEach((f) => { initial[f.name] = String(item[f.name] ?? ''); });
  setFormData(initial);
  if (item.images?.length) {
    setExistingImages(/* same logic as before */);
  }
  setInitialized(true);
}, [item, initialized]);
```

---

## FIX 3 — Edit form labels: English → Arabic

Files: ALL 5 edit forms (edit-bus-form.tsx, edit-equipment-form.tsx, edit-operator-form.tsx, edit-parts-form.tsx, edit-service-form.tsx)

Each form has hardcoded English labels like `label: 'Make'`, `label: 'Model'`, etc.

For each form, replace ALL hardcoded English labels with Arabic equivalents:

| English | Arabic |
|---------|--------|
| Make | الماركة |
| Model | الموديل |
| Year | سنة الصنع |
| Title | عنوان الإعلان |
| Description | الوصف |
| Price | السعر |
| Capacity | السعة |
| Mileage | المسافة المقطوعة |
| Condition | الحالة |
| Daily Price | السعر اليومي |
| Monthly Price | السعر الشهري |
| Governorate | المحافظة |
| City | المدينة |
| Phone | رقم الهاتف |
| Experience Years | سنوات الخبرة |
| Daily Rate | الأجر اليومي |
| Hourly Rate | الأجر بالساعة |
| Part Number | رقم القطعة |
| Price From | السعر من |
| Price To | السعر إلى |

---

## FIX 4 — Equipment: governorate saves label instead of value

File: `features/ads/components/forms/add-equipment-form.tsx`

Search for the governorate select handler. Current behavior saves `g.label` (Arabic name) instead of `g.value` (English key).

Fix: ensure `setGovernorate(g.value)` not `g.label`.

---

## FIX 5 — Equipment: city free text → cascading select

File: `features/ads/components/forms/add-equipment-form.tsx`

Current: `<input type="text" value={city}` — free text

Fix: replace with same cascading select pattern used in bus/car/parts forms.
Import `OMAN_CITIES` or the existing city data constant and show cities filtered by selected governorate.

---

## FIX 6 — Unify error handling (toast vs overlay)

Files: `add-equipment-form.tsx`, `add-operator-form.tsx`

Current: these two use `addToast('error', msg)` while all others use `FormErrorOverlay`.

Fix: replace `addToast` error calls with `setErrorMessages([msg])` + `<FormErrorDisplay>` from shared/ (built in Prompt 1).

---

## VERIFY after all fixes
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
Report each fix completed with file + line changed.
```

---

<a name="prompt-3"></a>
## برومبت ٣ — ريبيلد فورم السيارات (ListingForm)

```
Read docs/forms-audit.md section 3.1 fully.
Read apps/web/src/features/ads/components/listing-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts (built in Prompt 1).

---

## GOAL
Rewrite `listing-form.tsx` using the new shared components.
Keep ALL existing fields and logic — only improve UI, responsiveness, and consistency.
The file must still export `ListingForm` with the same props interface.

---

## CURRENT PROPS (keep identical)
Read the current props interface from listing-form.tsx and preserve it exactly.

---

## CHANGES TO MAKE

### 1. Replace raw inputs with shared components
Every `<input className={inputCls}` → `<FormInput>`
Every `<select className={inputCls}` → `<FormSelect>`
Every `<textarea className={inputCls}` → `<FormTextarea>`
Every section header → `<FormSection icon="..." title="...">`
Every phone field → `<FormPhoneInput>`
Every price field → `<FormPriceInput showNegotiable>`
Every chip group → `<FormChipGroup>`
Every checkbox toggle → `<FormToggle>`

### 2. Responsive grid layout
All field pairs currently side by side: wrap in:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormInput ... />
  <FormInput ... />
</div>
```
Single full-width fields stay full width.

### 3. Mobile step navigation
Replace current step bar with responsive version:
- Desktop: step name + icon + connector line
- Mobile: dots only + "الخطوة 2 من 3" text

### 4. Image upload section
Move ImageUploader to be FIRST in step 1 (before other fields).
Wrap in `<FormSection icon="photo_camera" title="صور الإعلان">`.

### 5. Submit/navigation bar
Replace current buttons with `<FormSubmitBar>` from shared/.

### 6. Error display
Replace `<FormErrorOverlay>` with `<FormErrorDisplay>` from shared/.

---

## DO NOT CHANGE
- Props interface
- API call logic (useCreateListing / useUpdateListing)
- Image upload logic
- Success redirect logic
- Translation keys
- Brand/Model/Year cascading select logic

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
Then manually confirm:
- /add-listing/car loads without errors
- /edit-listing/car/[any-id] pre-fills correctly
```

---

<a name="prompt-4"></a>
## برومبت ٤ — ريبيلد فورم الباصات

```
Read docs/forms-audit.md section 3.2 fully.
Read apps/web/src/features/ads/components/forms/add-bus-form.tsx fully.
Read apps/web/src/features/ads/components/forms/edit-bus-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Replace `add-bus-form.tsx` + `edit-bus-form.tsx` with a single unified `BusForm` component.

---

## NEW FILE
`apps/web/src/features/ads/components/forms/BusForm.tsx`

```tsx
interface BusFormProps {
  mode: 'add' | 'edit'
  initialData?: BusListing    // only for edit mode
  id?: string                 // only for edit mode
}

export function BusForm({ mode, initialData, id }: BusFormProps)
```

---

## STEPS (ALL 4 — same as current add form)

### Step 0 — نوع الإعلان
```
<FormChipGroup
  label="نوع الإعلان"
  options={[
    { value: 'BUS_SALE', label: 'للبيع', icon: 'sell' },
    { value: 'BUS_SALE_WITH_CONTRACT', label: 'بيع مع عقد', icon: 'contract' },
    { value: 'BUS_RENT', label: 'للإيجار', icon: 'key' },
    { value: 'BUS_CONTRACT', label: 'تعاقد', icon: 'handshake' },
  ]}
  value={form.busListingType}
  onChange={v => set('busListingType', v)}
  columns={2}
/>
<FormChipGroup
  label="نوع الباص"
  options={busTypes}
  value={form.busType}
  onChange={v => set('busType', v)}
  columns={3}
/>
```

### Step 1 — بيانات الباص
```
<FormSection icon="directions_bus" title="بيانات الباص">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormInput label="عنوان الإعلان" name="title" required />
    <FormInput label="الماركة" name="make" required />
    <FormInput label="الموديل" name="model" />
    <FormInput label="سنة الصنع" name="year" type="number" required />
    <FormInput label="عدد الركاب" name="capacity" type="number" required />
    <FormInput label="المسافة المقطوعة (كم)" name="mileage" type="number" />
    <FormInput label="رقم اللوحة" name="plateNumber" />
  </div>
  <FormTextarea label="الوصف" name="description" />
  <FormChipGroup label="نوع الوقود" options={fuelTypes} value={form.fuelType} multiSelect={false} />
  <FormChipGroup label="ناقل الحركة" options={transmissions} value={form.transmission} multiSelect={false} />
  <FormChipGroup label="الحالة" options={conditions} value={form.condition} multiSelect={false} />
  <FormChipGroup label="المميزات" options={busFeatures} value={form.features} multiSelect={true} columns={3} />
</FormSection>
```

### Step 2 — السعر والتفاصيل (adaptive based on busListingType)
- BUS_SALE: FormPriceInput + negotiable toggle
- BUS_SALE_WITH_CONTRACT or BUS_CONTRACT: contract fields (type, client, monthly, duration, expiry, passengers, schedule, route)
- BUS_RENT: daily price, monthly price, min rental days, driver/delivery/insurance toggles, deposit, dates, cancellation

All conditional sections use `showIf` pattern:
```tsx
{(form.busListingType === 'BUS_RENT') && (
  <FormSection icon="key" title="تفاصيل الإيجار">
    ...
  </FormSection>
)}
```

### Step 3 — الموقع والتواصل والصور
```
<FormSection icon="location_on" title="الموقع">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormSelect label="المحافظة" options={governorates} />
    <FormSelect label="المدينة" options={cities} />
  </div>
  <LocationPicker />
</FormSection>
<FormSection icon="call" title="التواصل">
  <FormPhoneInput label="رقم الهاتف" name="contactPhone" />
  <FormPhoneInput label="واتساب" name="whatsapp" />
</FormSection>
<FormSection icon="photo_camera" title="الصور">
  <ImageUploader images={images} onChange={setImages} maxImages={10} />
</FormSection>
```

---

## EDIT MODE
- On mount: `useEffect` to populate form state from `initialData`
- API call: `useUpdateBusListing` instead of `useCreateBusListing`
- Submit label: "حفظ التعديلات" instead of "نشر الإعلان"
- Skip step 0 (busListingType not editable) — start from step 1
- Pre-populate images from `initialData.images`
- Redirect: check `initialData.busListingType === 'BUS_RENT'` for correct path

---

## UPDATE PAGES

`app/[locale]/add-listing/bus/page.tsx` (or wherever bus add renders):
```tsx
import { BusForm } from '@/features/ads/components/forms/BusForm'
export default function AddBusPage() {
  return <BusForm mode="add" />
}
```

`app/[locale]/edit-listing/bus/[id]/page.tsx` (or GenericEditForm path):
```tsx
'use client'
import { BusForm } from '@/features/ads/components/forms/BusForm'
import { useBusListing } from '@/lib/api/buses'
export default function EditBusPage({ params }) {
  const { data, isLoading } = useBusListing(params.id)
  if (isLoading) return <PageSkeleton />
  return <BusForm mode="edit" initialData={data} id={params.id} />
}
```

---

## DELETE (after pages updated and verified)
- `features/ads/components/forms/add-bus-form.tsx`
- `features/ads/components/forms/edit-bus-form.tsx`

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

<a name="prompt-5"></a>
## برومبت ٥ — ريبيلد فورم المعدات

```
Read docs/forms-audit.md section 3.3 fully.
Read apps/web/src/features/ads/components/forms/add-equipment-form.tsx fully.
Read apps/web/src/features/ads/components/forms/edit-equipment-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Same pattern as BusForm — create unified `EquipmentForm` with mode prop.

New file: `features/ads/components/forms/EquipmentForm.tsx`

```tsx
interface EquipmentFormProps {
  mode: 'add' | 'edit'
  initialData?: EquipmentListing
  id?: string
}
```

---

## CRITICAL FIXES IN THIS FORM (from audit)

1. **State refactor**: Replace 20+ individual `useState` calls with single object:
```tsx
const [form, setForm] = useState({
  title: '', description: '', make: '', model: '',
  year: '', condition: '', capacity: '', power: '',
  weight: '', hoursUsed: '', listingType: 'EQUIPMENT_SALE',
  equipmentType: '', price: '', dailyPrice: '', weeklyPrice: '',
  monthlyPrice: '', isPriceNegotiable: false, withOperator: false,
  deliveryAvailable: false, minRentalDays: '', features: [] as string[],
  depositAmount: '', availableFrom: '', availableTo: '',
  insuranceIncluded: false, cancellationPolicy: '',
  governorate: '', city: '', latitude: null, longitude: null,
  contactPhone: '', whatsapp: '',
})
function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
  setForm(prev => ({ ...prev, [key]: value }))
}
```

2. **features field**: Replace free-text comma input with `<FormChipGroup multiSelect>` using predefined equipment feature options

3. **governorate**: Use `g.value` not `g.label` when saving

4. **city**: Replace free text with cascading select (same as car/bus)

---

## STEPS (4 steps)

### Step 0 — نوع الإعلان والمعدة
```
<FormChipGroup label="نوع الإعلان" options={[
  { value: 'EQUIPMENT_SALE', label: 'للبيع', icon: 'sell' },
  { value: 'EQUIPMENT_RENT', label: 'للإيجار', icon: 'key' },
]} columns={2} />

Equipment type: icon card grid (15 types) — keep existing icon grid UI
```

### Step 1 — المواصفات
```
<FormSection icon="build" title="المواصفات الفنية">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormInput label="عنوان الإعلان" required />
    <FormInput label="الماركة" />
    <FormInput label="الموديل" />
    <FormInput label="سنة الصنع" type="number" />
    <FormInput label="الحمولة / السعة" placeholder="مثال: 20 طن" />
    <FormInput label="القوة" placeholder="مثال: 150 حصان" />
    <FormInput label="الوزن" placeholder="مثال: 22,000 كجم" />
    <FormInput label="ساعات الاستخدام" type="number" />
  </div>
  <FormChipGroup label="الحالة" options={conditions} />
  <FormTextarea label="الوصف" required />
</FormSection>
```

### Step 2 — السعر والإتاحة
Adaptive based on listingType:
- EQUIPMENT_SALE: FormPriceInput + negotiable
- EQUIPMENT_RENT: daily/weekly/monthly prices, min days, deposit, dates, insurance, cancellation
Both: withOperator toggle, deliveryAvailable toggle
FormChipGroup for features (not free text)

### Step 3 — الموقع والتواصل والصور
Same as BusForm step 3.

---

## DELETE after verified
- `features/ads/components/forms/add-equipment-form.tsx`
- `features/ads/components/forms/edit-equipment-form.tsx`

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

<a name="prompt-6"></a>
## برومبت ٦ — ريبيلد فورم قطع الغيار

```
Read docs/forms-audit.md section 3.5 fully.
Read apps/web/src/features/ads/components/forms/add-part-form.tsx fully.
Read apps/web/src/features/ads/components/forms/edit-parts-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Create unified `PartForm` with mode prop.

New file: `features/ads/components/forms/PartForm.tsx`

```tsx
interface PartFormProps {
  mode: 'add' | 'edit'
  initialData?: SparePart
  id?: string
  defaultCategory?: string    // from URL query param
}
```

---

## STEPS (3 steps)

### Step 0 — الأساسيات
```
<FormSection icon="category" title="تصنيف القطعة">
  <FormChipGroup
    label="فئة القطعة"
    options={partCategories}   // 10 categories from PartCategory enum
    columns={3}
    required
  />
</FormSection>
<FormSection icon="photo_camera" title="صور القطعة">
  <ImageUploader images={images} onChange={setImages} />
</FormSection>
<FormSection icon="info" title="بيانات أساسية">
  <FormInput label="عنوان الإعلان" required />
  <FormChipGroup label="الحالة" options={[
    { value: 'NEW', label: 'جديد' },
    { value: 'USED', label: 'مستعمل' },
    { value: 'REFURBISHED', label: 'مجدد' },
  ]} />
</FormSection>
```

### Step 1 — تفاصيل القطعة
```
<FormSection icon="build_circle" title="تفاصيل القطعة">
  <FormInput label="رقم القطعة (OEM)" name="partNumber" />
  <FormToggle label="قطعة أصلية" name="isOriginal" />

  Compatible makes — keep existing multi-select brand dropdown
  (uses useBrands API + checkboxes — keep this logic as-is)

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormSelect label="متوافقة من سنة" name="yearFrom" options={years} />
    <FormSelect label="متوافقة حتى سنة" name="yearTo" options={years} />
  </div>
  <FormTextarea label="الوصف" />
</FormSection>
```

### Step 2 — السعر والموقع
```
<FormPriceInput label="السعر" showNegotiable />
<FormSection icon="location_on" title="الموقع">
  <FormSelect label="المحافظة" />
  <FormSelect label="المدينة" />
  <LocationPicker />
</FormSection>
<FormSection icon="call" title="التواصل">
  <FormPhoneInput label="رقم الهاتف" />
  <FormPhoneInput label="واتساب" />
</FormSection>
```

---

## DELETE after verified
- `features/ads/components/forms/add-part-form.tsx`
- `features/ads/components/forms/edit-parts-form.tsx`

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

<a name="prompt-7"></a>
## برومبت ٧ — ريبيلد فورم الخدمات

```
Read docs/forms-audit.md section 3.6 fully.
Read apps/web/src/features/ads/components/forms/add-service-form.tsx fully.
Read apps/web/src/features/ads/components/forms/edit-service-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Create unified `ServiceForm` with mode prop.

New file: `features/ads/components/forms/ServiceForm.tsx`

```tsx
interface ServiceFormProps {
  mode: 'add' | 'edit'
  initialData?: CarService
  id?: string
  defaultServiceType?: string
}
```

---

## STEPS (3 steps)

### Step 0 — نوع الخدمة وبيانات الأساسية
```
<FormSection icon="home_repair_service" title="نوع الخدمة">
  <FormChipGroup
    label="نوع الخدمة"
    options={serviceTypes}   // 9 types from ServiceType enum
    columns={3}
    required
  />
</FormSection>
<FormSection icon="photo_camera" title="صور الخدمة">
  <ImageUploader />
</FormSection>
<FormSection icon="info" title="بيانات أساسية">
  <FormInput label="اسم الخدمة" required />
  <FormInput label="اسم المزوّد" />
  <FormChipGroup label="نوع المزوّد" options={[
    { value: 'WORKSHOP', label: 'ورشة' },
    { value: 'MOBILE', label: 'متنقل' },
    { value: 'BOTH', label: 'كلاهما' },
  ]} />
</FormSection>
```

### Step 1 — تفاصيل الخدمة
```
<FormTextarea label="وصف الخدمة" />
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormPriceInput label="السعر من" />
  <FormPriceInput label="السعر إلى" />
</div>
<FormToggle label="خدمة منزلية متاحة" />
<FormSection icon="schedule" title="أوقات العمل">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormInput label="يفتح الساعة" type="time" />
    <FormInput label="يغلق الساعة" type="time" />
  </div>
  <FormChipGroup
    label="أيام العمل"
    options={weekdays}
    multiSelect={true}
    columns={4}
  />
</FormSection>
```

### Step 2 — الموقع والتواصل
```
<FormSection icon="location_on" title="الموقع">
  <FormSelect label="المحافظة" />
  <FormSelect label="المدينة" />
  <FormInput label="العنوان التفصيلي" />
  <LocationPicker />
</FormSection>
<FormSection icon="call" title="التواصل">
  <FormPhoneInput label="رقم الهاتف" />
  <FormPhoneInput label="واتساب" />
  <FormInput label="الموقع الإلكتروني" type="url" />
</FormSection>
```

---

## DELETE after verified
- `features/ads/components/forms/add-service-form.tsx`
- `features/ads/components/forms/edit-service-form.tsx`

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

<a name="prompt-8"></a>
## برومبت ٨ — ريبيلد فورم المشغّلين

```
Read docs/forms-audit.md section 3.4 fully.
Read apps/web/src/features/ads/components/forms/add-operator-form.tsx fully.
Read apps/web/src/features/ads/components/forms/edit-operator-form.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Create unified `OperatorForm` with mode prop.

New file: `features/ads/components/forms/OperatorForm.tsx`

```tsx
interface OperatorFormProps {
  mode: 'add' | 'edit'
  initialData?: OperatorListing
  id?: string
}
```

---

## STEPS (3 steps)

### Step 0 — نوع المشغّل
```
<FormSection icon="engineering" title="نوع المشغّل">
  <FormChipGroup
    options={operatorTypes}
    columns={2}
    required
  />
</FormSection>
```

### Step 1 — المعلومات والخبرة
```
<FormSection icon="person" title="المعلومات الأساسية">
  <FormInput label="عنوان الإعلان" required />
  <FormTextarea label="الوصف" />
  <FormInput label="سنوات الخبرة" type="number" />
  <FormChipGroup
    label="أنواع المعدات المتخصص فيها"
    options={equipmentTypes}
    multiSelect={true}
    columns={3}
  />
</FormSection>
<FormSection icon="verified" title="الشهادات والتخصصات">
  <FormInput label="التخصصات" placeholder="مثال: رافعة، حفار..." />
  <FormInput label="الشهادات" placeholder="مثال: رخصة درجة أولى..." />
</FormSection>
```

### Step 2 — الأجر والموقع والتواصل
```
<FormSection icon="payments" title="الأجر">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormPriceInput label="الأجر اليومي" />
    <FormPriceInput label="الأجر بالساعة" />
  </div>
  <FormToggle label="الأجر قابل للتفاوض" />
</FormSection>
<FormSection icon="location_on" title="الموقع">
  <FormSelect label="المحافظة" />
  <FormSelect label="المدينة" />
</FormSection>
<FormSection icon="call" title="التواصل">
  <FormPhoneInput label="رقم الهاتف" />
  <FormPhoneInput label="واتساب" />
</FormSection>
```

Note: Operator has NO image upload (confirmed in audit).

---

## DELETE after verified
- `features/ads/components/forms/add-operator-form.tsx`
- `features/ads/components/forms/edit-operator-form.tsx`

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

<a name="prompt-9"></a>
## برومبت ٩ — صفحة اختيار نوع الإعلان

```
Read apps/web/src/app/[locale]/add-listing/page.tsx fully.
Read apps/web/src/features/ads/components/forms/shared/index.ts.

---

## GOAL
Rebuild the add-listing category selection page professionally.

File: `apps/web/src/app/[locale]/add-listing/page.tsx`

---

## DESIGN

```
┌─────────────────────────────────────────┐
│         أضف إعلانك الآن               │  ← page title
│    اختر نوع الإعلان المناسب            │  ← subtitle
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │    🚗    │  │    🚌    │            │  ← 2 col mobile
│  │  سيارة   │  │   باص    │            │
│  │          │  │          │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │    🏗️   │  │    🔧    │            │
│  │  معدات   │  │ قطع غيار │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │    🛠️   │  │    👷    │            │
│  │  خدمات   │  │  مشغّلون  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

Cards: `grid grid-cols-2 sm:grid-cols-3 gap-4`

Each card:
```tsx
<Link href={`/${locale}/add-listing/${type}`}>
  <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 
                  hover:border-primary/40 hover:shadow-ambient 
                  active:scale-95 transition-all cursor-pointer group">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center 
                    justify-center group-hover:bg-primary/20 transition-colors">
      <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
    </div>
    <div className="text-center">
      <p className="font-bold text-on-surface text-sm">{title}</p>
      <p className="text-on-surface-variant/60 text-xs mt-0.5">{description}</p>
    </div>
  </div>
</Link>
```

Categories config:
```ts
const LISTING_CATEGORIES = [
  { type: 'car',       icon: 'directions_car',  title: 'سيارة',      description: 'بيع، إيجار، أو مطلوب' },
  { type: 'bus',       icon: 'directions_bus',  title: 'باص',        description: 'باصات وحافلات' },
  { type: 'equipment', icon: 'construction',    title: 'معدات',      description: 'معدات ثقيلة وصناعية' },
  { type: 'parts',     icon: 'build',           title: 'قطع غيار',   description: 'قطع ومستلزمات السيارات' },
  { type: 'service',   icon: 'home_repair_service', title: 'خدمات', description: 'خدمات صيانة وتنظيف' },
  { type: 'operator',  icon: 'engineering',     title: 'مشغّلون',    description: 'مشغّلو معدات ثقيلة' },
]
```

Page metadata (for SEO):
```ts
title: 'أضف إعلانك — سوق وان'
description: 'أضف إعلانك مجاناً في سوق وان'
```

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
```

---

## ⚠️ قواعد تنفيذ البرومبات

| # | القاعدة |
|---|---------|
| 1 | **الترتيب إجباري** — ١ ثم ٢ ثم ٣ ... لا تتخطى خطوة |
| 2 | **TypeCheck بعد كل برومبت** — صفر errors قبل المتابعة |
| 3 | **Branch جديد** — `git checkout -b feature/forms-rebuild` |
| 4 | **Commit بعد كل برومبت** — `git commit -m "feat: rebuild [form-name] form"` |
| 5 | **لا تمسح الملفات القديمة** إلا بعد ما الصفحة تشتغل صح |
| 6 | **لو فيه error** — قل لـ Cascade يحله قبل ما يكمل |
