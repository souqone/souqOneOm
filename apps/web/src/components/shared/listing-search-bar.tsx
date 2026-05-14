'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { Search, X, ChevronDown, Plus } from 'lucide-react';

export interface SubCategory {
  key: string;
  label: string;
  route: string;
}

export interface SearchCategory {
  key: string;
  label: string;
  route: string;
  subcategories?: readonly SubCategory[];
}

interface ListingSearchBarProps {
  categories: readonly SearchCategory[];
  defaultCat?: string;
  addListingHref?: string;
  addListingLabel?: string;
}

export function ListingSearchBar({
  categories,
  defaultCat,
  addListingHref = '/add-listing',
  addListingLabel = 'أضف إعلان',
}: ListingSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(defaultCat ?? categories[0]?.key ?? '');
  const [subKey, setSubKey] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const activeCat = categories.find(c => c.key === cat) ?? categories[0];
  const subs = activeCat?.subcategories ?? [];
  const activeSub = subs.find(s => s.key === subKey) ?? null;
  const hasDropdown = categories.length > 1 || subs.length > 0;
  const currentRoute = activeSub?.route ?? activeCat?.route ?? '/';
  const buttonLabel = activeSub?.label ?? activeCat?.label ?? '';
  const placeholder = `ابحث في ${activeSub?.label ?? activeCat?.label ?? 'الإعلانات'}...`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`${currentRoute}${currentRoute.includes('?') ? '&' : '?'}q=${encodeURIComponent(query.trim())}` as any);
    else router.push(currentRoute as any);
  }

  function selectSub(s: SubCategory | null) {
    setSubKey(s?.key ?? null);
    setDropOpen(false);
  }

  function selectCat(c: SearchCategory) {
    setCat(c.key);
    setSubKey(null);
    if (!c.subcategories?.length) setDropOpen(false);
  }

  return (
    <section className="bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)] py-4 sm:py-5 border-b border-outline-variant/10">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center gap-2 sm:gap-3 w-full bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/20 rounded-2xl px-3 py-1.5 shadow-sm">

          {/* Category / subcategory dropdown */}
          <div className="relative shrink-0" ref={dropRef}>
            <button
              type="button"
              onClick={() => hasDropdown && setDropOpen(p => !p)}
              className="h-11 sm:h-[52px] px-3 sm:px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest dark:bg-surface-container flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-on-surface shadow-sm hover:shadow-md hover:border-primary/40 transition-all whitespace-nowrap"
            >
              {buttonLabel}
              {hasDropdown && (
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {hasDropdown && dropOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/20 rounded-2xl shadow-xl z-50 py-1.5 min-w-[170px] overflow-hidden">
                {/* Multiple main categories */}
                {categories.length > 1 && categories.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => selectCat(c)}
                    className={`w-full text-right px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                      cat === c.key ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}

                {/* Subcategories */}
                {subs.length > 0 && (
                  <>
                    {categories.length > 1 && <div className="h-px bg-outline-variant/20 mx-3 my-1" />}
                    {/* "All" option = main category */}
                    <button
                      type="button"
                      onClick={() => selectSub(null)}
                      className={`w-full text-right px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                        !activeSub ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      الكل
                    </button>
                    {subs.map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => selectSub(s)}
                        className={`w-full text-right px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                          activeSub?.key === s.key ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full h-11 sm:h-[52px] border border-outline-variant/50 bg-surface-container-lowest dark:bg-surface-container rounded-xl pr-4 sm:pr-5 pl-14 sm:pl-[72px] text-[13px] sm:text-[14px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-sm hover:shadow-md transition-all text-right"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-[52px] sm:left-[60px] top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors z-10"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 z-10"
            >
              <Search size={16} strokeWidth={2.5} />
            </button>
          </form>

          {/* Add listing */}
          <Link
            href={addListingHref}
            className="shrink-0 h-11 sm:h-[52px] px-3 sm:px-5 rounded-xl flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-white whitespace-nowrap shadow-md hover:brightness-110 hover:shadow-lg active:scale-95 transition-all"
            style={{ background: 'var(--color-brand-amber)' }}
          >
            <Plus size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{addListingLabel}</span>
          </Link>

        </div>
      </div>
    </section>
  );
}
