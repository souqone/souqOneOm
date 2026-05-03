import type { FormEvent } from 'react';
import { useLocale } from 'next-intl';
import { getCountries, getGovernorates, getCities } from '@/lib/location-data';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import type { UserProfile } from '@/lib/api/users';

interface ProfileSettingsTabProps {
  user: UserProfile;
  displayName: string;
  bio: string;
  country: string;
  governorate: string;
  city: string;
  phone: string;
  message: string;
  isPending: boolean;
  setDisplayName: (value: string) => void;
  setBio: (value: string) => void;
  setCountry: (value: string) => void;
  setGovernorate: (value: string) => void;
  setCity: (value: string) => void;
  setPhone: (value: string) => void;
  onSubmitPersonal: (e: FormEvent) => void;
  onSubmitContact: (e: FormEvent) => void;
  labels: {
    personalInfo: string;
    contactInfo: string;
    displayName: string;
    displayNamePlaceholder: string;
    username: string;
    country: string;
    countryPlaceholder: string;
    governorate: string;
    governoratePlaceholder: string;
    city: string;
    cityPlaceholder: string;
    bio: string;
    bioPlaceholder: string;
    phone: string;
    email: string;
    save: string;
  };
}

export function ProfileSettingsTab({
  user,
  displayName,
  bio,
  country,
  governorate,
  city,
  phone,
  message,
  isPending,
  setDisplayName,
  setBio,
  setCountry,
  setGovernorate,
  setCity,
  setPhone,
  onSubmitPersonal,
  onSubmitContact,
  labels,
}: ProfileSettingsTabProps) {
  const locale = useLocale();
  const countryOptions = getCountries(locale);
  const govOptions = country ? getGovernorates(country, locale) : [];
  const cityOptions = country && governorate ? getCities(country, governorate, locale) : [];

  function handleCountryChange(val: string) {
    setCountry(val);
    setGovernorate('');
    setCity('');
  }

  function handleGovernorateChange(val: string) {
    setGovernorate(val);
    setCity('');
  }

  return (
    <div className="p-4 space-y-3">
      <form onSubmit={onSubmitPersonal} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-4">
        <h2 className="text-[15px] font-bold text-on-surface">{labels.personalInfo}</h2>
        <div>
          <label className={labelCls}>{labels.displayName}</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={labels.displayNamePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{labels.username}</label>
          <div className="h-11 rounded-xl bg-surface-container-low px-3 flex items-center text-[13px] text-on-surface-variant">@{user.username}</div>
        </div>

        <div>
          <label className={labelCls}>{labels.country}</label>
          <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className={inputCls}>
            <option value="">{labels.countryPlaceholder}</option>
            {countryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>{labels.governorate}</label>
          <select value={governorate} onChange={(e) => handleGovernorateChange(e.target.value)} className={inputCls} disabled={!country}>
            <option value="">{labels.governoratePlaceholder}</option>
            {govOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>{labels.city}</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} disabled={!governorate}>
            <option value="">{labels.cityPlaceholder}</option>
            {cityOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>{labels.bio}</label>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={labels.bioPlaceholder} className={`${inputCls} resize-none`} />
        </div>
        {message && <p className="text-[12px] text-brand-green font-medium">{message}</p>}
        <button type="submit" disabled={isPending} className="w-full h-10 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
          {isPending && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          {labels.save}
        </button>
      </form>

      <form onSubmit={onSubmitContact} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-4">
        <h2 className="text-[15px] font-bold text-on-surface">{labels.contactInfo}</h2>
        <div>
          <label className={labelCls}>{labels.email}</label>
          <div className="h-11 rounded-xl bg-surface-container-low px-3 flex items-center justify-between text-[13px] text-on-surface">
            <span>{user.email}</span>
            {user.isVerified && <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
          </div>
        </div>
        <div>
          <label className={labelCls}>{labels.phone}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+968 9XXX XXXX" className={inputCls} dir="ltr" />
        </div>
        <button type="submit" disabled={isPending} className="w-full h-10 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
          {isPending && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          {labels.save}
        </button>
      </form>
    </div>
  );
}
