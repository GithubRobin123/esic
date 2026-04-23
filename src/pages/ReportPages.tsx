import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Pagination';

const thS: React.CSSProperties = { border: '1px solid #cbd5e1', padding: '5px 8px', background: '#e2e8f0', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' };
const tdS: React.CSSProperties = { border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: 11 };

// ─── Checklist modal (reusable) ───────────────────────────────────────────────
const ChecklistModal: React.FC<{
  mawbId: string; mawbNo: string; onClose: () => void;
}> = ({ mawbId, mawbNo, onClose }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hawbs/checklist/data', { params: { mawb_id: mawbId } })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load checklist'))
      .finally(() => setLoading(false));
  }, [mawbId]);

  const handlePrint = () => {
    const area = document.getElementById('cl-modal-print-area');
    if (!area) return;
    const win = window.open('', '_blank', 'width=1100,height=700');
    if (!win) return;
    win.document.write(`<html><head><title>Check List — ${mawbNo}</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;margin:12px}
      table{width:100%;border-collapse:collapse;margin-bottom:6px}
      th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;font-size:10px}
      th{background:#e2e8f0;font-weight:700}
      @media print{body{margin:0}}</style></head>
      <body>${area.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 24, overflowY: 'auto' }}>
      <div className="modal" style={{ maxWidth: 1100, width: '98%' }}>
        <div className="modal-header">
          <span className="modal-title">Check List — {mawbNo}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>Print</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? <div className="loading-center"><span className="spinner"></span> Loading...</div> : (
            <div id="cl-modal-print-area">
              {data.length === 0 ? (
                <div className="empty-state">No data found.</div>
              ) : data.map((mawb: any) => (
                <div key={mawb.id} style={{ marginBottom: 20 }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th style={thS}>Master AWB</th>
                        <th style={thS}>Origin</th>
                        <th style={thS}>Dest</th>
                        <th style={thS}>Packages</th>
                        <th style={thS}>Weight</th>
                        <th style={thS}>Item Desc</th>
                        <th style={thS}>Msg Type</th>
                        <th style={thS}>Transmission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: '#f0f9ff' }}>
                        <td style={tdS}><strong>{mawb.mawb_no}</strong></td>
                        <td style={tdS}>{mawb.origin}</td>
                        <td style={tdS}>{mawb.destination}</td>
                        <td style={tdS}>{mawb.total_packages}</td>
                        <td style={tdS}>{parseFloat(String(mawb.gross_weight)).toFixed(2)}</td>
                        <td style={tdS}>CONSOL</td>
                        <td style={tdS}>{mawb.message_type || 'F'}</td>
                        <td style={{ ...tdS, fontSize: 10 }}>{fmtDateTime(mawb.transmission_date)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {mawb.hawbs?.length > 0 && (
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={thS}>#</th>
                          <th style={thS}>House AWB</th>
                          <th style={thS}>Origin</th>
                          <th style={thS}>Dest</th>
                          <th style={thS}>Packages</th>
                          <th style={thS}>Weight</th>
                          <th style={thS}>Item Desc</th>
                          <th style={thS}>Msg Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mawb.hawbs.map((h: any, i: number) => (
                          <tr key={h.id}>
                            <td style={{ ...tdS, color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td style={tdS}>{h.hawb_no}</td>
                            <td style={tdS}>{h.origin}</td>
                            <td style={tdS}>{h.destination}</td>
                            <td style={tdS}>{h.total_packages}</td>
                            <td style={tdS}>{parseFloat(String(h.gross_weight)).toFixed(2)}</td>
                            <td style={tdS}>{h.item_description || '—'}</td>
                            <td style={tdS}>{h.message_type || 'F'}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 700, background: '#f1f5f9' }}>
                          <td style={tdS} colSpan={2}>Count: {mawb.hawbs.length}</td>
                          <td style={tdS} colSpan={2}>Total:</td>
                          <td style={tdS}>{mawb.hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0)}</td>
                          <td style={tdS}>{mawb.hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0).toFixed(2)}</td>
                          <td style={tdS} colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Checklist Report ─────────────────────────────────────────────────────────
export const ChecklistPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from_date: '', to_date: '', status: '' });
  const [checklistTarget, setChecklistTarget] = useState<{ id: string; mawb_no: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      if (filters.status) params.status = filters.status;
      const r = await api.get('/reports/checklist', { params });
      setRows(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch {
      toast.error('Failed to load checklist');
    } finally { setLoading(false); }
  }, [page, pageSize, filters]);

  useEffect(() => { load(); }, [load]);

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
              <label className="form-label">Status</label>
              <select className="form-control" value={filters.status} onChange={e => f('status', e.target.value)}>
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="transmitted">Transmitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => setPage(1)} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setFilters({ from_date: '', to_date: '', status: '' }); setPage(1); }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Results ({total} MAWBs)</span>
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
                <th>Origin</th>
                <th>Dest</th>
                <th>Flight</th>
                <th>MAWB Pkgs</th>
                <th>MAWB Wt (kg)</th>
                <th>HAWBs</th>
                <th>HAWB Pkgs</th>
                <th>HAWB Wt (kg)</th>
                <th>Status</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={13} className="text-center text-muted" style={{ padding: '40px 0' }}>No records found</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-muted text-sm">{(page - 1) * pageSize + i + 1}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.mawb_no}</td>
                  <td className="text-sm">{r.mawb_date ? fmtDate(r.mawb_date) : '—'}</td>
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
                  <td>
                    <button
                      className="btn-link"
                      title="View checklist details"
                      onClick={() => setChecklistTarget({ id: r.id, mawb_no: r.mawb_no })}
                      style={{ fontSize: 16 }}
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={p => setPage(p)}
          onPageSize={ps => { setPageSize(ps); setPage(1); }}
        />
      </div>

      {/* checklist modal */}
      {checklistTarget && (
        <ChecklistModal
          mawbId={checklistTarget.id}
          mawbNo={checklistTarget.mawb_no}
          onClose={() => setChecklistTarget(null)}
        />
      )}
    </div>
  );
};

// ─── Consol Statement (accessible to all users, admin sees all) ───────────────
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

export const ConsolStatementPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['master_admin', 'admin']);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    user_id: '', from_date: today(), to_date: today(),
  });

  useEffect(() => {
    if (isAdmin) api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const buildParams = (extra: Record<string, any> = {}) => {
    const p: any = { ...extra };
    if (isAdmin && filters.user_id) p.user_id = filters.user_id;
    if (filters.from_date) p.from_date = filters.from_date;
    if (filters.to_date) p.to_date = filters.to_date;
    return p;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/consol-statement', { params: buildParams({ page, pageSize }) });
      setRows(r.data.data);
      setTotal(r.data.total);
    } catch { toast.error('Failed to load statement'); }
    finally { setLoading(false); }
  }, [page, pageSize, filters]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const f = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const totalHawb = rows.reduce((s, r) => s + Number(r.hawb_count || 0), 0);

  const handleDownload = async () => {
    setExporting(true);
    try {
      const r = await api.get('/reports/consol-statement', { params: buildParams({ export: 'true' }) });
      const allRows: any[] = r.data;
      const header = ['Master AWB', 'Created', 'Transmission Date', 'Location', 'Origin', 'Dest',
        'PAN No.', 'Company', 'User', 'Status', 'House AWB', 'HAWB Pkgs', 'HAWB Wt'].join(',');
      const csvRows = allRows.map((row: any) => [
        row.mawb_no, fmtDateTime(row.created_at), fmtDateTime(row.transmission_date),
        row.customs_house_code || '', row.origin || '', row.destination || '',
        row.pan_number || '', `"${row.company_name || ''}"`, row.username || '',
        row.status, row.hawb_count, row.hawb_total_packages || 0, Number(row.hawb_total_weight || 0).toFixed(2),
      ].join(','));
      const blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `consol-statement-${today()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handlePrint = () => {
    const area = document.getElementById('consol-stmt-print');
    if (!area) return;
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(`<html><head><title>Consol Statement</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;margin:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:4px 6px;font-size:10px}
      th{background:#e2e8f0;font-weight:700}
      @media print{body{margin:0}}</style></head>
      <body><h3>Consol Statement (${filters.from_date} to ${filters.to_date})</h3>${area.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Statement by Consol</h1>

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
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={filters.from_date} onChange={e => f('from_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={filters.to_date} onChange={e => f('to_date', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => setPage(1)} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            {rows.length > 0 && (
              <>
                <button className="btn btn-secondary" onClick={handlePrint}>Print</button>
                <button className="btn btn-secondary" onClick={handleDownload} disabled={exporting}>
                  {exporting ? 'Exporting...' : '↓ CSV'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{total > 0 ? `${total} records` : 'No records'}</span>
        </div>
        <div className="table-wrapper">
          <div id="consol-stmt-print">
            <table>
              <thead>
                <tr>
                  <th>Master AWB</th>
                  <th>Created</th>
                  <th>Transmitted</th>
                  <th>Location</th>
                  <th>Origin</th>
                  <th>Dest</th>
                  <th>PAN No.</th>
                  {isAdmin && <th>User</th>}
                  <th>Status</th>
                  <th>HAWBs</th>
                  <th>HAWB Pkgs</th>
                  <th>HAWB Wt</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && (
                  <tr><td colSpan={isAdmin ? 12 : 11} className="text-center text-muted" style={{ padding: '40px 0' }}>No records found. Select filters and click Search.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{r.mawb_no}</td>
                    <td className="text-sm">{fmtDateTime(r.created_at)}</td>
                    <td className="text-sm">{r.transmission_date ? fmtDateTime(r.transmission_date) : '—'}</td>
                    <td className="font-mono text-sm">{r.customs_house_code || '—'}</td>
                    <td className="font-mono text-sm">{r.origin || '—'}</td>
                    <td className="font-mono text-sm">{r.destination || '—'}</td>
                    <td className="font-mono text-sm">{r.pan_number || '—'}</td>
                    {isAdmin && <td className="text-sm">{r.username || '—'}</td>}
                    <td className="text-sm"><StatusDot status={r.status} /></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.hawb_count || 0}</td>
                    <td style={{ textAlign: 'right' }}>{r.hawb_total_packages || 0}</td>
                    <td style={{ textAlign: 'right' }}>{Number(r.hawb_total_weight || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr style={{ fontWeight: 700, background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td><strong>Total MAWBs: {total}</strong></td>
                    <td colSpan={isAdmin ? 7 : 6}></td>
                    <td><strong>Total HAWBs:</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totalHawb}</strong></td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={p => setPage(p)}
          onPageSize={ps => { setPageSize(ps); setPage(1); }}
        />
      </div>
    </div>
  );
};

// Keep AccountStatementPage as legacy export (can be used internally)
export const AccountStatementPage = ConsolStatementPage;
