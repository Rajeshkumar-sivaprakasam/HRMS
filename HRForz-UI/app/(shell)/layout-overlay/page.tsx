'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const LayoutSection = dynamic(() => import('../../sections/LayoutSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <LayoutSection />; }
