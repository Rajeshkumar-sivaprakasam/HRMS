'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const DataTypographySection = dynamic(() => import('../../sections/DataTypographySection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <DataTypographySection />; }
