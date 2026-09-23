'use client';

interface StatsGridProps {
  total: number;
  today: number;
  pending: number;
  unpaid: number;
}

export function StatsGrid({ total, today, pending, unpaid }: StatsGridProps) {
  return (
    <div className="stats">
      <div className="card">
        <div className="eyebrow">All registrations</div>
        <div className="number">{total}</div>
        <span className="muted">UG teams + PG & PhD individuals</span>
      </div>

      <div className="card">
        <div className="eyebrow">Joined today</div>
        <div className="number">{today}</div>
        <span className="muted">Asia/Kolkata calendar day</span>
      </div>

      <div className="card">
        <div className="eyebrow">Pending evaluation</div>
        <div className="number">{pending}</div>
        <span className="muted">Submitted abstracts to review</span>
      </div>

      <div className="card">
        <div className="eyebrow">Awaiting payment</div>
        <div className="number">{unpaid}</div>
        <span className="muted">Selected, payment pending</span>
      </div>
    </div>
  );
}
