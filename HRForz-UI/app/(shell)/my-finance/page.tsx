'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const MyFinanceSection = dynamic(
  () => import('../../sections/MyFinanceSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <MyFinanceSection />;
}
