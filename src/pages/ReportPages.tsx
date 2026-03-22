import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Profile } from '../types';
import toast from 'react-hot-toast';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';

// ─── Checklist Report ─────────────────────────────────────────────────────────
export const ChecklistPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from_date: '', to_date: '', profile_id: '', status: '' });

  useEffect(() => { api.get('/profiles').then(r => setProfiles(r.data)).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      if (filters.profile_id) params.profile_id = filters.profile_id;
      if (filters.status) params.status = filters.status;
      const r = await api.get('/reports/checklist', { params });
      setRows(r.data);
    } catch {
      toast.error('Failed to load checklist');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const f = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const totalPkgs = rows.reduce((s, r) => s + (Number(r.total_packages) || 0), 0);
  const totalWt = rows.reduce((s, r) => s + (Number(r.gross_weight) || 0), 0);

  return (
    <div className="page-container">
      <h1 className="page-title">Checklist Report</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={filters.from_date} onChange={e => f('from_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={filters.to_date} onChange={e => f('to_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Profile</label>
              <select className="form-control" value={filters.profile_id} onChange={e => f('profile_id', e.target.value)}>
                <option value="">All Profiles</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.profile_code} - {p.company_name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={filters.status} onChange={e => f('status', e.target.value)}>
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="transmitted">Transmitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setFilters({ from_date: '', to_date: '', profile_id: '', status: '' }); }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Results ({rows.length} MAWBs)</span>
          <span className="text-muted text-sm">
            Total Pkgs: <strong>{totalPkgs}</strong> &nbsp;|&nbsp; Total Weight: <strong>{totalWt.toFixed(2)} kg</strong>
          </span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>MAWB No.</th>
                <th>Date</th>
                <th>Profile</th>
                <th>Origin</th>
                <th>Dest</th>
                <th>Flight</th>
                <th>MAWB Pkgs</th>
                <th>MAWB Wt (kg)</th>
                <th>HAWBs</th>
                <th>HAWB Pkgs</th>
                <th>HAWB Wt (kg)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={13} className="text-center text-muted" style={{ padding: '40px 0' }}>No records found</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.mawb_no}</td>
                  <td className="text-sm">{r.mawb_date ? fmtDate(r.mawb_date) : '—'}</td>
                  <td className="text-sm">
                    <div style={{ fontWeight: 500 }}>{r.profile_code || '—'}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{r.company_name}</div>
                  </td>
                  <td className="font-mono">{r.origin}</td>
                  <td className="font-mono">{r.destination}</td>
                  <td className="font-mono text-sm">{r.flight_no || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{r.total_packages}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.gross_weight).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-info">{r.hawb_count || 0}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{r.hawb_total_packages || 0}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.hawb_total_weight || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      r.status === 'transmitted' ? 'badge-success' :
                      r.status === 'acknowledged' ? 'badge-info' :
                      r.status === 'error' ? 'badge-danger' : 'badge-gray'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Account Statement ────────────────────────────────────────────────────────
const ACC_LOCATIONS_STMT = [
  { code: 'INDEL4', label: 'ACC Delhi' }, { code: 'INBOM4', label: 'ACC SAHAR (Mumbai)' },
  { code: 'INMAA4', label: 'ACC Chennai' }, { code: 'INCCU4', label: 'ACC Kolkata' },
  { code: 'INBLR4', label: 'ACC Bangalore' }, { code: 'INAMD4', label: 'ACC Ahmedabad' },
  { code: 'INHYD4', label: 'ACC Hyderabad' }, { code: 'INTVJ4', label: 'ACC Trivandrum' },
  { code: 'INJPR4', label: 'ACC Jaipur' }, { code: 'INGOI4', label: 'ACC Goa' },
  { code: 'INATQ4', label: 'ACC Amritsar' }, { code: 'INCOK4', label: 'ACC Cochin' },
  { code: 'INCJB4', label: 'ACC Coimbatore' }, { code: 'INVTZ4', label: 'ACC Vishakhapatnam' },
];

const today = () => new Date().toISOString().slice(0, 10);

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    transmitted: '#22c55e', draft: '#94a3b8', error: '#ef4444', acknowledged: '#3b82f6',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] || '#94a3b8', display: 'inline-block' }} />
      {status}
    </span>
  );
};

export const AccountStatementPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['master_admin', 'admin']);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    user_id: '', location_code: '', from_date: today(), to_date: today(),
    sort_field: 'created_at', sort_dir: 'desc',
  });

  useEffect(() => {
    if (isAdmin) api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const buildParams = (extra: Record<string, any> = {}) => {
    const p: any = { sort_field: filters.sort_field, sort_dir: filters.sort_dir, ...extra };
    if (isAdmin && filters.user_id) p.user_id = filters.user_id;
    if (filters.location_code) p.location_code = filters.location_code;
    if (filters.from_date) p.from_date = filters.from_date;
    if (filters.to_date) p.to_date = filters.to_date;
    return p;
  };

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await api.get('/reports/account-statement', { params: buildParams({ page: p }) });
      setRows(r.data.data);
      setTotal(r.data.total);
      setPage(p);
    } catch { toast.error('Failed to load statement'); }
    finally { setLoading(false); }
  }, [filters]); // eslint-disable-line

  const f = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const totalHawb = rows.reduce((s, r) => s + Number(r.hawb_count || 0), 0);

  const handleDownload = async () => {
    setExporting(true);
    try {
      // Fetch ALL matching rows (no pagination) for export
      const r = await api.get('/reports/account-statement', { params: buildParams({ export: 'true' }) });
      const allRows: any[] = r.data;
      const header = ['Master AWB', 'Created', 'Transmission Date', 'Location', 'PAN No.', 'User', 'Status', 'House AWB'].join(',');
      const csvRows = allRows.map((row: any) => [
        row.mawb_no, fmtDateTime(row.created_at), fmtDateTime(row.transmission_date),
        row.customs_house_code || '', row.pan_number || '', row.username || '',
        row.status, row.hawb_count,
      ].join(','));
      const blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `account-statement-${today()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-container">
      <h1 className="page-title">Account Statement</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {isAdmin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">User</label>
                <select className="form-control" style={{ minWidth: 150 }} value={filters.user_id} onChange={e => f('user_id', e.target.value)}>
                  <option value="">All Users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Location</label>
              <select className="form-control" style={{ minWidth: 170 }} value={filters.location_code} onChange={e => f('location_code', e.target.value)}>
                <option value="">All Locations</option>
                {ACC_LOCATIONS_STMT.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sort By</label>
              <select className="form-control" value={filters.sort_field} onChange={e => f('sort_field', e.target.value)}>
                <option value="created_at">Created</option>
                <option value="transmission_date">Transmission Time</option>
                <option value="location">Location</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order</label>
              <select className="form-control" value={filters.sort_dir} onChange={e => f('sort_dir', e.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={filters.from_date} onChange={e => f('from_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={filters.to_date} onChange={e => f('to_date', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => load(1)} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            {rows.length > 0 && (
              <button className="btn btn-secondary" onClick={handleDownload} disabled={exporting}>
                {exporting ? 'Exporting...' : '↓ Download CSV'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">
            {total > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} records` : 'No records'}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => load(page - 1)}>‹ Prev</button>
              <span className="text-sm text-muted">Page {page} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => load(page + 1)}>Next ›</button>
            </div>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Master AWB</th>
                <th>Created</th>
                <th>Transmission Date</th>
                <th>Location</th>
                <th>PAN No.</th>
                {isAdmin && <th>User</th>}
                <th>Status</th>
                <th>House AWB</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center text-muted" style={{ padding: '40px 0' }}>No records found. Select filters and click Search.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.mawb_no}</td>
                  <td className="text-sm">{fmtDateTime(r.created_at)}</td>
                  <td className="text-sm">{r.transmission_date ? fmtDateTime(r.transmission_date) : '—'}</td>
                  <td className="font-mono text-sm">{r.customs_house_code || '—'}</td>
                  <td className="font-mono text-sm">{r.pan_number || '—'}</td>
                  {isAdmin && <td className="text-sm">{r.username || '—'}</td>}
                  <td className="text-sm"><StatusDot status={r.status} /></td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.hawb_count || 0}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr style={{ fontWeight: 700, background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td><strong>Total MAWBs: {total}</strong></td>
                  <td colSpan={isAdmin ? 5 : 4}></td>
                  <td><strong>Total HAWBs:</strong></td>
                  <td style={{ textAlign: 'center' }}><strong>{totalHawb}</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
