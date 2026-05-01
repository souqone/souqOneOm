import type { Metadata } from 'next';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

export const metadata: Metadata = {
  title: 'حسابي',
  description: 'إدارة حسابك وإعلاناتك',
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
