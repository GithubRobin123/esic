import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mawb, MawbForm, Profile, Location } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';
import Pagination from '../components/Pagination';

type ModalMode = 'add' | 'edit' | 'part' | 'amend' | 'delete-confirm' | null;

const emptyForm: MawbForm = {
  mawb_no: '', mawb_date: '', origin: '', destination: '',
  total_packages: '', gross_weight: '', customs_house_code: '', profile_id: '',
  flight_no: '', flight_origin_date: '', igm_no: '', igm_date: '',
};

const MawbPage: React.FC = () => {
  const { selectedLocation, user } = useAuth();
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeMawb, setActiveMawb] = useState<Mawb | null>(null);
  const [form, setForm] = useState<MawbForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const navigate = useNavigate();

  const fetchMawbs = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await api.get('/mawbs', { params: { page: p, pageSize: ps, ...(search ? { search } : {}) } });
      setMawbs(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load MAWBs'); }
    finally { setLoading(false); }
  }, [search, page, pageSize]);

  useEffect(() => { fetchMawbs(); }, [fetchMawbs]);
  useEffect(() => {
    api.get('/profiles').then(r => setProfiles(r.data)).catch(() => {});
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  // Keep destination in sync whenever selectedLocation changes (covers late selection)
  useEffect(() => {
    if (modalMode === 'add' && selectedLocation?.iata_code) {
      setForm(prev => ({ ...prev, destination: selectedLocation.iata_code }));
    }
  }, [selectedLocation, modalMode]);

  const openAdd = () => {
    setActiveMawb(null);
    setForm({
      ...emptyForm,
      destination: selectedLocation?.iata_code || '',
      customs_house_code: user?.customs_house_code || '',
      profile_id: user?.profile_id || '',
    });
    setModalMode('add');
  };

  const openEdit = (m: Mawb) => {
    setActiveMawb(m);
    setForm({
      mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0, 10) || '',
      origin: m.origin, destination: m.destination,
      total_packages: m.total_packages, gross_weight: m.gross_weight,
      customs_house_code: m.customs_house_code || '',
      profile_id: m.profile_id || '',
      flight_no: m.flight_no || '', flight_origin_date: m.flight_origin_date?.slice(0, 10) || '',
      igm_no: m.igm_no || '', igm_date: m.igm_date?.slice(0, 10) || '',
    });
    setModalMode('edit');
  };

  const openPart = (m: Mawb) => {
    setActiveMawb(m);
    setForm({
      mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0, 10) || '',
      origin: m.origin, destination: m.destination,
      total_packages: m.total_packages, gross_weight: m.gross_weight,
      customs_house_code: m.customs_house_code || '', profile_id: m.profile_id || '',
      flight_no: m.flight_no || '', flight_origin_date: m.flight_origin_date?.slice(0, 10) || '',
      igm_no: m.igm_no || '', igm_date: m.igm_date?.slice(0, 10) || '',
    });
    setModalMode('part');
  };

  const openAmend = (m: Mawb) => {
    setActiveMawb(m);
    setForm({
      mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0, 10) || '',
      origin: m.origin, destination: m.destination,
      total_packages: m.total_packages, gross_weight: m.gross_weight,
      customs_house_code: m.customs_house_code || '', profile_id: m.profile_id || '',
      flight_no: m.flight_no || '', flight_origin_date: m.flight_origin_date?.slice(0, 10) || '',
      igm_no: m.igm_no || '', igm_date: m.igm_date?.slice(0, 10) || '',
    });
    setModalMode('amend');
  };

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

  const handleSave = async () => {
    if (!form.mawb_no || !form.origin || !form.destination) {
      toast.error('MAWB No, Origin and Destination are required'); return;
    }
    if (modalMode === 'add' && form.mawb_no.length !== 11) {
      toast.error('MAWB number must be exactly 11 digits'); return;
    }
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await api.post('/mawbs', form);
        toast.success('MAWB created');
      } else if (modalMode === 'edit' && activeMawb) {
        await api.put(`/mawbs/${activeMawb.id}`, form);
        toast.success('MAWB updated');
      } else if (modalMode === 'part' && activeMawb) {
        const res = await api.post(`/mawbs/part/${activeMawb.id}`, form);
        toast.success(`Part MAWB created: ${res.data.mawb_no}`);
      } else if (modalMode === 'amend' && activeMawb) {
        const res = await api.post(`/mawbs/amend/${activeMawb.id}`, form);
        toast.success(`Amended MAWB created: ${res.data.mawb_no}`);
      }
      setModalMode(null);
      fetchMawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePermanentDelete = async () => {
    if (!activeMawb) return;
    setSaving(true);
    try {
      await api.delete(`/mawbs/${activeMawb.id}`);
      toast.success('MAWB permanently deleted');
      setModalMode(null);
      fetchMawbs();
    } catch { toast.error('Delete failed'); }
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
    try {
      const res = await api.post(`/transmissions/generate-cgm/${m.id}`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const disp = res.headers['content-disposition'] || '';
      const match = disp.match(/filename="?([^"]+)"?/);
      link.href = url;
      link.download = match ? match[1] : `${m.mawb_no}.cgm`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CGM file downloaded');
      fetchMawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const f = (k: keyof MawbForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const msgTypeBadge = (t?: string) => {
    const map: Record<string, string> = { F: 'badge-info', A: 'badge-warning', D: 'badge-danger' };
    const labels: Record<string, string> = { F: 'Fresh', A: 'Amend', D: 'Delete' };
    return <span className={`badge ${map[t || 'F'] || 'badge-gray'}`}>{labels[t || 'F'] || t}</span>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: 'badge-gray', transmitted: 'badge-info', acknowledged: 'badge-success', error: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const showFlightDetails = modalMode === 'edit' || modalMode === 'part' || modalMode === 'amend' || modalMode === 'delete-confirm';
  const mawbNoDisabled = modalMode === 'edit';

  const modalTitle: Record<string, string> = {
    add: 'Add New MAWB', edit: 'Edit MAWB',
    part: `Part MAWB — ${activeMawb?.mawb_no}`,
    amend: `Amend MAWB — ${activeMawb?.mawb_no}`,
    'delete-confirm': `Delete MAWB — ${activeMawb?.mawb_no}`,
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Master Airway Bills (MAWB)</h1>
          <p className="page-subtitle">Manage consol master airway bills for ICES 1.5 CGM transmission</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add New MAWB</button>
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
                          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => navigate(`/hawb?mawb_id=${m.id}&mawb_no=${m.mawb_no}`)}
                        >
                          {m.hawb_count || 0} HAWBs
                        </span>
                      </td>
                      <td>{statusBadge(m.status)}</td>
                      <td className="text-muted text-sm">{fmtDateTime(m.transmission_date)}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-link" onClick={() => openEdit(m)}>Edit</button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button className="btn-link" onClick={() => openPart(m)}>Part</button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button className="btn-link" onClick={() => openAmend(m)}>Amend</button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button className="btn-link danger" onClick={() => openDeleteConfirm(m)}>Delete</button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button className="btn-link" onClick={() => handleDownload(m)}>Download</button>
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

      {/* MAWB Modal (Add / Edit / Part / Amend) */}
      {modalMode && modalMode !== 'delete-confirm' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalMode(null); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{modalTitle[modalMode]}</span>
              <button className="modal-close" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>MAWB Details</p>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Master AWB No. <span className="required">*</span></label>
                  <input
                    className="form-control font-mono"
                    value={form.mawb_no}
                    onChange={e => {
                      const max = modalMode === 'add' ? 11 : 20;
                      if (e.target.value.length <= max) f('mawb_no', e.target.value);
                    }}
                    placeholder="e.g. 12345678901"
                    maxLength={modalMode === 'add' ? 11 : 20}
                    disabled={mawbNoDisabled}
                    style={mawbNoDisabled ? { background: '#f1f5f9' } : {}}
                  />
                  {modalMode === 'add' && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Max 11 digits ({form.mawb_no.length}/11)
                    </p>
                  )}
                  {(modalMode === 'part' || modalMode === 'amend') && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      New number will be: {form.mawb_no}-{modalMode === 'part' ? 'P' : 'A'}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">MAWB Date</label>
                  <input className="form-control" type="date" value={form.mawb_date} onChange={e => f('mawb_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Profile</label>
                  <select className="form-control" value={form.profile_id} onChange={e => f('profile_id', e.target.value)}>
                    <option value="">Select profile...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.profile_code} — {p.company_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Port Of Origin <span className="required">*</span></label>
                  {modalMode === 'add' ? (
                    <input
                      className="form-control font-mono"
                      value={form.origin}
                      onChange={e => f('origin', e.target.value.toUpperCase())}
                      placeholder="e.g. DXB"
                      maxLength={3}
                    />
                  ) : (
                    <select className="form-control" value={form.origin} onChange={e => f('origin', e.target.value)}>
                      <option value="">Select...</option>
                      {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code} — {l.city_name}</option>)}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Port Of Destination <span className="required">*</span></label>
                  {modalMode === 'add' ? (
                    <input
                      className="form-control font-mono"
                      value={form.destination}
                      disabled
                      style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                      title="Auto-filled from selected login location"
                    />
                  ) : (
                    <select className="form-control" value={form.destination} onChange={e => f('destination', e.target.value)}>
                      <option value="">Select...</option>
                      {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code} — {l.city_name}</option>)}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Item Description</label>
                  <input className="form-control" value="CONSOL" disabled style={{ background: '#f1f5f9', fontWeight: 600 }} />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Total Packages</label>
                  <input className="form-control" type="number" value={form.total_packages} onChange={e => f('total_packages', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gross Weight (KGS)</label>
                  <input className="form-control" type="number" step="0.001" value={form.gross_weight} onChange={e => f('gross_weight', e.target.value)} min={0} />
                </div>
              </div>

              {/* Flight details – only shown in edit/part/amend */}
              {showFlightDetails && (
                <>
                  <div className="divider" />
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Flight Details</p>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Flight No.</label>
                      <input className="form-control" value={form.flight_no} onChange={e => f('flight_no', e.target.value)} placeholder="e.g. AI123" maxLength={15} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Flight Date</label>
                      <input className="form-control" type="date" value={form.flight_origin_date} onChange={e => f('flight_origin_date', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">IGM No.</label>
                      <input className="form-control" value={form.igm_no} onChange={e => f('igm_no', e.target.value)} placeholder="Enter IGM No" maxLength={7} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">IGM Date</label>
                      <input className="form-control" type="date" value={form.igm_date} onChange={e => f('igm_date', e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {modalMode === 'delete-confirm' && activeMawb && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title">Delete MAWB — {activeMawb.mawb_no}</span>
              <button className="modal-close" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>Choose how to delete this MAWB:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Permanent Delete</div>
                  <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                    Completely removes this MAWB and all its HAWBs from the system. Cannot be undone.
                  </p>
                  <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={handlePermanentDelete} disabled={saving}>
                    Permanently Delete
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
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
    </div>
  );
};

export default MawbPage;
