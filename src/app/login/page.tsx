'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lock-screen">
      <div className="card lock-card">
        <div className="brand">
          INSPIRE<small>COLLOQUIUM</small>
        </div>

        <h1 style={{ marginTop: '20px' }}>Organiser Sign In</h1>
        <p className="muted">Enter your administrator or desk operator credentials.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@inspirecolloquium.org"
              required
              autoFocus
            />
          </label>

          <label style={{ marginTop: '12px' }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="primary" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Authenticating…' : 'Sign in to dashboard →'}
          </button>
        </form>

        <p className="muted" style={{ fontSize: '12px', marginTop: '22px', textAlign: 'center' }}>
          Production access with RBAC enforcement and full audit trail logging.
        </p>
      </div>
    </section>
  );
}
