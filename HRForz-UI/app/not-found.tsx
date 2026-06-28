import Link from 'next/link';

/**
 * Root 404 page (Next.js App Router convention).
 * Server-rendered. Shown for unmatched routes or when notFound() is called.
 */
export default function NotFound() {
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
      <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ink-900)' }}>
        404 — Page not found
      </h2>
      <p style={{ margin: 0, color: 'var(--ink-500)' }}>
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/dashboard" style={{ color: 'var(--brand-500)', fontWeight: 600 }}>
        Go to dashboard
      </Link>
    </div>
  );
}
