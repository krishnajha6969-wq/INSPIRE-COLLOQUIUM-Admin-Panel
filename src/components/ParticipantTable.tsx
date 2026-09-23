'use client';

import { useState } from 'react';
import { Participant } from '@prisma/client';
import { ParticipantDetailModal } from './ParticipantDetailModal';

interface ParticipantTableProps {
  participants: Participant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onFilterChange: (filters: {
    search?: string;
    category?: string;
    selectionStatus?: string;
    registrationStatus?: string;
    page?: number;
  }) => void;
  onRefresh: () => void;
}

export function ParticipantTable({
  participants,
  pagination,
  onFilterChange,
  onRefresh,
}: ParticipantTableProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectionStatus, setSelectionStatus] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onFilterChange({
      search: e.target.value,
      category,
      selectionStatus,
      registrationStatus,
      page: 1,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    onFilterChange({
      search,
      category: e.target.value,
      selectionStatus,
      registrationStatus,
      page: 1,
    });
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectionStatus(e.target.value);
    onFilterChange({
      search,
      category,
      selectionStatus: e.target.value,
      registrationStatus,
      page: 1,
    });
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegistrationStatus(e.target.value);
    onFilterChange({
      search,
      category,
      selectionStatus,
      registrationStatus: e.target.value,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSelectionStatus('');
    setRegistrationStatus('');
    onFilterChange({ search: '', category: '', selectionStatus: '', registrationStatus: '', page: 1 });
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (selectionStatus) params.append('selectionStatus', selectionStatus);
    if (registrationStatus) params.append('registrationStatus', registrationStatus);

    window.open(`/api/export/csv?${params.toString()}`, '_blank');
  };

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Registration directory</h2>
          <span className="muted">{pagination.total} matching participants</span>
        </div>
        <button onClick={handleExportCsv} className="primary">
          ↓ Export filtered CSV
        </button>
      </div>

      <div className="filters">
        <label>
          Search participant or paper
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Name, email, seq no, college, paper title..."
          />
        </label>

        <label>
          Category
          <select value={category} onChange={handleCategoryChange}>
            <option value="">All categories</option>
            <option value="UG">UG</option>
            <option value="PG">PG</option>
            <option value="PHD">PhD</option>
          </select>
        </label>

        <label>
          Evaluation
          <select value={selectionStatus} onChange={handleSelectionChange}>
            <option value="">All statuses</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="WAITLISTED">Waitlisted</option>
          </select>
        </label>

        <label>
          Registration status
          <select value={registrationStatus} onChange={handleRegistrationChange}>
            <option value="">All payments</option>
            <option value="APPLIED">Applied (Unpaid)</option>
            <option value="REGISTERED">Registered (Paid)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      <div className="row" style={{ marginBottom: '16px' }}>
        <button onClick={handleResetFilters}>Reset filters</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seq No / Name</th>
              <th>Category</th>
              <th>College / Degree</th>
              <th>Paper Title</th>
              <th>Selection</th>
              <th>Registration</th>
              <th>Desk Token</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {participants.length > 0 ? (
              participants.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>{p.applicationSeqNo} • {p.email}</small>
                  </td>
                  <td>
                    <span className="badge">{p.academicCategory}</span>
                  </td>
                  <td>
                    {p.collegeName}
                    <small>{p.degree}</small>
                  </td>
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.paperTitle}
                  </td>
                  <td>
                    <span className={`badge ${p.selectionStatus}`}>{p.selectionStatus}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.registrationStatus}`}>{p.registrationStatus}</span>
                  </td>
                  <td>
                    <code>{p.deskToken || '—'}</code>
                  </td>
                  <td>
                    <button onClick={() => setSelectedParticipant(p)}>Open dossier →</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <h3>No matching participants</h3>
                    <p className="muted">Adjust your search query or filters to view registrations.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ marginTop: '16px' }}>
        <button
          disabled={pagination.page <= 1}
          onClick={() =>
            onFilterChange({
              search,
              category,
              selectionStatus,
              registrationStatus,
              page: pagination.page - 1,
            })
          }
        >
          ← Previous
        </button>
        <span className="muted">
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() =>
            onFilterChange({
              search,
              category,
              selectionStatus,
              registrationStatus,
              page: pagination.page + 1,
            })
          }
        >
          Next →
        </button>
      </div>

      {selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          onUpdateSuccess={() => {
            setSelectedParticipant(null);
            onRefresh();
          }}
        />
      )}
    </section>
  );
}
