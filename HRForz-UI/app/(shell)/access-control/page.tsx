'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const RBACDemoSection = dynamic(() => import('../../sections/RBACDemoSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <RBACDemoSection />; }
