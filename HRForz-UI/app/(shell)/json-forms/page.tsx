'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const JsonFormsSection = dynamic(() => import('../../sections/JsonFormsSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <JsonFormsSection />; }
