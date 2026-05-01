'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useAutocomplete } from '@/lib/api/search';
import { useDebounce } from '@/hooks/useDebounce';

const RECENT_KEY = 'carone.recent_searches';
const MAX_RECENT = 5;
function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
function saveRecent(q: string) { const r = getRecent().filter(s => s !== q); r.unshift(q); localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, MAX_RECENT))); }

function useSearchCategories() {
  const ts = useTranslations('search');
  return [
    { value: 'all',       label: ts('all'),       placeholder: ts('navPlaceholder'),         route: '/browse' },
    { value: 'cars',      label: ts('cars'),      placeholder: ts('navCarsPlaceholder'),      route: '/browse/cars' },
    { value: 'buses',     label: ts('buses'),     placeholder: ts('navBusesPlaceholder'),     route: '/browse/buses' },
    { value: 'equipment', label: ts('equipment'), placeholder: ts('navEquipmentPlaceholder'), route: '/browse/equipment' },
    { value: 'parts',     label: ts('parts'),     placeholder: ts('navPartsPlaceholder'),     route: '/browse/parts' },
    { value: 'services',  label: ts('services'),  placeholder: ts('navServicesPlaceholder'),  route: '/browse/services' },
    { value: 'jobs',      label: ts('jobs'),      placeholder: ts('navJobsPlaceholder'),      route: '/browse/jobs' },
  ];
}

interface NavSearchBarProps {
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  onCloseMobile?: () => void;
  height: number;
  navLinks: { href: string; label: string }[];
  isActive: (href: string) => boolean;
}

export function NavSearchBar({ searchOpen, onSearchOpenChange, onCloseMobile, height }: NavSearchBarProps) {
  const t = useTranslations('common');
  const ts = useTranslations('search');
  const router = useRouter();
  const searchCategories = useSearchCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [catOpen, setCatOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestions } = useAutocomplete(debouncedQuery);
  const activeCat = searchCategories.find(c => c.value === searchCategory) ?? searchCategories[0];

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function buildSearchUrl(query: string) {
    const cat = activeCat.value !== 'all' ? activeCat.value : 'cars';
    return `/browse/${cat}?q=${encodeURIComponent(query)}`;
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    saveRecent(searchQuery.trim());
    router.push(buildSearchUrl(searchQuery.trim()));
    onSearchOpenChange(false);
    setShowSuggestions(false);
    onCloseMobile?.();
  }

  function handleSuggestionClick(title: string) {
    setSearchQuery(title);
    saveRecent(title);
    router.push(buildSearchUrl(title));
    onSearchOpenChange(false);
    setShowSuggestions(false);
    onCloseMobile?.();
  }

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center" style={{ height }}>
      <div className="flex items-center gap-2 sm:gap-3 w-full max-w-[800px]">
        <form onSubmit={handleSearch} className="flex flex-1 h-[36px] rounded-xl border border-outline-variant/15 dark:border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container shadow-sm dark:shadow-none focus-within:border-primary/40 dark:focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(0,74,198,0.08)] dark:focus-within:shadow-[0_0_0_3px_rgba(96,165,250,0.15)] transition-all">
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen(p => !p)}
              className="h-full px-2.5 sm:px-3.5 bg-surface-container-low/60 dark:bg-surface-container-high/60 flex items-center gap-1 text-[12px] sm:text-[13px] font-bold text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors border-l border-outline-variant/15 dark:border-outline-variant/30 rounded-r-xl"
            >
              {activeCat.label}
              <span className={`material-symbols-outlined text-[11px] transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {catOpen && (
              <div className="absolute top-full end-0 mt-1.5 bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant/15 dark:border-outline-variant/30 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 min-w-[140px] rounded-xl overflow-hidden py-1">
                {searchCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => { setSearchCategory(cat.value); setCatOpen(false); }}
                    className={`w-full text-start px-4 py-2 text-[13px] font-semibold transition-colors ${
                      searchCategory === cat.value
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-highest'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1" ref={suggestRef}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={activeCat.placeholder}
              className="w-full h-full px-3 sm:px-4 text-[13px] sm:text-sm font-medium text-on-surface bg-transparent focus:outline-none placeholder:text-on-surface-variant/40 min-w-0"
            />
            {/* Suggestions dropdown */}
            {showSuggestions && (searchQuery.length >= 2 && suggestions && suggestions.length > 0 || searchQuery.length < 2) && (
              <div className="absolute top-[calc(100%+8px)] right-0 left-0 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 rounded-xl shadow-lg z-50 max-h-[50vh] overflow-y-auto py-1">
                {searchQuery.length >= 2 && suggestions && suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <button key={s.id} onClick={() => handleSuggestionClick(s.title)} className="w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant/40">search</span>
                      <span className="text-sm text-on-surface truncate" dangerouslySetInnerHTML={{ __html: s.highlighted || s.title }} />
                    </button>
                  ))
                ) : searchQuery.length < 2 ? (
                  <>
                    {getRecent().length > 0 && (
                      <div className="px-3 py-1.5">
                        <span className="text-[11px] font-bold text-on-surface-variant">{ts('recentSearches')}</span>
                        {getRecent().map((r, i) => (
                          <button key={i} onClick={() => handleSuggestionClick(r)} className="w-full flex items-center gap-2 py-1.5 text-start hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant/30">history</span>
                            <span className="text-sm text-on-surface">{r}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="h-full px-3 sm:px-4 bg-primary text-on-primary flex items-center justify-center hover:brightness-110 transition-colors rounded-l-xl"
          >
            <span className="material-symbols-outlined text-base">search</span>
          </button>
        </form>
        <Link href="/add-listing" className="shrink-0 btn-success h-[36px] px-3 sm:px-4 text-xs font-bold flex items-center gap-1.5 hover:brightness-105 hover:shadow-ambient">
          <span className="material-symbols-outlined text-sm">add</span>
          <span className="hidden sm:inline">{t('addListing')}</span>
        </Link>
      </div>
    </div>
  );
}
