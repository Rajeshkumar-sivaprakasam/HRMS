'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const EmployeeAddSection = dynamic(
  () => import('../../../sections/EmployeeAddSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <EmployeeAddSection />;
}
