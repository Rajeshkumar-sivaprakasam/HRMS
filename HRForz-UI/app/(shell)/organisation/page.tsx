'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const OrganisationSection = dynamic(
  () => import('../../sections/OrganisationSection'),
  { loading: () => <Skeleton height={600} />, ssr: false }
);

export default function Page() {
  return <OrganisationSection />;
}
