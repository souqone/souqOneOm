# Operator Form — Full Rebuild Prompt
> شغّله في Windsurf على branch: `feature/forms-rebuild`

```
Read these files before writing any code:
- apps/web/src/features/ads/components/forms/OperatorForm.tsx (full file)
- apps/web/src/features/ads/components/forms/shared/index.ts
- apps/web/src/app/globals.css (design tokens)
- apps/web/src/lib/location-data.ts (governorates + cities)

---

## GOAL
Completely rewrite `OperatorForm.tsx` — fix UX, fix field types, and align with ServiceForm pattern.
Keep all existing API logic, hooks, state, and submit handlers exactly as-is.
Replace ONLY the JSX structure and styling. Fix field types as described below.

---

## STEP STRUCTURE (3 steps)

Step 0 — نوع المشغّل والمعدات
Step 1 — الخبرة والمؤهلات
Step 2 — الأجر والموقع والتواصل

---

## STEP 0 — نوع المشغّل والمعدات

### Section: نوع المشغّل (required)

Use FormChipGroup with icon cards — 2 columns grid, large chips with icon + label:

```tsx
const OPERATOR_TYPES = [
  { value: 'CRANE_OPERATOR',     label: 'مشغّل رافعة',       icon: 'precision_manufacturing' },
  { value: 'EXCAVATOR_OPERATOR', label: 'مشغّل حفار',        icon: 'construction' },
  { value: 'FORKLIFT_OPERATOR',  label: 'مشغّل رافعة شوكية', icon: 'forklift' },
  { value: 'TRUCK_DRIVER',       label: 'سائق شاحنة',        icon: 'local_shipping' },
  { value: 'BULLDOZER_OPERATOR', label: 'مشغّل بلدوزر',      icon: 'agriculture' },
  { value: 'HEAVY_EQUIPMENT',    label: 'معدات ثقيلة عامة',  icon: 'engineering' },
  { value: 'OTHER_OPERATOR',     label: 'أخرى',              icon: 'more_horiz' },
]
```

Chip card style (each chip):
- White bg, rounded-2xl, border 1px #E5E7EB, padding 16px 12px
- Vertical layout: icon (28px, in 44x44 rounded-xl bg-primary/10) + label below (13px bold)
- Active: bg-primary/10, border-2 border-primary, text-primary, icon bg-primary/20
- Hover: border-primary/40, shadow-sm

### Section: أنواع المعدات المتخصص فيها (multiSelect)

Use FormChipGroup multiSelect, columns={3}:

```tsx
const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'CRANE',           label: 'رافعة' },
  { value: 'EXCAVATOR',       label: 'حفار' },
  { value: 'LOADER',          label: 'لودر' },
  { value: 'BULLDOZER',       label: 'بلدوزر' },
  { value: 'FORKLIFT',        label: 'رافعة شوكية' },
  { value: 'CONCRETE_MIXER',  label: 'خلاط خرسانة' },
  { value: 'GENERATOR',       label: 'مولّد كهربائي' },
  { value: 'COMPRESSOR',      label: 'ضاغط هواء' },
  { value: 'TRUCK',           label: 'شاحنة' },
  { value: 'DUMP_TRUCK',      label: 'شاحنة قلاّبة' },
  { value: 'WATER_TANKER',    label: 'صهريج ماء' },
  { value: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة' },
  { value: 'OTHER_EQUIPMENT', label: 'أخرى' },
]
```

```tsx
<FormSection icon="handyman" title="أنواع المعدات">
  <p className="text-xs text-on-surface-variant/60 mb-3">
    اختر كل أنواع المعدات التي تتقنها — يمكن اختيار أكثر من نوع
  </p>
  <FormChipGroup
    options={EQUIPMENT_TYPE_OPTIONS}
    value={form.equipmentTypes}
    onChange={v => set('equipmentTypes', v as string[])}
    multiSelect
    columns={3}
  />
</FormSection>
```

---

## STEP 1 — الخبرة والمؤهلات

### Section: البيانات الأساسية

```tsx
<FormSection icon="person" title="البيانات الأساسية">
  <FormInput
    label="عنوان الإعلان"
    name="title"
    required
    placeholder="مثال: مشغّل رافعة — خبرة 10 سنوات — مسقط"
    hint="اجعل العنوان واضحاً ومميزاً"
  />
  <FormTextarea
    label="الوصف"
    name="description"
    placeholder="اشرح خبرتك ومهاراتك بالتفصيل..."
    rows={4}
    maxLength={1000}
    showCount
  />
  <FormInput
    label="سنوات الخبرة"
    name="experienceYears"
    type="number"
    min={0}
    max={50}
    placeholder="مثال: 10"
    hint="عدد سنوات الخبرة الكلية في تشغيل المعدات"
  />
</FormSection>
```

**IMPORTANT — type fix:**
`experienceYears` must be `number | ''` (not string):
```tsx
experienceYears: '' as number | '',
```
In the input:
```tsx
value={form.experienceYears}
onChange={v => set('experienceYears', v === '' ? '' : Number(v))}
```

### Section: الشهادات والمؤهلات

Certifications — array of strings. Use tag-input pattern (same as ServiceForm specializations):
- Text input + "إضافة" button
- On add: push to certifications array, clear input
- Render each as removable pill chip (× button)
- Placeholder: "مثال: رخصة تشغيل درجة أولى، شهادة السلامة..."

```tsx
<FormSection icon="verified" title="الشهادات والمؤهلات">
  <p className="text-xs text-on-surface-variant/60 mb-3">
    أضف رخصك وشهاداتك المهنية — تزيد من مصداقية إعلانك
  </p>
  {/* tag chips */}
  <div className="flex flex-wrap gap-2 mb-3">
    {form.certifications.map((c, i) => (
      <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary 
                                text-xs font-bold px-3 py-1.5 rounded-full">
        {c}
        <button type="button" onClick={() => removeCertification(i)}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </span>
    ))}
  </div>
  {/* add input */}
  <div className="flex gap-2">
    <input
      className={inputCls + ' flex-1'}
      value={newCert}
      onChange={e => setNewCert(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCertification())}
      placeholder="اكتب شهادة وأضفها..."
    />
    <button
      type="button"
      onClick={addCertification}
      className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl 
                 text-sm hover:bg-primary/20 transition-colors whitespace-nowrap"
    >
      + إضافة
    </button>
  </div>
</FormSection>
```

### Section: التوفر

```tsx
<FormSection icon="event_available" title="التوفر">
  <FormToggle
    label="متاح للعمل الفوري"
    description="سيظهر إعلانك في نتائج البحث للطلبات العاجلة"
    name="isAvailable"
    checked={form.isAvailable ?? true}
    onChange={v => set('isAvailable', v)}
  />
</FormSection>
```

---

## STEP 2 — الأجر والموقع والتواصل

### Section: الأجر

```tsx
<FormSection icon="payments" title="الأجر">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormPriceInput
      label="الأجر اليومي"
      name="dailyRate"
      hint="السعر باليوم بالريال العماني"
    />
    <FormPriceInput
      label="الأجر بالساعة"
      name="hourlyRate"
      hint="السعر بالساعة بالريال العماني"
    />
  </div>
  <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1">
    <span className="material-symbols-outlined text-sm">info</span>
    اتركهما فارغين إذا كان الأجر يُحدد حسب الاتفاق
  </p>
  <FormToggle
    label="الأجر قابل للتفاوض"
    description="سيظهر وسم 'قابل للتفاوض' على إعلانك"
    name="negotiable"
    checked={form.negotiable ?? false}
    onChange={v => set('negotiable', v)}
  />
</FormSection>
```

**IMPORTANT — type fix:**
`dailyRate` and `hourlyRate` must be `number | ''` (not string):
```tsx
dailyRate:  '' as number | '',
hourlyRate: '' as number | '',
```

### Section: الموقع

```tsx
<FormSection icon="location_on" title="الموقع">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className={labelCls}>المحافظة <span className="text-error">*</span></label>
      <select
        className={inputCls}
        value={form.governorate}
        onChange={e => { set('governorate', e.target.value); set('city', '') }}
        required
      >
        <option value="">اختر المحافظة</option>
        {getGovernorates().map(g => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>
    </div>
    <div>
      <label className={labelCls}>المدينة</label>
      <select
        className={inputCls}
        value={form.city}
        onChange={e => set('city', e.target.value)}
        disabled={!form.governorate}
      >
        <option value="">
          {form.governorate ? 'اختر المدينة' : 'اختر المحافظة أولاً'}
        </option>
        {getCities(form.governorate).map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>
  </div>
</FormSection>
```

Note: Remove `selectedGov` state — use `form.governorate` directly (same fix done in ServiceForm).

### Section: التواصل

```tsx
<FormSection icon="call" title="بيانات التواصل">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormPhoneInput
      label="رقم الهاتف"
      name="contactPhone"
      value={form.contactPhone}
      onChange={v => set('contactPhone', v)}
    />
    <FormPhoneInput
      label="واتساب"
      name="whatsapp"
      value={form.whatsapp}
      onChange={v => set('whatsapp', v)}
    />
  </div>
</FormSection>
```

---

## STEP TITLES & ICONS (for MultiStepForm)

```tsx
const steps = [
  { id: 'type',        title: 'نوع المشغّل',      icon: 'engineering' },
  { id: 'experience',  title: 'الخبرة والمؤهلات',  icon: 'verified' },
  { id: 'rate',        title: 'الأجر والموقع',      icon: 'payments' },
]
```

---

## VALIDATION (add to existing validation or create new)

Step 0 required:
- operatorType: "اختر نوع المشغّل"

Step 1 required:
- title: "أدخل عنوان الإعلان" (min 3 chars)
- description: "أدخل وصف الخبرة" (min 10 chars)
- experienceYears: if set, must be >= 0

Step 2 required:
- governorate: "اختر المحافظة"
- dailyRate/hourlyRate: if both set, must be >= 0

---

## STATE ADDITIONS

Add `newCert` local state:
```tsx
const [newCert, setNewCert] = useState('')
```

Fix field types in form state:
```tsx
experienceYears: '' as number | '',
dailyRate:  '' as number | '',
hourlyRate: '' as number | '',
certifications: [] as string[],   // change from string to string[]
equipmentTypes: [] as string[],   // should already be array, confirm
```

Add helper functions:
```tsx
const addCertification = () => {
  const trimmed = newCert.trim()
  if (!trimmed || form.certifications.includes(trimmed)) return
  set('certifications', [...form.certifications, trimmed])
  setNewCert('')
}
const removeCertification = (index: number) => {
  set('certifications', form.certifications.filter((_, i) => i !== index))
}
```

**Note:** `certifications` is `String[]` in the DB — send the array directly. Do NOT join to comma-separated on submit.

If the existing submit handler joins certifications with `.join(',')`, remove that — send `form.certifications` as-is.

---

## WHAT NOT TO CHANGE

- useCreateOperator / useUpdateOperator hooks (or equivalent)
- submit handler (onSubmit function)
- success redirect logic
- useEffect for edit mode pre-fill
- router, locale, toast usage

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
0 errors required. Then test:
1. /add-listing/operator — all 3 steps load correctly
2. Step 0: operator type chip selects correctly (single), equipment types multi-select works
3. Step 1: certifications add/remove works (Enter key + button)
4. Step 2: governorate→city cascade works, phone inputs show +968 prefix
5. Submit → API called → redirect to operator listing page
6. Check mobile (390px): all fields stack correctly, chips wrap properly
```
