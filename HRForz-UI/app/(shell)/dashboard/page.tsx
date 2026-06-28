'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const DashboardSection = dynamic(
  () => import('../../sections/DashboardSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <DashboardSection />;
}
