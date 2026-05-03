import type { Metadata } from 'next';
import { ProfilePageClient } from '@/features/profile/components/ProfilePageClient';

export const metadata: Metadata = {
  title: 'حسابي',
  description: 'إدارة حسابك وإعلاناتك',
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
