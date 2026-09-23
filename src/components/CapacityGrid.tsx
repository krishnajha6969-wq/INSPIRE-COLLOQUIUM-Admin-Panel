'use client';

import { CAPACITY } from '@/lib/constants';

interface CapacityGridProps {
  stats: {
    selectedUG: number;
    selectedPG: number;
    selectedPhD: number;
  };
}

export function CapacityGrid({ stats }: CapacityGridProps) {
  const categories = [
    { key: 'UG', label: 'UG teams', limit: CAPACITY.UG, count: stats.selectedUG },
    { key: 'PG', label: 'PG individuals', limit: CAPACITY.PG, count: stats.selectedPG },
    { key: 'PHD', label: 'PhD individuals', limit: CAPACITY.PHD, count: stats.selectedPhD },
  ];

  return (
    <div className="capacity">
      {categories.map((cat) => {
        const pct = Math.min(100, Math.round((cat.count / cat.limit) * 100));
        const remaining = Math.max(0, cat.limit - cat.count);

        return (
          <div key={cat.key} className="card">
            <div className="row">
              <h3>{cat.label}</h3>
              <span className="badge">{cat.count} / {cat.limit}</span>
            </div>
            <div className="number">{cat.count}</div>
            <div className="track">
              <span style={{ width: `${pct}%` }}></span>
            </div>
            <span className="muted">{remaining} places remaining</span>
          </div>
        );
      })}
    </div>
  );
}
