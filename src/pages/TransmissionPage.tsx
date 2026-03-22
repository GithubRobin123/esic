import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Mawb, CgmPreview, Transmission } from '../types';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';

const TransmissionPage: React.FC = () => {
  const [params] = useSearchParams();
  const defaultMawbId = params.get('mawb_id') || '';

  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [selectedMawbId, setSelectedMawbId] = useState(defaultMawbId);
  const [preview, setPreview] = useState<CgmPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Transmission[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  useEffect(() => {
    api.get('/mawbs', { params: { pageSize: 1000 } }).then(r => setMawbs(r.data.data ?? [])).catch(() => {});
    api.get('/transmissions/history').then(r => setHistory(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (defaultMawbId) handlePreview(defaultMawbId);
  }, []); // eslint-disable-line

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
    try {
      const res = await api.post(`/transmissions/generate-cgm/${selectedMawbId}`, {}, {
        responseType: 'blob',
      });
      const contentDisposition = res.headers['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'manifest.cgm';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${fileName}`);
      // Refresh history
      api.get('/transmissions/history').then(r => setHistory(r.data)).catch(() => {});
    } catch (err: any) {
      toast.error('Download failed');
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
                        {m.mawb_no} — {m.origin}→{m.destination} ({m.hawb_count || 0} HAWBs)
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
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransmissionPage;
