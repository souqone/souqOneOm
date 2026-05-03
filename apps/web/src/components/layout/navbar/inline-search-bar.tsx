'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAutocomplete } from '@/lib/api/search';
import { useDebounce } from '@/hooks/useDebounce';

const RECENT_KEY = 'carone.recent_searches';
const MAX_RECENT = 5;
function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
function saveRecent(q: string) { const r = getRecent().filter(s => s !== q); r.unshift(q); localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, MAX_RECENT))); }

function useSearchCategories() {
  const ts = useTranslations('search');
  return [
    { value: 'all',       label: ts('all'),       placeholder: ts('navPlaceholder'),         icon: 'apps' },
    { value: 'cars',      label: ts('cars'),      placeholder: ts('navCarsPlaceholder'),      icon: 'directions_car' },
    { value: 'buses',     label: ts('buses'),     placeholder: ts('navBusesPlaceholder'),     icon: 'directions_bus' },
    { value: 'equipment', label: ts('equipment'), placeholder: ts('navEquipmentPlaceholder'), icon: 'construction' },
    { value: 'parts',     label: ts('parts'),     placeholder: ts('navPartsPlaceholder'),     icon: 'build' },
    { value: 'services',  label: ts('services'),  placeholder: ts('navServicesPlaceholder'),  icon: 'handyman' },
    { value: 'jobs',      label: ts('jobs'),      placeholder: ts('navJobsPlaceholder'),      icon: 'work' },
  ];
}

export function InlineSearchBar() {
  const ts = useTranslations('search');
  const router = useRouter();
  const searchCategories = useSearchCategories();

  const [searchQuery, setSearchQuery]       = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [catOpen, setCatOpen]               = useState(false);
  const [focused, setFocused]               = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const catRef     = useRef<HTMLDivElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestions } = useAutocomplete(debouncedQuery);
  const activeCat = searchCategories.find(c => c.value === searchCategory) ?? searchCategories[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function buildUrl(query: string) {
    const cat = activeCat.value !== 'all' ? activeCat.value : 'cars';
    return `/browse/${cat}?q=${encodeURIComponent(query)}`;
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    saveRecent(searchQuery.trim());
    router.push(buildUrl(searchQuery.trim()));
    setShowSuggestions(false);
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleSuggestion(title: string) {
    setSearchQuery(title);
    saveRecent(title);
    router.push(buildUrl(title));
    setShowSuggestions(false);
    setFocused(false);
  }

  return (
    <div className="relative w-full max-w-[600px]">
      <form
        onSubmit={handleSearch}
        className={`flex h-10 rounded-2xl border transition-all duration-300 ${
          focused
            ? 'border-primary/60 shadow-[0_0_0_4px_rgba(0,74,198,0.12),0_2px_16px_rgba(0,74,198,0.08)] bg-background dark:bg-surface-container'
            : 'border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container shadow-[0_1px_6px_rgba(0,0,0,0.06)] hover:border-outline-variant/40 hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* ── Category Picker ── */}
        <div className="relative shrink-0" ref={catRef}>
          <button
            type="button"
            onClick={() => setCatOpen(p => !p)}
            className={`h-full px-4 flex items-center gap-1.5 text-[12px] font-bold transition-colors border-e border-outline-variant/15 rounded-s-2xl whitespace-nowrap ${
              focused ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {activeCat.icon}
            </span>
            {activeCat.label}
            <span className={`material-symbols-outlined text-[11px] transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {catOpen && (
            <div className="absolute top-[calc(100%+6px)] start-0 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[200] min-w-[150px] rounded-2xl overflow-hidden py-1.5">
              {searchCategories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setSearchCategory(cat.value); setCatOpen(false); inputRef.current?.focus(); }}
                  className={`w-full text-start px-4 py-2 text-[12px] font-semibold flex items-center gap-2.5 transition-colors ${
                    searchCategory === cat.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: searchCategory === cat.value ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider dot ── */}
        <div className="flex items-center px-1">
          <div className="w-px h-4 bg-outline-variant/20" />
        </div>

        {/* ── Input ── */}
        <div className="relative flex-1 min-w-0" ref={suggestRef}>
          <div className="flex items-center h-full px-1 gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 shrink-0">search</span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { setFocused(true); setShowSuggestions(true); }}
              onBlur={() => setFocused(false)}
              placeholder={activeCat.placeholder}
              className="flex-1 h-full text-[13px] font-medium text-on-surface bg-transparent focus:outline-none placeholder:text-on-surface-variant/40 min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={() => setSearchQuery('')}
                className="shrink-0 w-5 h-5 rounded-full bg-on-surface-variant/10 flex items-center justify-center hover:bg-on-surface-variant/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px] text-on-surface-variant/60">close</span>
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            (searchQuery.length >= 2 && suggestions && suggestions.length > 0) ||
            searchQuery.length < 2
          ) && (
            <div className="absolute top-[calc(100%+10px)] start-0 end-0 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] z-[200] max-h-[300px] overflow-y-auto py-1.5">
              {searchQuery.length >= 2 && suggestions && suggestions.length > 0 ? (
                <>
                  <p className="px-4 py-1 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">{ts('suggestions')}</p>
                  {suggestions.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => handleSuggestion(s.title)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30">search</span>
                      <span className="text-[13px] text-on-surface truncate" dangerouslySetInnerHTML={{ __html: s.highlighted || s.title }} />
                    </button>
                  ))}
                </>
              ) : getRecent().length > 0 ? (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider mb-1.5">{ts('recentSearches')}</p>
                  {getRecent().map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => handleSuggestion(r)}
                      className="w-full flex items-center gap-3 py-2 text-start hover:text-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30 group-hover:text-primary/50">history</span>
                      <span className="text-[13px] text-on-surface">{r}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="shrink-0 h-full px-5 bg-primary text-on-primary flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-all rounded-e-2xl font-bold text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
      </form>
    </div>
  );
}
