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
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--primary)' }}>
            HireTrack
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Track your job search, effortlessly.
          </p>
        </div>
        <a
          href="http://localhost:4000/api/auth/github"
          className="inline-block px-6 py-2 rounded text-white font-medium transition-colors"
          style={{ backgroundColor: 'var(--primary)', borderRadius: '4px' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
