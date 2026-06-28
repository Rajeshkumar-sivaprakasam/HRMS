'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const AttendanceSection = dynamic(
  () => import('../../sections/AttendanceSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <AttendanceSection />;
}
