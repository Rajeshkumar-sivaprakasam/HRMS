import { Skeleton } from '@/components';

/**
 * Route-level loading UI (Next.js App Router convention).
 * Rendered on the server and streamed instantly while the matching
 * page/segment suspends — gives an immediate skeleton instead of a blank screen.
 */
export default function Loading() {
  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton width={240} height={28} />
      <Skeleton height={120} />
      <Skeleton height={420} />
    </div>
  );
}
