'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { ErrorState } from '@/components/error-state';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useMe, useMyListings, useFavorites, useDeleteListing, useUpdateProfile, useChangePassword, useUploadImage, useMyBookings } from '@/lib/api';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { ProfileHero } from './ProfileHero';
import { ProfileHeroSkeleton } from './ProfileHeroSkeleton';
import { ProfileNavTabs, type ProfileTab } from './ProfileNavTabs';
import { ProfileNavTabsSkeleton } from './ProfileNavTabsSkeleton';
import { ProfileOverviewTab } from './ProfileOverviewTab';
import { ProfileListingsTab } from './ProfileListingsTab';
import { ProfileListingsTabSkeleton } from './ProfileListingsTabSkeleton';
import { ProfileBookingsTab } from './ProfileBookingsTab';
import { ProfileBookingsTabSkeleton } from './ProfileBookingsTabSkeleton';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import { ProfileSecurityTab } from './ProfileSecurityTab';
import { ProfileVerificationStatus } from './ProfileVerificationStatus';

export function ProfilePageClient() {
  const tp = useTranslations('pages');
  const router = useRouter();
  const { logout } = useAuth();
  const { transformCar } = useItemTransformers();

  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useMe();
  const { data: myListings, isLoading: listingsLoading } = useMyListings({ limit: '50' });
  const { data: favorites } = useFavorites();
  const { data: bookings, isLoading: bookingsLoading } = useMyBookings({ page: '1' });

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteListing = useDeleteListing();
  const uploadImage = useUploadImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setBio(user.bio || '');
    setCountry(user.country || 'OM');
    setGovernorate(user.governorate || '');
    setCity(user.city || '');
    setPhone(user.phone || '');
  }, [user]);

  const listings = useMemo(() => (myListings?.items ?? []).map(transformCar), [myListings?.items, transformCar]);
  const listingsCount = myListings?.meta?.total ?? listings.length;
  const favoritesCount = favorites?.meta?.total ?? favorites?.items?.length ?? 0;
  const bookingsCount = bookings?.meta?.total ?? bookings?.items?.length ?? 0;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadImage.mutateAsync(file);
      await updateProfile.mutateAsync({ avatarUrl: result.url });
      await refetchUser();
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : tp('profileError'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updateProfile.mutateAsync({
        displayName: displayName || undefined,
        bio: bio || undefined,
        country: country || undefined,
        governorate: governorate || undefined,
        city: city || undefined,
      });
      setProfileMsg(tp('profileSaved'));
      await refetchUser();
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : tp('profileError'));
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updateProfile.mutateAsync({ phone: phone || undefined });
      setProfileMsg(tp('profileSaved'));
      await refetchUser();
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : tp('profileError'));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg('');
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPasswordMsg(tp('profilePasswordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : tp('profileError'));
    }
  }

  function handleDelete(id: string) {
    if (confirm(tp('profileDeleteConfirm'))) deleteListing.mutate(id);
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (userLoading) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="min-h-screen bg-background">
          <ProfileHeroSkeleton />
          <ProfileNavTabsSkeleton />
          <ProfileListingsTabSkeleton />
        </div>
      </AuthGuard>
    );
  }

  if (userError || !user) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="pt-28 px-8"><ErrorState onRetry={() => refetchUser()} /></div>
      </AuthGuard>
    );
  }

  const navLabels = {
    overview: tp('profileTabOverview'),
    listings: tp('profileTabListings'),
    bookings: tp('profileTabBookings'),
    settings: tp('profileTabSettings'),
    security: tp('profileTabSecurity'),
    logout: tp('profileLogout'),
  };

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background">
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        <ProfileHero
          user={user}
          stats={{ listingsCount, favoritesCount, bookingsCount }}
          onAvatarClick={() => fileInputRef.current?.click()}
          avatarUploading={avatarUploading}
          labels={{
            editProfile: tp('profileEdit'),
            memberSince: tp('profileMemberSinceYear', { year: new Date(user.createdAt).getFullYear() }),
            listings: tp('profileStatsListings'),
            favorites: tp('profileStatsFavorites'),
            bookings: tp('profileStatsBookings'),
          }}
        />

        <ProfileVerificationStatus
          user={user}
          onAddPhone={() => setActiveTab('settings')}
          labels={{
            phoneVerified: tp('profilePhoneVerified'),
            addPhone: tp('profileAddPhone'),
            accountVerified: tp('profileAccountVerified'),
            verifyEmail: tp('profileVerifyEmail'),
          }}
        />

        <ProfileNavTabs active={activeTab} onChange={setActiveTab} counts={{ listings: listingsCount, bookings: bookingsCount }} labels={navLabels} className="md:hidden" />

        <div className="md:flex md:flex-row-reverse md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">
          <ProfileNavTabs active={activeTab} onChange={setActiveTab} counts={{ listings: listingsCount, bookings: bookingsCount }} labels={navLabels} variant="sidebar" onLogout={handleLogout} className="hidden md:block" />

          <main className="flex-1 min-w-0 pb-24 md:pb-8" id="main-content">
            {activeTab === 'overview' && (
              <ProfileOverviewTab
                listings={listings}
                onOpenSettings={() => setActiveTab('settings')}
                onOpenSecurity={() => setActiveTab('security')}
                onDelete={handleDelete}
                isDeleting={deleteListing.isPending}
                labels={{
                  addListing: tp('profileAddListing'),
                  recentListings: tp('profileRecentListings'),
                  noListings: tp('profileNoListings'),
                  noListingsDesc: tp('profileNoListingsDesc'),
                  addFirst: tp('profileAddFirst'),
                  edit: tp('profileEditAction'),
                  delete: tp('profileDeleteAction'),
                  personalInfo: tp('profilePersonalInfo'),
                  personalInfoDesc: tp('profilePersonalInfoDesc'),
                  contactInfo: tp('profileContactInfo'),
                  contactInfoDesc: tp('profileContactInfoDesc'),
                  security: tp('profileTabSecurity'),
                  securityDesc: tp('profileSecurityDesc'),
                }}
              />
            )}

            {activeTab === 'listings' && (
              listingsLoading ? <ProfileListingsTabSkeleton /> : (
                <ProfileListingsTab
                  listings={listings}
                  isDeleting={deleteListing.isPending}
                  onDelete={handleDelete}
                  labels={{
                    emptyTitle: tp('profileNoListings'),
                    emptyDescription: tp('profileNoListingsDesc'),
                    addFirst: tp('profileAddFirst'),
                    edit: tp('profileEditAction'),
                    delete: tp('profileDeleteAction'),
                  }}
                />
              )
            )}

            {activeTab === 'bookings' && (
              bookingsLoading ? <ProfileBookingsTabSkeleton /> : (
                <ProfileBookingsTab
                  bookings={bookings?.items ?? []}
                  labels={{
                    emptyTitle: tp('profileNoBookings'),
                    emptyDescription: tp('profileNoBookingsDesc'),
                    currency: tp('profileCurrency'),
                  }}
                />
              )
            )}

            {activeTab === 'settings' && (
              <ProfileSettingsTab
                user={user}
                displayName={displayName}
                bio={bio}
                country={country}
                governorate={governorate}
                city={city}
                phone={phone}
                message={profileMsg}
                isPending={updateProfile.isPending}
                setDisplayName={setDisplayName}
                setBio={setBio}
                setCountry={setCountry}
                setGovernorate={setGovernorate}
                setCity={setCity}
                setPhone={setPhone}
                onSubmitPersonal={savePersonal}
                onSubmitContact={saveContact}
                labels={{
                  personalInfo: tp('profilePersonalInfo'),
                  contactInfo: tp('profileContactInfo'),
                  displayName: tp('profileDisplayNameLabel'),
                  displayNamePlaceholder: tp('profileDisplayNamePlaceholder'),
                  username: tp('profileInfoUsername'),
                  country: tp('profileCountryLabel'),
                  countryPlaceholder: tp('profileCountryPlaceholder'),
                  governorate: tp('profileGovernorateLabel'),
                  governoratePlaceholder: tp('profileGovernoratePlaceholder'),
                  city: tp('profileCityLabel'),
                  cityPlaceholder: tp('profileCityPlaceholder'),
                  bio: tp('profileBioLabel'),
                  bioPlaceholder: tp('profileBioPlaceholder'),
                  phone: tp('profileInfoPhone'),
                  email: tp('profileInfoEmail'),
                  save: tp('profileSaveChanges'),
                }}
              />
            )}

            {activeTab === 'security' && (
              <ProfileSecurityTab
                currentPassword={currentPassword}
                newPassword={newPassword}
                message={passwordMsg}
                isPending={changePassword.isPending}
                deleteConfirm={deleteConfirm}
                setCurrentPassword={setCurrentPassword}
                setNewPassword={setNewPassword}
                setDeleteConfirm={setDeleteConfirm}
                onSubmit={handleChangePassword}
                labels={{
                  title: tp('profileChangePassword'),
                  currentPassword: tp('profileCurrentPassword'),
                  newPassword: tp('profileNewPassword'),
                  changePassword: tp('profileChangePasswordBtn'),
                  deleteAccount: tp('profileDeleteAccount'),
                  deleteConfirm: tp('profileDeleteAccountConfirm'),
                  confirmDelete: tp('profileConfirmDeleteAccount'),
                  cancel: tp('profileCancel'),
                }}
              />
            )}
          </main>
        </div>
      </div>
      <Footer />
    </AuthGuard>
  );
}
