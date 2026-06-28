'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const NotificationsSection = dynamic(
  () => import('../../sections/NotificationsSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <NotificationsSection />;
}
