'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#191919',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem' }}>🎓</div>
        <h1
          style={{
            fontSize: '2rem',
            color: '#ffffffcf',
            fontWeight: 700,
            marginTop: '8px',
          }}
        >
          Job Application Tracker
        </h1>
        <p
          style={{
            color: '#787878',
            fontSize: '0.875rem',
            marginTop: '8px',
          }}
        >
          Track your job applications, effortlessly.
        </p>
        <a
          href="http://localhost:4000/api/auth/github"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#252525',
            border: '1px solid #2e2e2e',
            color: '#ffffffcf',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '0.875rem',
            marginTop: '32px',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2e2e2e')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#252525')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
