'use client';

import { useEffect } from 'react';
import { Button } from '@/components';

/**
 * Root error boundary (Next.js App Router convention).
 * Must be a Client Component. Catches render/runtime errors in the
 * route subtree so one failing section doesn't blank the whole app.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for logging/monitoring.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 12,
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h2 style={{ margin: 0, color: 'var(--ink-900)' }}>Something went wrong</h2>
      <p style={{ margin: 0, color: 'var(--ink-500)', maxWidth: 480 }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
