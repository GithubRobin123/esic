import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Mawb, CgmPreview, Transmission } from '../types';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';
import Pagination from '../components/Pagination';

const TransmissionPage: React.FC = () => {
  const [params] = useSearchParams();
  const defaultMawbId = params.get('mawb_id') || '';

  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [selectedMawbId, setSelectedMawbId] = useState(defaultMawbId);
  const [preview, setPreview] = useState<CgmPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Transmission[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(25);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // MAWB search
  const [mawbSearch, setMawbSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHistory = useCallback(async () => {
    api.get('/transmissions/history', { params: { page: histPage, pageSize: histPageSize } })
      .then(r => { setHistory(r.data.data ?? []); setHistTotal(r.data.total ?? 0); })
      .catch(() => {});
  }, [histPage, histPageSize]);

  useEffect(() => {
    api.get('/mawbs', { params: { pageSize: 1000, status: 'draft' } }).then(r => setMawbs(r.data.data ?? [])).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (defaultMawbId) handlePreview(defaultMawbId);
  }, []); // eslint-disable-line

  // Debounced MAWB search — fetches from API when user types
  const handleMawbSearchChange = (val: string) => {
    setMawbSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) {
      // Reload default 1000 — draft only
      api.get('/mawbs', { params: { pageSize: 1000, status: 'draft' } }).then(r => setMawbs(r.data.data ?? [])).catch(() => {});
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get('/mawbs', { params: { pageSize: 50, search: val.trim(), status: 'draft' } });
        setMawbs(res.data.data ?? []);
      } catch { /* ignore */ } finally { setSearchLoading(false); }
    }, 400);
  };

  const handlePreview = async (mawbId: string) => {
    if (!mawbId) { toast.error('Select a MAWB first'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/transmissions/preview-cgm/${mawbId}`);
      setPreview(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Preview failed');
    } finally { setLoading(false); }
  };

  const handleDownload = async () => {
    if (!selectedMawbId) { toast.error('Select a MAWB first'); return; }
    // Validate weight/package match
    const mawb = mawbs.find(m => m.id === selectedMawbId);
    if (mawb) {
      try {
        const hawbRes = await api.get('/hawbs', { params: { mawb_id: selectedMawbId, pageSize: 1000 } });
        const hawbs = hawbRes.data.data || [];
        if (hawbs.length > 0) {
          const totalPkg = hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0);
          const totalWt = hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0);
          const errors: string[] = [];
          if (Number(mawb.total_packages) !== totalPkg) errors.push(`Packages mismatch: MAWB ${mawb.total_packages} ≠ HAWBs total ${totalPkg}`);
          if (Math.abs(parseFloat(String(mawb.gross_weight)) - totalWt) > 0.01) errors.push(`Weight mismatch: MAWB ${parseFloat(String(mawb.gross_weight)).toFixed(2)} ≠ HAWBs total ${totalWt.toFixed(2)} KGS`);
          if (errors.length > 0) {
            toast.error(errors.join('\n'), { duration: 5000 });
            return;
          }
        }
      } catch { /* continue if validation fetch fails */ }
    }
    try {
      const res = await api.post(`/transmissions/generate-cgm/${selectedMawbId}`, {});
      const { fileName, fileContent } = res.data;
      const url = window.URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${fileName}`);
      setHistPage(1); // triggers fetchHistory via useEffect
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const selectedMawb = mawbs.find(m => m.id === selectedMawbId);

  return (
    <div className="page-container">
      <h1 className="page-title">Transmission</h1>

      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>Generate CGM File</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Transmission History</button>
      </div>

      {activeTab === 'generate' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Generate ICES 1.5 CGM File</span></div>
            <div className="card-body">
              <div className="alert alert-info">
                ℹ️ Select a MAWB to generate the ICES 1.5 compliant <strong>Consol General Manifest (CGM)</strong> file (CMCHI01) for submission to ICEGATE.
              </div>
              {/* MAWB Search */}
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Search MAWB by number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-control"
                    style={{ maxWidth: 280 }}
                    placeholder="Type MAWB number to search..."
                    value={mawbSearch}
                    onChange={e => handleMawbSearchChange(e.target.value)}
                  />
                  {searchLoading && <span className="spinner" style={{ width: 16, height: 16, alignSelf: 'center' }}></span>}
                </div>
              </div>
              <div className="form-row form-row-2" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select MAWB <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={selectedMawbId}
                    onChange={e => { setSelectedMawbId(e.target.value); setPreview(null); }}
                  >
                    <option value="">Choose a MAWB...</option>
                    {mawbs.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.mawb_no} ({m.hawb_count || 0} HAWBs)
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePreview(selectedMawbId)}
                    disabled={!selectedMawbId || loading}
                  >
                    {loading ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Loading...</> : '👁 Preview File'}
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleDownload}
                    disabled={!selectedMawbId}
                  >
                    ⬇ Download CGM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedMawb && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">MAWB Summary</span></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {[
                    ['MAWB No.', selectedMawb.mawb_no],
                    ['Route', `${selectedMawb.origin} → ${selectedMawb.destination}`],
                    ['Packages', String(selectedMawb.total_packages)],
                    ['Gross Weight', `${parseFloat(String(selectedMawb.gross_weight)).toFixed(2)} KGS`],
                    ['HAWBs', String(selectedMawb.hawb_count || 0)],
                    ['Status', selectedMawb.status],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontWeight: 600, fontFamily: k === 'MAWB No.' ? 'monospace' : 'inherit' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {preview && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">File Preview — <span className="font-mono" style={{ fontSize: 13 }}>{preview.file_name}</span></span>
                <span className="badge badge-info">{preview.hawb_count} HAWBs</span>
              </div>
              <div className="card-body">
                <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                  ⚠️ The file below uses ASCII 28 (field separator) and newline delimiters as per ICES 1.5 specification. Special characters may appear as boxes in the preview.
                </div>
                <div className="code-block">{preview.content}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Transmission History</span></div>
          <div className="table-wrapper">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <div className="empty-state-title">No transmissions yet</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>File Name</th>
                    <th>MAWB No.</th>
                    <th>Sent By</th>
                    <th>Sent At</th>
                    <th>Status</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(t => (
                    <tr key={t.id}>
                      <td><span className="badge badge-info">{t.transmission_type}</span></td>
                      <td className="font-mono text-sm">{t.file_name}</td>
                      <td className="font-mono">{t.mawb_no || '—'}</td>
                      <td>{t.username || '—'}</td>
                      <td className="text-muted text-sm">{fmtDateTime(t.sent_at)}</td>
                      <td>
                        <span className={`badge ${t.status === 'sent' || t.status === 'transmitted' ? 'badge-success' : t.status === 'error' ? 'badge-danger' : 'badge-gray'}`}>
                          {t.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={async () => {
                            try {
                              const res = await api.get(`/transmissions/download/${t.id}`, { responseType: 'blob' });
                              const url = window.URL.createObjectURL(new Blob([res.data]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = t.file_name;
                              link.click();
                              window.URL.revokeObjectURL(url);
                            } catch { toast.error('Download failed'); }
                          }}
                        >
                          ↓ {t.file_name}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination
            total={histTotal}
            page={histPage}
            pageSize={histPageSize}
            onPage={p => setHistPage(p)}
            onPageSize={ps => { setHistPageSize(ps); setHistPage(1); }}
          />
        </div>
      )}
    </div>
  );
};

export default TransmissionPage;
