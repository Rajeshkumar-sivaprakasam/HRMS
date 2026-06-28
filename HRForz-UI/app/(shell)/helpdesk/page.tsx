'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const HelpdeskSection = dynamic(
  () => import('../../sections/HelpdeskSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <HelpdeskSection />;
}
