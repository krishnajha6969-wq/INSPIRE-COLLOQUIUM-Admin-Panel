'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatsGrid } from '@/components/StatsGrid';
import { CapacityGrid } from '@/components/CapacityGrid';
import { ParticipantTable } from '@/components/ParticipantTable';
import { Participant } from '@prisma/client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState('all');

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [stats, setStats] = useState({ totalParticipants: 0, selectedUG: 0, selectedPG: 0, selectedPhD: 0 });
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    selectionStatus?: string;
    registrationStatus?: string;
    page?: number;
  }>({ page: 1 });

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) {
        router.push('/login');
        return false;
      }
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch {
      router.push('/login');
      return false;
    }
  };

  const fetchParticipants = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);

      // Handle view tab presets
      if (currentView === 'review') {
        params.append('selectionStatus', 'UNDER_REVIEW');
      } else if (currentView === 'payment') {
        params.append('selectionStatus', 'SELECTED');
        params.append('registrationStatus', 'APPLIED');
      } else {
        if (filters.selectionStatus) params.append('selectionStatus', filters.selectionStatus);
        if (filters.registrationStatus) params.append('registrationStatus', filters.registrationStatus);
      }

      params.append('page', String(filters.page || 1));
      params.append('limit', '50');

      const res = await fetch(`/api/participants?${params.toString()}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 });
        setStats(data.stats || { totalParticipants: 0, selectedUG: 0, selectedPG: 0, selectedPhD: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch participants:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [filters, currentView, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    fetchSession().then((authenticated) => {
      if (authenticated) {
        fetchParticipants();
        // Polling refresh every 15 seconds
        interval = setInterval(() => {
          fetchParticipants();
        }, 15000);
      }
    });

    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setFilters({ page: 1 });
  };

  if (loading) {
    return (
      <div className="lock-screen">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="brand">
            INSPIRE<small>COLLOQUIUM</small>
          </div>
          <p style={{ marginTop: '20px' }}>Loading workspace session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} userRole={user?.role} />

      <main>
        <Header
          userName={user?.name}
          userRole={user?.role}
          onRefresh={fetchParticipants}
          isRefreshing={refreshing}
        />

        <div className="row" style={{ marginTop: '12px' }}>
          <div>
            <h1>Every idea. One workspace.</h1>
            <p className="muted">Registrations, evaluation review, and payment status — together.</p>
          </div>
        </div>

        <div className="banner">
          Connected • Signed in as {user?.name} ({user?.role}) • Auto-refreshes every 15 seconds
        </div>

        <StatsGrid
          total={stats.totalParticipants}
          today={participants.filter((p) => new Date(p.createdAt).toDateString() === new Date().toDateString()).length}
          pending={participants.filter((p) => p.selectionStatus === 'UNDER_REVIEW').length}
          unpaid={participants.filter((p) => p.selectionStatus === 'SELECTED' && p.registrationStatus !== 'REGISTERED').length}
        />

        <CapacityGrid stats={stats} />

        <ParticipantTable
          participants={participants}
          pagination={pagination}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onRefresh={fetchParticipants}
        />
      </main>
    </div>
  );
}
