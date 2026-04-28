'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import AnalyticsChart from '@/components/AnalyticsChart';
import ApplicationsTable from '@/components/ApplicationsTable';
import { listApplications, Application } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'board' | 'table' | 'analytics'>('table');
  const [checking, setChecking] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await listApplications();
      setApps(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  }, []);

  function logout() {
    localStorage.removeItem('token');
    router.push('/');
  }

  const tabs: { key: 'board' | 'table' | 'analytics'; label: string }[] = [
    { key: 'board', label: 'Application Status Board' },
    { key: 'table', label: 'All Applications' },
    { key: 'analytics', label: 'Analytics' },
  ];

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
      load();
    }
  }, [router, load]);

  if (checking) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#191919', position: 'relative' }}>
      {/* Logout button — top right */}
      <button
        onClick={logout}
        style={{
          position: 'absolute',
          top: '16px',
          right: '32px',
          color: '#787878',
          fontSize: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>

      {/* Page header */}
      <h1
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '2rem',
          fontWeight: 700,
          color: '#ffffffcf',
          padding: '32px 32px 0 32px',
          margin: 0,
        }}
      >
        🎓 Job Application Tracker
      </h1>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginTop: '20px',
          padding: '0 32px',
          borderBottom: '1px solid #2e2e2e',
        }}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: tab === key ? '#ffffffcf' : '#787878',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: tab === key ? '2px solid #ffffffcf' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ padding: '24px 32px' }}>
        {tab === 'board' && <KanbanBoard />}
        {tab === 'table' && <ApplicationsTable apps={apps} onRefresh={load} />}
        {tab === 'analytics' && <AnalyticsChart />}
      </div>
    </div>
  );
}
