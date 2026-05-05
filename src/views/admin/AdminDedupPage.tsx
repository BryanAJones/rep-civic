import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import './AdminDedupPage.css';

type DedupRow = {
  id: string;
  name: string;
  normalized_name: string | null;
  district_code: string;
  office_title: string;
  party: string;
  status: string;
  sources: string[];
  filing_id: string | null;
  google_person_id: string | null;
  updated_at: string;
};

const adminEnabled = import.meta.env.VITE_ADMIN_ENABLED === 'true';

export function AdminDedupPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DedupRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminEnabled) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select(
          'id, name, normalized_name, district_code, office_title, party, status, sources, filing_id, google_person_id, updated_at',
        )
        .eq('needs_manual_dedup', true)
        .order('district_code', { ascending: true })
        .order('normalized_name', { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }
      setRows((data ?? []) as DedupRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!adminEnabled) {
    return <Navigate to="/" replace />;
  }

  const groups = groupByDistrict(rows ?? []);

  return (
    <div className="admin-dedup">
      <div className="admin-dedup__hero">
        <div className="admin-dedup__logo">
          Rep<span className="admin-dedup__period">.</span>
        </div>
        <div className="admin-dedup__tagline">Admin · manual dedup queue</div>
      </div>

      <div className="admin-dedup__body">
        <p className="admin-dedup__text">
          Candidates flagged <code>needs_manual_dedup = true</code>. Review each
          group and resolve via SQL — this surface is read-only.
        </p>

        {error && <p className="admin-dedup__error">Error: {error}</p>}

        {rows === null && !error && (
          <p className="admin-dedup__text">Loading…</p>
        )}

        {rows !== null && rows.length === 0 && (
          <p className="admin-dedup__text">Queue empty. Nothing to review.</p>
        )}

        {groups.map(([districtCode, items]) => (
          <section key={districtCode} className="admin-dedup__group">
            <h2 className="admin-dedup__group-heading">{districtCode}</h2>
            <table className="admin-dedup__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Normalized</th>
                  <th>Office</th>
                  <th>Party</th>
                  <th>Status</th>
                  <th>Sources</th>
                  <th>IDs</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td><code>{row.normalized_name ?? '—'}</code></td>
                    <td>{row.office_title}</td>
                    <td>{row.party}</td>
                    <td>{row.status}</td>
                    <td>{row.sources.join(', ') || '—'}</td>
                    <td>
                      <code>{row.filing_id ?? '—'}</code>
                      {row.google_person_id && (
                        <>
                          {' · '}
                          <code>{row.google_person_id}</code>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        <button
          type="button"
          className="admin-dedup__back"
          onClick={() => navigate('/')}
        >
          Back to Rep.
        </button>
      </div>
    </div>
  );
}

function groupByDistrict(rows: DedupRow[]): [string, DedupRow[]][] {
  const map = new Map<string, DedupRow[]>();
  for (const row of rows) {
    const list = map.get(row.district_code) ?? [];
    list.push(row);
    map.set(row.district_code, list);
  }
  return Array.from(map.entries());
}
