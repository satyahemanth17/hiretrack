'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import AnalyticsChart from '@/components/AnalyticsChart';

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'board' | 'analytics'>('board');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Read token from URL if present (after GitHub OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      // Clean the token from the URL
      window.history.replaceState({}, '', '/dashboard');
    }

    const stored = localStorage.getItem('token');
    if (!stored) {
      router.push('/');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  function logout() {
    localStorage.removeItem('token');
    router.push('/');
  }

  const navStyle = {
    backgroundColor: 'var(--card-bg)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    height: '52px',
  };
  const activeTab = {
    borderBottom: '2px solid var(--primary)',
    color: 'var(--primary)',
    fontWeight: '500' as const,
  };
  const inactiveTab = { color: 'var(--text-secondary)' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <nav style={navStyle}>
        <span className="font-semibold" style={{ color: 'var(--primary)' }}>
          HireTrack
        </span>
        <a href="/dashboard" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Dashboard
        </a>
        <a href="/matcher" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Matcher
        </a>
        <div className="flex-1" />
        <button onClick={logout} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Logout
        </button>
      </nav>
      <div style={{ padding: '24px' }}>
        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setTab('board')}
            className="pb-3 text-sm"
            style={tab === 'board' ? activeTab : inactiveTab}
          >
            Board
          </button>
          <button
            onClick={() => setTab('analytics')}
            className="pb-3 text-sm"
            style={tab === 'analytics' ? activeTab : inactiveTab}
          >
            Analytics
          </button>
        </div>
        {tab === 'board' ? <KanbanBoard /> : <AnalyticsChart />}
      </div>
    </div>
  );
}
