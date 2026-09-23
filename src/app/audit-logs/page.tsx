'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?page=${page}&limit=50`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 });
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session').then(async (res) => {
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      fetchAuditLogs();
    });
  }, [router]);

  return (
    <div className="shell">
      <Sidebar userRole={user?.role} />

      <main>
        <Header userName={user?.name} userRole={user?.role} />

        <div className="row" style={{ marginTop: '12px' }}>
          <div>
            <h1>Security Audit Trail</h1>
            <p className="muted">Immutable log of administrative logins, status changes, and data updates.</p>
          </div>
        </div>

        <section className="card" style={{ marginTop: '24px' }}>
          <div className="row">
            <h2>System Audit Events</h2>
            <span className="muted">{pagination.total} total logged events</span>
          </div>

          <div className="table-wrap" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Email</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                      <td>
                        <strong>{log.actorEmail}</strong>
                      </td>
                      <td>
                        <span className="badge">{log.actorRole || 'SYSTEM'}</span>
                      </td>
                      <td>
                        <span className="badge">{log.action}</span>
                      </td>
                      <td>{log.entityType}</td>
                      <td><code>{log.ipAddress || '—'}</code></td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <small>{log.details || '—'}</small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">
                        <h3>No audit events recorded</h3>
                        <p className="muted">Audit events will appear as users perform administrative actions.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: '16px' }}>
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchAuditLogs(pagination.page - 1)}
            >
              ← Previous
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchAuditLogs(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
