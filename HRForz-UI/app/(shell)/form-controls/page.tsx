'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const FormControlsSection = dynamic(() => import('../../sections/FormControlsSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <FormControlsSection />; }
