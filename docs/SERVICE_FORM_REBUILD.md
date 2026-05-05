# Service Form — Full Rebuild Prompt
> شغّله في Windsurf على branch: `feature/forms-rebuild`

```
Read these files before writing any code:
- apps/web/src/features/ads/components/forms/ServiceForm.tsx (full file)
- apps/web/src/features/ads/components/forms/shared/index.ts
- apps/web/src/app/globals.css (design tokens)
- apps/web/src/lib/location-data.ts (governorates + cities)

---

## GOAL
Completely rewrite `ServiceForm.tsx` — fix both UX and missing fields.
Keep all existing API logic, hooks, state, and submit handlers exactly as-is.
Replace ONLY the JSX structure and styling.

---

## STEP STRUCTURE (3 steps)

Step 0 — نوع الخدمة
Step 1 — تفاصيل الخدمة  
Step 2 — الموقع والتواصل والصور

---

## STEP 0 — نوع الخدمة

### Section: نوع الخدمة (required)

Use FormChipGroup with icon cards — 3 columns grid, large chips with icon + label:

```tsx
const SERVICE_TYPES = [
  { value: 'MAINTENANCE',        label: 'صيانة',           icon: 'build' },
  { value: 'CLEANING',           label: 'غسيل وتنظيف',    icon: 'local_car_wash' },
  { value: 'INSPECTION',         label: 'فحص',             icon: 'search' },
  { value: 'BODYWORK',           label: 'بناء وتوبير',     icon: 'car_repair' },
  { value: 'TOWING',             label: 'سحب وإنقاذ',      icon: 'rv_hookup' },
  { value: 'MODIFICATION',       label: 'تعديلات',         icon: 'tune' },
  { value: 'KEYS_LOCKS',         label: 'مفاتيح وأقفال',  icon: 'key' },
  { value: 'ACCESSORIES_INSTALL',label: 'تركيب إكسسوار',  icon: 'settings_input_component' },
  { value: 'OTHER_SERVICE',      label: 'أخرى',            icon: 'more_horiz' },
]
```

Chip card style (each chip):
- White bg, rounded-2xl, border 1px #E5E7EB, padding 16px 12px
- Vertical layout: icon (28px, in 44x44 rounded-xl bg-primary/10) + label below (13px bold)
- Active: bg-primary/10, border-2 border-primary, text-primary, icon bg-primary/20
- Hover: border-primary/40, shadow-sm

### Section: نوع المزوّد (required)

3 large card chips horizontal:
```tsx
const PROVIDER_TYPES = [
  { value: 'WORKSHOP', label: 'ورشة', icon: 'garage',  desc: 'موقع ثابت' },
  { value: 'MOBILE',   label: 'متنقل', icon: 'local_shipping', desc: 'يأتي إليك' },
  { value: 'BOTH',     label: 'كلاهما', icon: 'sync_alt', desc: 'ورشة ومتنقل' },
]
```

Card style: horizontal layout inside card — icon left + label+desc right
Active: blue border + bg tint

### Section: الصور (move images to step 0 so user adds photos first)

```tsx
<FormSection icon="photo_camera" title="صور الخدمة">
  <p className="text-xs text-on-surface-variant/60 mb-3">
    أضف صوراً للورشة أو المعدات — تزيد من مصداقية إعلانك
  </p>
  <ImageUploader images={images} onChange={setImages} maxImages={10} />
</FormSection>
```

---

## STEP 1 — تفاصيل الخدمة

### Section: البيانات الأساسية

```tsx
<FormSection icon="info" title="البيانات الأساسية">
  <FormInput
    label="اسم الخدمة"
    name="title"
    required
    placeholder="مثال: ورشة صيانة تويوتا — الخوض"
    hint="اجعل الاسم واضحاً ومميزاً"
  />
  <FormInput
    label="اسم المزوّد / الورشة"
    name="providerName"
    required
    placeholder="اسم الشركة أو الشخص"
  />
  <FormTextarea
    label="وصف الخدمة"
    name="description"
    required
    placeholder="اشرح خدماتك بالتفصيل — ماذا تقدم؟ ما هي مميزاتك؟"
    rows={4}
    maxLength={1000}
    showCount
  />
</FormSection>
```

### Section: التخصصات

Specializations — array of strings. Use a tag-input pattern:
- Text input + "إضافة" button
- On add: push to specializations array, clear input
- Render each as removable tag chip (× button)
- Placeholder: "مثال: سيارات يابانية، ناقل حركة أوتوماتيك..."
- Show existing tags above input

```tsx
<FormSection icon="star" title="التخصصات">
  <p className="text-xs text-on-surface-variant/60 mb-3">
    أضف تخصصاتك لتظهر في نتائج البحث المناسبة
  </p>
  {/* tag chips row */}
  <div className="flex flex-wrap gap-2 mb-3">
    {form.specializations.map((s, i) => (
      <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary 
                                text-xs font-bold px-3 py-1.5 rounded-full">
        {s}
        <button onClick={() => removeSpecialization(i)}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </span>
    ))}
  </div>
  {/* add input */}
  <div className="flex gap-2">
    <input
      className={inputCls + ' flex-1'}
      value={newSpec}
      onChange={e => setNewSpec(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && addSpecialization()}
      placeholder="اكتب تخصصاً وأضفه..."
    />
    <button
      type="button"
      onClick={addSpecialization}
      className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl 
                 text-sm hover:bg-primary/20 transition-colors whitespace-nowrap"
    >
      + إضافة
    </button>
  </div>
</FormSection>
```

Add `newSpec` state: `const [newSpec, setNewSpec] = useState('')`
Add `addSpecialization`: push newSpec to form.specializations, clear newSpec
Add `removeSpecialization(i)`: filter out index i

### Section: التسعير

```tsx
<FormSection icon="payments" title="التسعير">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormPriceInput
      label="السعر من"
      name="priceFrom"
      hint="أدنى سعر للخدمة"
    />
    <FormPriceInput
      label="السعر إلى"
      name="priceTo"
      hint="أعلى سعر للخدمة"
    />
  </div>
  <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1">
    <span className="material-symbols-outlined text-sm">info</span>
    اتركهما فارغين إذا كان السعر يُحدد حسب الطلب
  </p>
  <FormToggle
    label="خدمة منزلية متاحة"
    description="يمكنك التنقل إلى موقع العميل"
    name="isHomeService"
    checked={form.isHomeService}
    onChange={v => set('isHomeService', v)}
  />
</FormSection>
```

### Section: أوقات العمل

Working days — chip group (multi-select):
```tsx
const WEEKDAYS = [
  { value: 'saturday',  label: 'السبت' },
  { value: 'sunday',    label: 'الأحد' },
  { value: 'monday',    label: 'الاثنين' },
  { value: 'tuesday',   label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday',  label: 'الخميس' },
  { value: 'friday',    label: 'الجمعة' },
]
```

```tsx
<FormSection icon="schedule" title="أوقات العمل">
  <FormChipGroup
    label="أيام الدوام"
    options={WEEKDAYS}
    value={form.workingDays}
    onChange={v => set('workingDays', v as string[])}
    multiSelect
    columns={4}
  />
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label className={labelCls}>يفتح الساعة</label>
      <select
        className={inputCls}
        value={form.workingHoursOpen}
        onChange={e => set('workingHoursOpen', e.target.value)}
      >
        <option value="">-- اختر --</option>
        {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
      </select>
    </div>
    <div>
      <label className={labelCls}>يغلق الساعة</label>
      <select
        className={inputCls}
        value={form.workingHoursClose}
        onChange={e => set('workingHoursClose', e.target.value)}
      >
        <option value="">-- اختر --</option>
        {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
      </select>
    </div>
  </div>
</FormSection>
```

Add this hours array:
```tsx
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12
  const ampm = i < 12 ? 'ص' : 'م'
  const padded = String(i).padStart(2, '0') + ':00'
  return { value: padded, label: `${h}:00 ${ampm}` }
})
```

---

## STEP 2 — الموقع والتواصل

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
  <FormInput
    label="العنوان التفصيلي"
    name="address"
    placeholder="مثال: طريق الخوض، بجوار مسجد..."
    hint="يساعد العملاء على إيجادك بسهولة"
  />
  <LocationPicker ... />
</FormSection>
```

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
  <FormInput
    label="الموقع الإلكتروني"
    name="website"
    type="url"
    placeholder="https://example.com"
    prefix={<span className="material-symbols-outlined text-base text-on-surface-variant/40">language</span>}
  />
</FormSection>
```

---

## STEP TITLES & ICONS (for MultiStepForm)

```tsx
const steps = [
  { id: 'type',    title: 'نوع الخدمة',  icon: 'home_repair_service' },
  { id: 'details', title: 'تفاصيل الخدمة', icon: 'article' },
  { id: 'location',title: 'الموقع والتواصل', icon: 'location_on' },
]
```

---

## VALIDATION (add to existing validation or create new)

Step 0 required:
- serviceType: "اختر نوع الخدمة"
- providerType: "اختر نوع المزوّد"

Step 1 required:
- title: "أدخل اسم الخدمة" (min 3 chars)
- providerName: "أدخل اسم المزوّد"
- description: "أدخل وصف الخدمة" (min 10 chars)
- priceFrom/priceTo: if both set, priceTo must be >= priceFrom "السعر الأقصى يجب أن يكون أكبر من الأدنى"

Step 2 required:
- governorate: "اختر المحافظة"

---

## STATE ADDITIONS

Add to existing form state object:
```tsx
specializations: [] as string[],
newSpec: '',   // local state, NOT sent to API
```

Add helper functions (outside component or as const inside):
```tsx
const addSpecialization = () => {
  const trimmed = newSpec.trim()
  if (!trimmed || form.specializations.includes(trimmed)) return
  set('specializations', [...form.specializations, trimmed])
  setNewSpec('')
}
const removeSpecialization = (index: number) => {
  set('specializations', form.specializations.filter((_, i) => i !== index))
}
```

Note: `newSpec` should be a separate useState, not part of the form object:
```tsx
const [newSpec, setNewSpec] = useState('')
```

---

## WHAT NOT TO CHANGE

- useCreateCarService / useUpdateCarService hooks
- submit handler (onSubmit function)
- image upload loop (apiFetch POST /uploads/services/{id}/images)
- success redirect logic
- useEffect for edit mode pre-fill
- router, locale, toast usage

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
0 errors required. Then test:
1. /add-listing/service — all 3 steps load correctly
2. Step 0: service type chips select correctly, provider type cards work
3. Step 1: specializations add/remove works, working days chips work, hours selects show
4. Step 2: governorate→city cascade works, phone inputs show +968 prefix
5. Submit → API called → redirect to /sale/service/{id}
6. Check mobile (390px): all fields stack correctly, chips wrap properly
```
