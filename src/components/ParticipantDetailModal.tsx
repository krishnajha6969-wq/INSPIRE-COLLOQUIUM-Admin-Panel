'use client';

import { useState } from 'react';
import { Participant } from '@prisma/client';

interface ParticipantDetailModalProps {
  participant: Participant | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export function ParticipantDetailModal({ participant, onClose, onUpdateSuccess }: ParticipantDetailModalProps) {
  const [selectionStatus, setSelectionStatus] = useState<string>(participant?.selectionStatus || 'UNDER_REVIEW');
  const [registrationStatus, setRegistrationStatus] = useState<string>(participant?.registrationStatus || 'APPLIED');
  const [remarks, setRemarks] = useState<string>(participant?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!participant) return null;

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/participants/${participant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectionStatus,
          registrationStatus,
          remarks,
          expectedVersion: participant.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update participant');
      }

      setMessage('Decision updated successfully!');
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = async () => {
    setIsReminding(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/participants/${participant.id}/reminders`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reminder');
      }

      setMessage(data.message || 'Payment reminder sent successfully');
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send reminder');
    } finally {
      setIsReminding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <div>
            <span className="eyebrow">Participant dossier</span>
            <h2>{participant.name}</h2>
          </div>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={{ margin: '16px 0' }}>
          <span className={`badge ${participant.selectionStatus}`}>{participant.selectionStatus}</span>{' '}
          <span className={`badge ${participant.registrationStatus}`}>{participant.registrationStatus}</span>{' '}
          <span className="badge">{participant.academicCategory}</span>
        </div>

        <div className="member">
          <h3>Application Details</h3>
          <p><strong>Seq No:</strong> {participant.applicationSeqNo}</p>
          <p><strong>Desk Token:</strong> <code>{participant.deskToken || 'N/A'}</code></p>
          <p><strong>Email:</strong> {participant.email}</p>
          <p><strong>Phone:</strong> {participant.phone || 'Not provided'}</p>
          <p><strong>College:</strong> {participant.collegeName}</p>
          <p><strong>Degree:</strong> {participant.degree}</p>
        </div>

        <section className="section">
          <h3>Paper Abstract</h3>
          <p><strong>Title:</strong> {participant.paperTitle}</p>
          <div className="abstract">
            {participant.paperTitle}
          </div>
        </section>

        <section className="section">
          <h3>Payment & Desk Info</h3>
          <p><strong>Status:</strong> {participant.registrationStatus}</p>
          <p><strong>Amount Paid:</strong> ₹{participant.amountPaid}</p>
          <p><strong>Transaction ID:</strong> {participant.transactionId || 'None'}</p>
          <p><strong>Desk Checked In:</strong> {participant.isCheckInCompleted ? `Yes (${new Date(participant.checkInTime!).toLocaleString('en-IN')})` : 'No'}</p>
          <p><strong>Kit Issued:</strong> {participant.issuedKit ? 'Yes' : 'No'}</p>
        </section>

        <form onSubmit={handleSaveDecision} className="section">
          <h3>Review decision</h3>
          <p className="muted">Updates are recorded in the system audit trail with concurrency protection.</p>

          <label>
            Selection status
            <select value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value)}>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
              <option value="WAITLISTED">Waitlisted</option>
            </select>
          </label>

          <label>
            Registration status
            <select value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value)}>
              <option value="APPLIED">Applied</option>
              <option value="REGISTERED">Registered / Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>

          <label>
            Review notes & remarks
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter evaluation notes or remarks..."
            />
          </label>

          {error && <p className="error">{error}</p>}
          {message && <p className="banner" style={{ margin: '12px 0' }}>{message}</p>}

          <div className="row" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving decision…' : 'Save decision'}
            </button>
            {participant.selectionStatus === 'SELECTED' && participant.registrationStatus !== 'REGISTERED' && (
              <button type="button" onClick={handleSendReminder} disabled={isReminding}>
                {isReminding ? 'Sending email…' : '📧 Send payment reminder'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
