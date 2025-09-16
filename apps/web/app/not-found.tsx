export default function NotFound() {
  return (
    <main style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 48, margin: '0 0 16px', fontWeight: 800, color: '#111827' }}>404</h1>
      <p style={{ fontSize: 18, color: '#4b5563', marginBottom: 24 }}>
        The page you were looking for could not be found.
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          background: '#2563eb',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Go Home
      </a>
    </main>
  );
}
