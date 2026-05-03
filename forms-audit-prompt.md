# Agent Task — Collect & Document All Add + Edit Listing Forms

## Mission

Read every add-listing AND edit-listing form in the codebase and produce a single
markdown file at `docs/forms-audit.md`.

This is a **READ-ONLY** task. Do NOT modify any existing file.

---

## Step 1 — Find ALL Form Files

Run these searches and list every file found:

```bash
# 1. Add forms folder
find apps/web/src/features/ads/components/forms -name "*.tsx" | sort

# 2. Edit forms — all possible locations
find apps/web/src -name "edit-*.tsx" | sort
find apps/web/src -name "*-edit*.tsx" | sort
find apps/web/src -name "*EditForm*.tsx" | sort
find apps/web/src -name "*edit*.tsx" | sort

# 3. Add listing pages
find apps/web/src/app -path "*add-listing*" -name "*.tsx" | sort

# 4. Edit listing pages
find apps/web/src/app -path "*edit*" -name "*.tsx" | sort

# 5. Any form inside features
find apps/web/src/features -name "*form*.tsx" | sort
find apps/web/src/features -name "*Form*.tsx" | sort
```

Print the full list before doing anything else.

---

## Step 2 — Read Every File Found

Read each file completely. Group them:

**Group A — Add Forms** (AddCarForm, AddBusForm, ...)
**Group B — Edit Forms** (EditCarForm, EditBusForm, ...)
**Group C — Pages** (add-listing/page.tsx, edit-listing/...)

---

## Step 3 — Produce `docs/forms-audit.md`

```markdown
# Forms Audit — SouqOne Add & Edit Forms

---

## 1. Inventory

### Add Forms Found
| Form Component | File Path | Route |
|----------------|-----------|-------|
| AddCarForm | features/ads/.../add-car-form.tsx | /add-listing/car |
| ... | ... | ... |

### Edit Forms Found
| Form Component | File Path | Route |
|----------------|-----------|-------|
| EditCarForm | ... | /edit-listing/car/[id] |
| ... | ... | ... |

### Coverage Matrix
| Entity | Has Add | Has Edit | Share Logic? |
|--------|---------|----------|-------------|
| car | ✅ | ✅/❌ | ✅/❌ |
| bus | ✅ | ✅/❌ | ✅/❌ |
| equipment | ✅ | ✅/❌ | ✅/❌ |
| parts | ✅ | ✅/❌ | ✅/❌ |
| service | ✅ | ✅/❌ | ✅/❌ |
| operator | ✅ | ✅/❌ | ✅/❌ |

---

## 2. Inconsistencies Found

### Layout & Structure
- List every difference in page/section layout between forms

### Input Styles
- Quote the actual className strings that differ between forms

### Section Headers
- How does each form render a section title? Quote exact JSX

### Submit Button
- Quote exact className and structure in each form

### Loading State
- How does each form handle loading during submit?

### Error Handling
- How does each form show validation errors and API errors?

### Image Upload
- How does each form handle image upload?

### Success Redirect
- Where does each form redirect after successful submit?

### Add vs Edit Differences
- How does the edit form pre-fill values?
- Does edit reuse the add form or is it a separate component?
- What's different between add and edit beyond pre-filling?

---

## 3. Form Details

For EACH form found, document:

### [FormName]
- **File:** full path
- **Route:** /add-listing/xxx or /edit-listing/xxx/[id]
- **Submit API:** POST or PATCH endpoint

#### Fields Table
| Field | Type | Label (AR) | Required | Validation | Notes |
|-------|------|-----------|----------|------------|-------|
| ... | ... | ... | ... | ... | ... |

#### Section Layout
```
[Section 1 Name]
  field1, field2, field3
[Section 2 Name]
  field4, field5
```

#### Input Class Used
```
[paste exact className from inputs]
```

#### Submit Button Class
```
[paste exact className]
```

#### Section Header JSX Pattern
```jsx
[paste exact JSX used for section headers]
```

#### Success Redirect
```
→ /sale/car/{id}
```

---

## 4. What's Already Consistent (keep these)

List patterns consistent across 3+ forms.

---

## 5. Recommended Unified Architecture

### Proposed Shared Components
```
features/ads/components/forms/
  shared/
    FormSection.tsx        ← unified section wrapper + header
    FormInput.tsx          ← unified text input
    FormSelect.tsx         ← unified select
    FormTextarea.tsx       ← unified textarea
    FormToggle.tsx         ← unified boolean toggle
    FormImageUpload.tsx    ← unified image upload
    FormSubmitBar.tsx      ← unified sticky bottom bar
```

### Proposed Add/Edit Pattern
```
Option A: Single form with mode prop
  <CarForm mode="add" />
  <CarForm mode="edit" initialData={data} />

Option B: Separate forms sharing a hook
  useCarForm(mode, initialData) → { fields, onSubmit, isLoading }
```
Recommend which fits the codebase better and why.

### Proposed Unified Input Class
```
[recommend className based on most common pattern found]
```

---

## 6. Effort Estimate

| Task | Files Affected | Complexity |
|------|---------------|------------|
| Unify input classes | X | Low/Med/High |
| Unify section headers | X | Low/Med/High |
| Unify submit bars | X | Low/Med/High |
| Unify image upload | X | Low/Med/High |
| Merge add+edit | X | Low/Med/High |
| Build shared components | New | Low/Med/High |
```

---

## Rules

- **Read-only** — do NOT touch any existing file
- Quote **actual code** not descriptions when documenting patterns
- Read each file fully before documenting
- Check BOTH `features/` and `app/[locale]/` directories
- Document every form — even if it looks identical to another
