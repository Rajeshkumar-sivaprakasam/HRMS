'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const SettingsSection = dynamic(
  () => import('../../sections/SettingsSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <SettingsSection />;
}
