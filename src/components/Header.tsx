'use client';

import { ThemeToggle } from './ThemeToggle';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ userName, userRole, onRefresh, isRefreshing }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header>
      <span className="eyebrow">Organiser workspace / overview</span>
      <div className="row">
        {userName && (
          <span className="badge" style={{ fontSize: '12px', padding: '6px 12px' }}>
            👤 {userName} ({userRole})
          </span>
        )}
        <ThemeToggle />
        {onRefresh && (
          <button onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? '↻ Syncing…' : '↻ Refresh'}
          </button>
        )}
        <button onClick={handleSignOut} className="primary">
          Sign out
        </button>
      </div>
    </header>
  );
}
