'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const LeaveSection = dynamic(
  () => import('../../sections/LeaveSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <LeaveSection />;
}
