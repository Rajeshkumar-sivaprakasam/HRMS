'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const EmployeeListSection = dynamic(
  () => import('../../sections/EmployeeListSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <EmployeeListSection />;
}
