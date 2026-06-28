'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';
const DataTableSection = dynamic(() => import('../../sections/DataTableSection'), {
  loading: () => <Skeleton height={400} />, ssr: false,
});
export default function Page() { return <DataTableSection />; }
