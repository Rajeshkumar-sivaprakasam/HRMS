import LeaveSection from '@/app/sections/LeaveSection';
import { serverGet } from '@/app/core/services/server-api';
import type { Holiday } from '@/lib/api';

/**
 * SSR proof-of-concept.
 *
 * This page is now an async Server Component (no 'use client', no
 * dynamic ssr:false). It fetches the initial holiday list on the SERVER
 * using the httpOnly cookie session, then passes it to the interactive
 * client section as seed data — so the first paint already has content.
 *
 * If the backend is unavailable, serverGet returns null and the client
 * section refetches as before (graceful, non-breaking).
 */
export default async function Page() {
  const year = new Date().getFullYear();

  const res = await serverGet<{ response?: { data?: Holiday[] } | Holiday[] }>(
    '/v1/holidays',
    { year },
  );

  const raw = res?.response;
  const initialHolidays: Holiday[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  return <LeaveSection initialHolidays={initialHolidays} />;
}
