# Transport Hero — Match Home Hero Pattern

## GOAL
Rewrite ONLY the hero `<section>` in `apps/web/src/app/[locale]/transport/page.tsx`
to match the visual structure and dimensions of the home page hero in
`apps/web/src/features/home/components/hero-section.tsx`.

Keep all transport-specific content (title, description, CTAs, links).
Change ONLY the visual structure.

---

## READ FIRST
- `apps/web/src/features/home/components/hero-section.tsx` (full file)
- `apps/web/src/app/[locale]/transport/page.tsx` (full file)
- `apps/web/src/app/globals.css` (design tokens)

---

## TARGET STRUCTURE (match home hero exactly)

```tsx
<section>
  {/* ── Banner ── */}
  <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-3">
    <div className="relative w-full aspect-[16/9] sm:aspect-[16/5] rounded-2xl sm:rounded-3xl overflow-hidden">

      {/* Background — navy gradient (no real image needed) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1e52] via-[#102a6e] to-[#1a3a6b]" />

      {/* Optional: subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff22 0%, transparent 60%)' }} />

      {/* Dark gradient overlay — same as home */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e52]/90 via-[#0a1e52]/30 to-transparent" />

      {/* ── Content pinned to bottom — same positioning as home ── */}
      <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-8 md:p-10 text-right">

        {/* Title */}
        <h1 className="text-white font-black text-xl sm:text-3xl md:text-4xl leading-tight mb-2 sm:mb-3">
          {t('title')}   {/* keep existing translation key */}
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-sm sm:text-base mb-4 sm:mb-6 max-w-xl ms-auto">
          {t('subtitle')}   {/* keep existing translation key */}
        </p>

        {/* CTAs — same flex pattern as home */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Link
            href={`/${locale}/transport/new`}
            className="btn-brand px-5 py-2.5 text-sm font-bold rounded-full"
          >
            {t('newRequestCta')}   {/* keep existing key */}
          </Link>
          <Link
            href={`/${locale}/transport/carrier/register`}
            className="px-5 py-2.5 text-sm font-bold rounded-full border-2 border-white/60 text-white hover:bg-white/10 transition-colors"
          >
            {t('carrierCta')}   {/* keep existing key */}
          </Link>
        </div>

      </div>

      {/* Large icon — decorative, top-left area (like home hero image) */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 opacity-20">
        <span className="material-symbols-outlined text-white"
              style={{ fontSize: 'clamp(80px, 15vw, 160px)' }}>
          local_shipping
        </span>
      </div>

    </div>
  </div>
</section>
```

---

## KEY CONSTRAINTS

1. **Aspect ratio MUST match home hero:**
   ```
   aspect-[16/9] sm:aspect-[16/5]
   ```

2. **Border radius MUST match:**
   ```
   rounded-2xl sm:rounded-3xl
   ```

3. **Container MUST match:**
   ```
   max-w-7xl mx-auto px-3 sm:px-6 pb-3
   ```

4. **Text position:** pinned to bottom with `absolute bottom-0`, same padding as home hero

5. **Remove** the old 2-column grid layout entirely

6. **Keep** all existing translation keys — do NOT change `t('...')` calls

7. **Keep** all existing `<Link href=...>` targets

---

## DO NOT CHANGE
- Any section below the hero (transport listings, filters, etc.)
- Translation files
- Any other page or component

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
Then open `/transport` and compare visually with home page `/` — same banner height, same text position, same rounded corners.
