'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Participant } from '@prisma/client';

export default function DeskRegistrationPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [issuedKit, setIssuedKit] = useState(true);
  const [issuedCertificate, setIssuedCertificate] = useState(false);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<Participant[]>([]);

  useEffect(() => {
    fetch('/api/auth/session').then(async (res) => {
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    });
  }, [router]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/desk/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          issuedKit,
          issuedCertificate,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Check-in failed');
      }

      setMessage(data.message || `Checked in ${data.participant.name}`);
      setRecentCheckIns((prev) => [data.participant, ...prev.slice(0, 9)]);
      setIdentifier('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to check in participant');
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
            <h1>On-Site Desk Registration & Check-in</h1>
            <p className="muted">Verify participant tokens, record kit distribution, and issue badges.</p>
          </div>
        </div>

        <div className="grid" style={{ marginTop: '24px' }}>
          <div className="card">
            <h2>Scan or Enter Token</h2>
            <p className="muted">
              Enter Desk Token (e.g. <code>INSPIRE-AB1234</code>), Application Sequence No, or Email.
            </p>

            <form onSubmit={handleCheckIn}>
              <label>
                Participant Token / Application Seq / Email
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="INSPIRE-XXXXXX or APP-2026-001"
                  required
                  autoFocus
                />
              </label>

              <div className="row" style={{ margin: '16px 0', justifyContent: 'flex-start', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={issuedKit}
                    onChange={(e) => setIssuedKit(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>Issue Welcome Kit</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={issuedCertificate}
                    onChange={(e) => setIssuedCertificate(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>Issue Certificate</span>
                </label>
              </div>

              <label>
                Desk Notes (Optional)
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified student ID card"
                />
              </label>

              {error && <p className="error">{error}</p>}
              {message && <p className="banner" style={{ margin: '12px 0' }}>{message}</p>}

              <button type="submit" className="primary" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
                {loading ? 'Processing check-in…' : '✔ Complete Desk Check-in'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Recent Desk Check-ins</h2>
            <p className="muted">List of participants checked in during this session.</p>

            {recentCheckIns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {recentCheckIns.map((p) => (
                  <div key={p.id} className="member" style={{ margin: 0 }}>
                    <div className="row">
                      <strong>{p.name}</strong>
                      <span className="badge">{p.academicCategory}</span>
                    </div>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}>{p.collegeName}</p>
                    <small className="muted">
                      Token: <code>{p.deskToken}</code> • Kit: {p.issuedKit ? 'Issued' : 'No'}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <h3>No check-ins yet</h3>
                <p className="muted">Scan or enter participant credentials to log check-ins.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
