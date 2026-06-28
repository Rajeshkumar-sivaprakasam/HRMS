'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const IconsChartsSection = dynamic(() => import('../../sections/IconsChartsSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <IconsChartsSection />; }
