'use client';

import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/auth';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { GoogleSignInButton } from '@/components/google-sign-in';
import { getCountryCodes } from '@/lib/country-codes';
import { useTranslations, useLocale } from 'next-intl';
import { CustomSelect } from '@/components/ui/custom-select';
import { getGovernorates, getCities } from '@/lib/location-data';
import { LegalSheet } from '@/components/legal/LegalSheet';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { login: authLogin } = useAuth();
  const { switchView } = useAuthModal();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+968');
  const [showCodes, setShowCodes] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState('');
  const [country] = useState('OM');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);

  const governorateOptions = getGovernorates(country, locale);
  const cityOptions = getCities(country, governorate, locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const codes = getCountryCodes(locale);
  const filteredCodes = codes.filter(
    (c) => c.name.includes(codeSearch) || c.dial.includes(codeSearch) || c.code.toLowerCase().includes(codeSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCodes(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ accessToken: string; refreshToken?: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          phone: phone ? `${countryCode}${phone}` : undefined,
          country,
          governorate,
          city,
        }),
      });
      await authLogin(result.accessToken, result.refreshToken);
      sessionStorage.setItem('new_user', 'true');
      switchView('verify');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unexpectedError');
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">

        {/* ── Section 1: المعلومات الأساسية ── */}
        <div className="section-divider"><span>{t('basicInfo')}</span></div>

        {/* Username */}
        <div>
          <label className="text-[10.5px] font-semibold text-on-surface-variant/80 block mb-0.5">
            {t('username')}
          </label>
          <input
            className="auth-input"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('usernamePlaceholder')}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-[10.5px] font-semibold text-on-surface-variant/80 block mb-0.5">
            {t('emailLabel')}
          </label>
          <input
            className="auth-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
          />
        </div>

        {/* Phone */}
        <div ref={dropdownRef}>
          <label className="text-[10.5px] font-semibold text-on-surface-variant/80 block mb-0.5">
            {t('phoneLabel')}{' '}
            <span className="text-[9.5px] text-on-surface-variant/40 font-normal">{t('phoneOptional')}</span>
          </label>
          <div className="grid grid-cols-[80px_1fr] gap-2 relative" dir="ltr">
            <button
              type="button"
              onClick={() => { setShowCodes(!showCodes); setCodeSearch(''); }}
              className="auth-input px-1.5 flex items-center justify-center gap-0.5 cursor-pointer"
            >
              <span className="text-[11px]">{countryCode}</span>
              <span className="material-symbols-outlined text-[13px] text-on-surface-variant/60">expand_more</span>
            </button>
            <input
              type="tel"
              className="auth-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('phonePlaceholder')}
            />
            {showCodes && (
              <div className="absolute top-full left-0 mt-2 w-full max-w-[288px] bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant/20 dark:border-outline-variant/30 rounded-2xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-50 max-h-64 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-outline-variant/15 dark:border-outline-variant/25">
                  <input
                    type="text"
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    placeholder={t('searchCountry')}
                    className="auth-input h-9 text-xs"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-52 pb-1">
                  {filteredCodes.map((c) => (
                    <button
                      key={c.code + c.dial}
                      type="button"
                      onClick={() => { setCountryCode(c.dial); setShowCodes(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] border-none cursor-pointer font-inherit transition-colors ${
                        c.dial === countryCode
                          ? 'bg-primary/8 text-primary font-semibold'
                          : 'bg-transparent text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-highest'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span className="flex-1 text-start">{c.name}</span>
                      <span className={`text-[11px] ${c.dial === countryCode ? 'text-primary' : 'text-on-surface-variant/60'}`} dir="ltr">{c.dial}</span>
                    </button>
                  ))}
                  {filteredCodes.length === 0 && (
                    <div className="py-5 px-3 text-center text-[13px] text-on-surface-variant/60">{tc('noResults')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: الموقع ── */}
        <div className="section-divider"><span>{t('location')}</span></div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10.5px] font-semibold text-on-surface-variant/80 block mb-0.5">
              {t('governorate')}
            </label>
            <div className="auth-input flex items-center !px-3 !py-0">
              <CustomSelect
                value={governorate}
                onChange={(val) => { setGovernorate(val); setCity(''); }}
                options={governorateOptions}
                placeholder={country ? t('governoratePlaceholder') : t('selectCountryFirst')}
                disabled={!country}
                searchable
                variant="light"
              />
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-semibold text-on-surface-variant/80 block mb-0.5">
              {t('area')}
            </label>
            <div className="auth-input flex items-center !px-3 !py-0">
              <CustomSelect
                value={city}
                onChange={setCity}
                options={cityOptions}
                placeholder={governorate ? t('cityPlaceholder') : t('selectGovFirst')}
                disabled={!governorate}
                searchable
                variant="light"
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: الأمان ── */}
        <div className="section-divider"><span>{t('security')}</span></div>

        {/* Password */}
        <div>
          <label className="text-[11px] font-semibold text-on-surface-variant/80 block mb-1">
            {t('passwordLabel')}{' '}
            <span className="text-[9.5px] text-on-surface-variant/40 font-normal">{t('passwordHint')}</span>
          </label>
          <div className="relative flex items-center">
            <input
              className="auth-input"
              style={{ paddingInlineStart: 42 }}
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="material-symbols-outlined text-on-surface-variant/50 hover:text-primary transition-colors cursor-pointer"
              style={{
                position: 'absolute',
                insetInlineStart: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-lg px-2.5 py-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
          />
          <span className="text-[10px] text-on-surface-variant leading-relaxed">
            {t('agreeToTerms')}{' '}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setLegalSheet('terms'); }}
              className="text-primary hover:underline font-semibold"
            >
              {t('termsAndConditions')}
            </button>
            {' '}{t('and')}{' '}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setLegalSheet('privacy'); }}
              className="text-primary hover:underline font-semibold"
            >
              {t('privacyPolicy')}
            </button>
          </span>
        </label>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-3.5 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !agreedTerms}
          className="btn-primary w-full h-[38px] sm:h-[42px] rounded-xl text-[12px] sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              {t('creating')}
            </>
          ) : (
            <>
              {t('createFreeAccount')}
              <span className="material-symbols-outlined text-base">how_to_reg</span>
            </>
          )}
        </button>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant/40">
          <span className="material-symbols-outlined text-xs">lock</span>
          {t('dataSecure')}
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-2 sm:my-3">
        <div className="h-px flex-1 bg-outline-variant/20" />
        <span className="text-xs text-on-surface-variant/60 font-medium">{t('or')}</span>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>

      {/* Google Sign-In */}
      <GoogleSignInButton onError={setError} />

      <p className="text-center text-xs text-on-surface-variant font-medium mt-2 sm:mt-3">
        {t('hasAccount')}{' '}
        <button type="button" onClick={() => switchView('login')} className="text-primary font-bold hover:underline">
          {t('loginBtn')}
        </button>
      </p>

      {legalSheet && (
        <LegalSheet
          type={legalSheet}
          open
          onClose={() => setLegalSheet(null)}
          onAgree={() => {
            setAgreedTerms(true);
            setLegalSheet(null);
          }}
        />
      )}
    </div>
  );
}
