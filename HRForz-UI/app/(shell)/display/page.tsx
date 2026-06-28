'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const DisplaySection = dynamic(() => import('../../sections/DisplaySection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <DisplaySection />; }
