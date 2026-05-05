import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { service } from '../../services';
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

type ClaimRow = {
  candidate_id: string;
  user_id: string;
  verification_method: string | null;
  verified_at: string | null;
  claimed_at: string;
  candidates: { id: string; name: string; office_title: string; district_code: string } | null;
};

const adminEnabled = import.meta.env.VITE_ADMIN_ENABLED === 'true';

export function AdminDedupPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DedupRow[] | null>(null);
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminEnabled) return;
    let cancelled = false;
    (async () => {
      const [dedupRes, claimsRes] = await Promise.all([
        supabase
          .from('candidates')
          .select(
            'id, name, normalized_name, district_code, office_title, party, status, sources, filing_id, google_person_id, updated_at',
          )
          .eq('needs_manual_dedup', true)
          .order('district_code', { ascending: true })
          .order('normalized_name', { ascending: true }),
        supabase
          .from('candidate_claims')
          .select(
            'candidate_id, user_id, verification_method, verified_at, claimed_at, candidates(id, name, office_title, district_code)',
          )
          .order('claimed_at', { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;
      if (dedupRes.error) {
        setError(dedupRes.error.message);
      } else {
        setRows((dedupRes.data ?? []) as DedupRow[]);
      }
      if (claimsRes.error) {
        setError((prev) => prev ?? claimsRes.error.message);
      } else {
        setClaims((claimsRes.data ?? []) as unknown as ClaimRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!adminEnabled) {
    return <Navigate to="/" replace />;
  }

  const groups = groupByDistrict(rows ?? []);

  async function handleRevoke(candidateId: string, name: string) {
    const reason = window.prompt(
      `Revoke claim on ${name}? This deletes the claim, returns the profile to unclaimed, and writes claim.revoked to audit_log.\n\nReason (required):`,
    );
    if (!reason || !reason.trim()) return;
    setRevokingId(candidateId);
    try {
      await service.revokeCandidateClaim(candidateId, reason.trim());
      setClaims((prev) => (prev ?? []).filter((c) => c.candidate_id !== candidateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setRevokingId(null);
    }
  }

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

        <section className="admin-dedup__group">
          <h2 className="admin-dedup__group-heading">Recent claims · revoke</h2>
          <p className="admin-dedup__text">
            Sybil safety valve. Revoke flips the candidate back to unclaimed and
            writes <code>claim.revoked</code> to <code>audit_log</code>.
          </p>
          {claims === null && <p className="admin-dedup__text">Loading…</p>}
          {claims !== null && claims.length === 0 && (
            <p className="admin-dedup__text">No claims yet.</p>
          )}
          {claims !== null && claims.length > 0 && (
            <table className="admin-dedup__table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Office</th>
                  <th>District</th>
                  <th>User</th>
                  <th>Method</th>
                  <th>Claimed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.candidate_id}>
                    <td>{c.candidates?.name ?? '—'}</td>
                    <td>{c.candidates?.office_title ?? '—'}</td>
                    <td><code>{c.candidates?.district_code ?? '—'}</code></td>
                    <td><code>{c.user_id.slice(0, 8)}…</code></td>
                    <td><code>{c.verification_method ?? '—'}</code></td>
                    <td><code>{formatTimestamp(c.claimed_at)}</code></td>
                    <td>
                      <button
                        type="button"
                        className="admin-dedup__revoke"
                        onClick={() => handleRevoke(c.candidate_id, c.candidates?.name ?? 'this candidate')}
                        disabled={revokingId === c.candidate_id}
                      >
                        {revokingId === c.candidate_id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

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

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 16);
  } catch {
    return iso;
  }
}
