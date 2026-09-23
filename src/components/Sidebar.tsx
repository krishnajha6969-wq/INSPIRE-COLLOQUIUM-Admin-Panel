'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  userRole?: string;
}

export function Sidebar({ currentView = 'all', onViewChange, userRole }: SidebarProps) {
  const pathname = usePathname();

  const isDashboard = pathname === '/';

  return (
    <aside>
      <div className="brand">
        INSPIRE<small>COLLOQUIUM</small>
      </div>

      <div className="eyebrow" style={{ marginTop: '26px' }}>
        Organiser workspace
      </div>

      <nav>
        {isDashboard && onViewChange ? (
          <>
            <button
              className={currentView === 'all' ? 'active' : ''}
              onClick={() => onViewChange('all')}
            >
              ▦ &nbsp; Registrations
            </button>
            <button
              className={currentView === 'review' ? 'active' : ''}
              onClick={() => onViewChange('review')}
            >
              ◷ &nbsp; Evaluation queue
            </button>
            <button
              className={currentView === 'payment' ? 'active' : ''}
              onClick={() => onViewChange('payment')}
            >
              ₹ &nbsp; Awaiting payment
            </button>
          </>
        ) : (
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            ▦ &nbsp; Dashboard
          </Link>
        )}

        <Link
          href="/desk-registration"
          className={pathname === '/desk-registration' ? 'active' : ''}
        >
          🎟️ &nbsp; Desk check-in
        </Link>

        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
          <Link
            href="/audit-logs"
            className={pathname === '/audit-logs' ? 'active' : ''}
          >
            📜 &nbsp; Audit logs
          </Link>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <Link
            href="/settings"
            className={pathname === '/settings' ? 'active' : ''}
          >
            ⚙ &nbsp; System settings
          </Link>
        )}
      </nav>

      <div className="side-note">
        <strong>INSPIRE 2026</strong>
        <p>Production admin system with RBAC, audit trail & desk check-in.</p>
      </div>
    </aside>
  );
}
