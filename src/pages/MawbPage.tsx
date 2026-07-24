import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mawb, MawbForm } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import { isSignerRunning, signCgmContent, downloadSignedCgm, SIGNER_SETUP_MSG } from '../utils/localSigner';
import { deliverFile } from '../utils/fileDownload';
import { ChecklistModal } from './ReportPages';

import DateInput from '../components/DateInput';
type ModalMode = 'delete-confirm' | null;

const emptyForm: MawbForm = {
  mawb_no: '', mawb_date: '', origin: '', destination: '',
  total_packages: '', gross_weight: '', customs_house_code: '', profile_id: '',
  flight_no: '', flight_origin_date: '', igm_no: '', igm_date: '',
};

const MawbPage: React.FC = () => {
  const { selectedLocation } = useAuth();
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeMawb, setActiveMawb] = useState<Mawb | null>(null);
  const [form, setForm] = useState<MawbForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showTransmitted, setShowTransmitted] = useState(false);
  const [checklistTarget, setChecklistTarget] = useState<{ id: string; mawb_no: string } | null>(null);
  const navigate = useNavigate();

  const fetchMawbs = useCallback(async (p = page, ps = pageSize, transmitted = showTransmitted) => {
    setLoading(true);
    try {
      const res = await api.get('/mawbs', { params: {
        page: p,
        pageSize: ps,
        ...(search ? { search } : {}),
        ...(selectedLocation?.customs_house_code ? { customs_house_code: selectedLocation.customs_house_code } : {}),
      } });
      setMawbs(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load MAWBs'); }
    finally { setLoading(false); }
  }, [search, page, pageSize, selectedLocation?.customs_house_code, showTransmitted]);

  useEffect(() => { fetchMawbs(); }, [fetchMawbs]);

  const f = (k: keyof MawbForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openDeleteConfirm = (m: Mawb) => {
    setActiveMawb(m);
    setForm({
      mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0, 10) || '',
      origin: m.origin, destination: m.destination,
      total_packages: m.total_packages, gross_weight: m.gross_weight,
      customs_house_code: m.customs_house_code || '', profile_id: m.profile_id || '',
      flight_no: m.flight_no || '', flight_origin_date: m.flight_origin_date?.slice(0, 10) || '',
      igm_no: m.igm_no || '', igm_date: m.igm_date?.slice(0, 10) || '',
    });
    setModalMode('delete-confirm');
  };

  const handlePermanentDelete = async () => {
    if (!activeMawb) return;
    if (activeMawb.status !== 'draft') {
      toast.error('Cannot permanently delete a transmitted MAWB. Use Delete & Copy instead.');
      return;
    }
    setSaving(true);
    try {
      await api.delete(`/mawbs/${activeMawb.id}`);
      toast.success('MAWB permanently deleted');
      setModalMode(null);
      fetchMawbs();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteCopy = async () => {
    if (!activeMawb) return;
    setSaving(true);
    try {
      const res = await api.post(`/mawbs/delete-copy/${activeMawb.id}`, form);
      toast.success(`Delete copy created: ${res.data.mawb_no}`);
      setModalMode(null);
      fetchMawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDownload = async (m: Mawb) => {
    const hawbRes = await api.get('/hawbs', { params: { mawb_id: m.id, pageSize: 1000 } });
    const hawbs = hawbRes.data.data || [];
    if (hawbs.length > 0) {
      const totalPkg = hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0);
      const totalWt = hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0);
      const errors: string[] = [];
      if (Number(m.total_packages) !== totalPkg) errors.push(`Packages mismatch: MAWB has ${m.total_packages} but HAWBs total ${totalPkg}`);
      if (Math.abs(parseFloat(String(m.gross_weight)) - totalWt) > 0.01) errors.push(`Weight mismatch: MAWB has ${parseFloat(String(m.gross_weight)).toFixed(2)} KGS but HAWBs total ${totalWt.toFixed(2)} KGS`);
      if (errors.length > 0) { toast.error(errors.join('\n'), { duration: 5000 }); return; }
    }
    try {
      const res = await api.post(`/transmissions/generate-cgm/${m.id}`, {});
      const { fileName, fileContent } = res.data;
      const result = await deliverFile(fileName, fileContent);
      if (result === 'downloaded') toast.success(`Downloaded: ${fileName}`);
      else if (result === 'shared') toast.success(`Ready to share: ${fileName}`);
      setShowTransmitted(true);
      fetchMawbs(page, pageSize, true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const handleDownloadSigned = async (m: Mawb) => {
    const hawbRes = await api.get('/hawbs', { params: { mawb_id: m.id, pageSize: 1000 } });
    const hawbs = hawbRes.data.data || [];
    if (hawbs.length > 0) {
      const totalPkg = hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0);
      const totalWt = hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0);
      const errors: string[] = [];
      if (Number(m.total_packages) !== totalPkg) errors.push(`Packages mismatch: MAWB has ${m.total_packages} but HAWBs total ${totalPkg}`);
      if (Math.abs(parseFloat(String(m.gross_weight)) - totalWt) > 0.01) errors.push(`Weight mismatch: MAWB has ${parseFloat(String(m.gross_weight)).toFixed(2)} KGS but HAWBs total ${totalWt.toFixed(2)} KGS`);
      if (errors.length > 0) { toast.error(errors.join('\n'), { duration: 5000 }); return; }
    }
    const running = await isSignerRunning();
    if (!running) { toast.error(SIGNER_SETUP_MSG, { duration: 8000 }); return; }
    setSigningId(m.id);
    try {
      let fileName: string;
      let fileContent: string;
      try {
        const existing = await api.get(`/transmissions/latest/${m.id}`);
        fileName = existing.data.fileName;
        fileContent = existing.data.fileContent;
      } catch {
        const fresh = await api.post(`/transmissions/generate-cgm/${m.id}`, {});
        fileName = fresh.data.fileName;
        fileContent = fresh.data.fileContent;
      }
      toast.loading('Waiting for USB token PIN...', { id: 'sign-toast' });
      const { signature, cert } = await signCgmContent(fileContent);
      toast.dismiss('sign-toast');
      const signedName = fileName.replace(/\.cgm$/i, 'Signed.cgm');
      const result = await downloadSignedCgm(fileContent, signature, cert, fileName);
      if (result === 'downloaded') toast.success(`Signed file downloaded: ${signedName}`);
      else if (result === 'shared') toast.success(`Signed file ready to share: ${signedName}`);
      setShowTransmitted(true);
      fetchMawbs(page, pageSize, true);
    } catch (err: any) {
      toast.dismiss('sign-toast');
      toast.error(err.message || err.response?.data?.message || 'Signing failed');
    } finally {
      setSigningId(null);
    }
  };

  const isFreshMawb = (mawbNo: string) => !/-[APD]\d/.test(mawbNo);

  const msgTypeBadge = (t?: string) => {
    const map: Record<string, string> = { F: 'badge-info', A: 'badge-warning', D: 'badge-danger' };
    const labels: Record<string, string> = { F: 'Fresh', A: 'Amend', D: 'Delete' };
    return <span className={`badge ${map[t || 'F'] || 'badge-gray'}`}>{labels[t || 'F'] || t}</span>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: 'badge-gray', transmitted: 'badge-info', acknowledged: 'badge-success', error: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Master Airway Bills (MAWB)</h1>
          <p className="page-subtitle">Manage consol master airway bills for ICES 1.5 CGM transmission</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/mawb/new')}>+ Add New MAWB</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ margin: 0, flex: 1 }}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="form-control search-input"
                placeholder="Search by MAWB No. or Origin..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchMawbs(1, pageSize); } }}
                style={{ margin: 0 }}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setPage(1); fetchMawbs(1, pageSize); }}>Search</button>
          </div>
          <button
            className={`btn btn-sm ${showTransmitted ? 'btn-warning' : 'btn-secondary'}`}
            onClick={() => { setShowTransmitted(v => { fetchMawbs(1, pageSize, !v); return !v; }); setPage(1); }}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showTransmitted ? 'Hide Transmitted' : 'Show Transmitted'}
          </button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : mawbs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No MAWBs found</div>
              <p>Click "Add New MAWB" to create your first master airway bill.</p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>MAWB No.</th>
                    <th>Type</th>
                    <th>Origin</th>
                    <th>Dest</th>
                    <th>Packages</th>
                    <th>Weight (KG)</th>
                    <th>HAWBs</th>
                    <th>Status</th>
                    <th>Transmitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mawbs.map(m => (
                    <tr key={m.id}>
                      <td><span className="font-mono" style={{ fontWeight: 600 }}>{m.mawb_no}</span></td>
                      <td>{msgTypeBadge(m.message_type)}</td>
                      <td>{m.origin}</td>
                      <td>{m.destination}</td>
                      <td>{m.total_packages}</td>
                      <td>{parseFloat(String(m.gross_weight)).toFixed(2)}</td>
                      <td>
                        <span
                          className="badge badge-info"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/hawb?mawb_id=${m.id}&mawb_no=${m.mawb_no}`)}
                        >
                          {m.hawb_count || 0} HAWBs
                        </span>
                      </td>
                      <td>{statusBadge(m.status)}</td>
                      <td className="text-muted text-sm">{fmtDateTime(m.transmission_date)}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-link" onClick={() => navigate(`/mawb/${m.id}/edit`)}>Edit</button>
                          {isFreshMawb(m.mawb_no) && (
                            <>
                              <span style={{ color: 'var(--border)' }}>|</span>
                              <button className="btn-link" onClick={() => navigate(`/mawb/${m.id}/part`)}>Part</button>
                              <span style={{ color: 'var(--border)' }}>|</span>
                              <button className="btn-link" onClick={() => navigate(`/mawb/${m.id}/amend`)}>Amend</button>
                            </>
                          )}
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button className="btn-link danger" onClick={() => openDeleteConfirm(m)}>Delete</button>
                          {m.status !== 'transmitted' && <span style={{ color: 'var(--border)' }}>|</span>}
                          {m.status !== 'transmitted' && (
                            <button className="btn-link" onClick={() => handleDownload(m)}>Download</button>
                          )}
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button
                            className="btn-link"
                            onClick={() => handleDownloadSigned(m)}
                            disabled={signingId === m.id}
                            title="Sign CGM via Local PKI Signer and download .p7 file"
                          >
                            {signingId === m.id
                              ? <><span className="spinner" style={{ width: 10, height: 10 }}></span> Signing...</>
                              : 'Sign'}
                          </button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button
                            className="btn-link"
                            onClick={() => setChecklistTarget({ id: m.id, mawb_no: m.mawb_no })}
                            title="View checklist details"
                            style={{ fontSize: 16 }}
                          >
                            👁
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                total={total} page={page} pageSize={pageSize}
                onPage={p => { setPage(p); fetchMawbs(p, pageSize); }}
                onPageSize={ps => { setPageSize(ps); setPage(1); fetchMawbs(1, ps); }}
              />
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {modalMode === 'delete-confirm' && activeMawb && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title">Delete MAWB — {activeMawb.mawb_no}</span>
              <button className="modal-close" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <div><span className="text-muted">MAWB No:</span> <strong className="font-mono">{activeMawb.mawb_no}</strong></div>
                  <div><span className="text-muted">Route:</span> <strong>{activeMawb.origin} → {activeMawb.destination}</strong></div>
                  <div><span className="text-muted">Packages:</span> <strong>{activeMawb.total_packages}</strong></div>
                  <div><span className="text-muted">Weight:</span> <strong>{parseFloat(String(activeMawb.gross_weight)).toFixed(2)} KGS</strong></div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Flight Details (for Delete Copy)
                </p>
                <div className="form-row form-row-2" style={{ marginBottom: 8 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Flight No.</label>
                    <input className="form-control" value={form.flight_no} onChange={e => f('flight_no', e.target.value.toUpperCase())} placeholder="e.g. AI123" maxLength={15} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Flight Date</label>
                    <DateInput className="form-control" value={form.flight_origin_date} onChange={e => f('flight_origin_date', e.target.value)} />
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IGM No.</label>
                    <input className="form-control" value={form.igm_no} onChange={e => f('igm_no', e.target.value.toUpperCase())} placeholder="Enter IGM No" maxLength={7} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IGM Date</label>
                    <DateInput className="form-control" value={form.igm_date} onChange={e => f('igm_date', e.target.value)} />
                  </div>
                </div>
              </div>

              <p style={{ marginBottom: 12, fontWeight: 500 }}>Choose how to delete this MAWB:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Permanent Delete</div>
                  <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                    {activeMawb.status === 'draft'
                      ? 'Completely removes this MAWB and all its HAWBs. Cannot be undone.'
                      : 'This MAWB has already been transmitted and can no longer be permanently deleted. Use Delete & Copy instead.'}
                  </p>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#ef4444', color: '#fff' }}
                    onClick={handlePermanentDelete}
                    disabled={saving || activeMawb.status !== 'draft'}
                    title={activeMawb.status !== 'draft' ? 'Transmitted MAWBs cannot be permanently deleted' : ''}
                  >
                    Permanently Delete
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>2. Delete &amp; Copy (message type D)</div>
                  <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                    Creates a new MAWB with suffix <strong>-D1</strong> and message type D for customs submission.
                    New number: <strong>{activeMawb.mawb_no.replace(/-[APD]\d+$/, '')}-D?</strong>
                  </p>
                  <button className="btn btn-sm btn-secondary" onClick={handleDeleteCopy} disabled={saving}>
                    Delete &amp; Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
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

export default MawbPage;
