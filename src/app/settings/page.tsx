'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
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
      if (data.user.role === 'SUPER_ADMIN') {
        fetchUsers();
      }
    });
  }, [router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setMessage(`Successfully created ${data.user.name} (${data.user.role})`);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <Sidebar userRole={user?.role} />

      <main>
        <Header userName={user?.name} userRole={user?.role} />

        <div className="row" style={{ marginTop: '12px' }}>
          <div>
            <h1>System Settings & User Management</h1>
            <p className="muted">Manage event administration accounts, RBAC roles, and capacity rules.</p>
          </div>
        </div>

        <div className="grid" style={{ marginTop: '24px' }}>
          <div className="card">
            <h2>Create Organiser Account</h2>
            <p className="muted">Add a new admin, desk operator, or volunteer account with strict password policy.</p>

            <form onSubmit={handleCreateUser}>
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@inspirecolloquium.org"
                  required
                />
              </label>

              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="ADMIN">ADMIN (Full management)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (System & User control)</option>
                  <option value="DESK_OPERATOR">DESK_OPERATOR (On-site check-in only)</option>
                  <option value="VOLUNTEER">VOLUNTEER (Read-only check-in)</option>
                </select>
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 10 chars with A-Z, a-z, 0-9, symbol"
                  required
                />
              </label>

              {error && <p className="error">{error}</p>}
              {message && <p className="banner" style={{ margin: '12px 0' }}>{message}</p>}

              <button type="submit" className="primary" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
                {loading ? 'Creating account…' : 'Create User Account'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Existing Organiser Accounts</h2>
            <p className="muted">All active administrative user accounts in the database.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {usersList.map((u) => (
                <div key={u.id} className="member" style={{ margin: 0 }}>
                  <div className="row">
                    <strong>{u.name}</strong>
                    <span className="badge">{u.role}</span>
                  </div>
                  <p style={{ fontSize: '12px', margin: '4px 0' }}>{u.email}</p>
                  <small className="muted">
                    Created: {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
