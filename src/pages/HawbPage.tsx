import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Hawb, HawbForm, Mawb } from '../types';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';
import Pagination from '../components/Pagination';

interface HawbPageProps {
  initialMode?: string;
}

type HawbModalMode = 'add' | 'edit' | 'amend' | null;

const emptyForm: HawbForm = {
  mawb_id: '', hawb_no: '', origin: '', destination: '',
  total_packages: '', gross_weight: '', item_description: '',
};

const HawbPage: React.FC<HawbPageProps> = ({ initialMode }) => {
  const [params] = useSearchParams();
  const mawbIdFilter = params.get('mawb_id') || '';
  const mawbNoFilter = params.get('mawb_no') || '';
  const navigate = useNavigate();

  const [hawbs, setHawbs] = useState<Hawb[]>([]);
  const [total, setTotal] = useState(0);
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<HawbModalMode>(initialMode === 'add' ? 'add' : null);
  const [activeHawb, setActiveHawb] = useState<Hawb | null>(null);
  const [form, setForm] = useState<HawbForm>({ ...emptyForm, mawb_id: mawbIdFilter });
  const [saving, setSaving] = useState(false);
  const [selectedMawbId, setSelectedMawbId] = useState(mawbIdFilter);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<Hawb | null>(null);
  // For amend: available amended MAWBs
  const [amendedMawbs, setAmendedMawbs] = useState<Mawb[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchHawbs = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await api.get('/hawbs', {
        params: {
          page: p, pageSize: ps,
          ...(selectedMawbId ? { mawb_id: selectedMawbId } : {}),
          ...(search ? { search } : {}),
        }
      });
      setHawbs(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load HAWBs'); }
    finally { setLoading(false); }
  }, [selectedMawbId, search, page, pageSize]);

  useEffect(() => { fetchHawbs(page, pageSize); }, [fetchHawbs]); // eslint-disable-line
  useEffect(() => {
    api.get('/mawbs', { params: { pageSize: 1000 } }).then(r => setMawbs(r.data.data ?? [])).catch(() => {});
  }, []);

  // When MAWB changes in the add form, auto-fill origin/destination
  const handleMawbSelect = (mawbId: string) => {
    const mawb = mawbs.find(m => m.id === mawbId);
    setForm(p => ({
      ...p,
      mawb_id: mawbId,
      origin: mawb?.origin || p.origin,
      destination: mawb?.destination || p.destination,
    }));
  };

  const openAdd = () => {
    setActiveHawb(null);
    const mawb = mawbs.find(m => m.id === selectedMawbId);
    setForm({
      ...emptyForm,
      mawb_id: selectedMawbId,
      origin: mawb?.origin || '',
      destination: mawb?.destination || '',
    });
    setModalMode('add');
  };

  const openEdit = (h: Hawb) => {
    setActiveHawb(h);
    setForm({
      mawb_id: h.mawb_id,
      hawb_no: h.hawb_no,
      origin: h.origin,
      destination: h.destination,
      total_packages: h.total_packages,
      gross_weight: h.gross_weight,
      item_description: h.item_description || '',
    });
    setModalMode('edit');
  };

  const openAmend = async (h: Hawb) => {
    setActiveHawb(h);
    // Load MAWBs that are amendments/parts/deletes of the parent MAWB
    const allMawbs: Mawb[] = mawbs;
    const parentMawbNo = h.mawb_no?.replace(/-[APD]\d+$/, '') || '';
    const childMawbs = allMawbs.filter(m =>
      m.mawb_no !== h.mawb_no && (
        m.mawb_no.startsWith(parentMawbNo + '-A') ||
        m.mawb_no.startsWith(parentMawbNo + '-P') ||
        m.mawb_no.startsWith(parentMawbNo + '-D')
      )
    );
    setAmendedMawbs(childMawbs);
    // Default to first amended MAWB
    const firstAmended = childMawbs[0];
    setForm({
      mawb_id: firstAmended?.id || h.mawb_id,
      hawb_no: h.hawb_no,
      origin: h.origin,
      destination: h.destination,
      total_packages: h.total_packages,
      gross_weight: h.gross_weight,
      item_description: h.item_description || '',
    });
    setModalMode('amend');
  };

  const handleSave = async () => {
    if (!form.mawb_id || !form.hawb_no || !form.origin || !form.destination) {
      toast.error('MAWB, HAWB No, Origin, Destination required'); return;
    }
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await api.post('/hawbs', form);
        toast.success('HAWB created');
      } else if (modalMode === 'edit' && activeHawb) {
        await api.put(`/hawbs/${activeHawb.id}`, form);
        toast.success('HAWB updated');
      } else if (modalMode === 'amend' && activeHawb) {
        await api.post(`/hawbs/amend/${activeHawb.id}`, form);
        toast.success('HAWB amended');
      }
      setModalMode(null);
      fetchHawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setSaving(true);
    try {
      await api.delete(`/hawbs/${deleteDialog.id}`);
      toast.success('HAWB deleted');
      setDeleteDialog(null);
      fetchHawbs();
    } catch { toast.error('Delete failed'); }
    finally { setSaving(false); }
  };

  const loadChecklist = async () => {
    try {
      const res = await api.get('/hawbs/checklist/data');
      setChecklistData(res.data);
      setShowChecklist(true);
    } catch { toast.error('Failed to load checklist'); }
  };

  const printChecklist = () => window.print();

  const f = (k: keyof HawbForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const msgTypeBadge = (t?: string) => {
    const map: Record<string, string> = { F: 'badge-info', A: 'badge-warning', D: 'badge-danger' };
    return <span className={`badge ${map[t || 'F'] || 'badge-gray'}`}>{t || 'F'}</span>;
  };

  const modalTitle: Record<string, string> = {
    add: 'Add House AWB',
    edit: 'Edit House AWB',
    amend: 'Amend House AWB',
  };

  return (
    <div className="page-container">
      {/* Header links like reference image */}
      <div className="flex-between mb-16">
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
            <span
              style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/hawb/new')}
            >
              Add House AWB
            </span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span
              style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/hawb/add-multiple')}
            >
              Add Multiple Hawbs
            </span>
          </div>
          {mawbNoFilter && (
            <p className="text-muted text-sm">Viewing HAWBs for MAWB: <strong>{mawbNoFilter}</strong></p>
          )}
        </div>
        <div className="flex-center gap-8">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/mawb')}>← MAWBs</button>
          <button className="btn btn-secondary btn-sm" onClick={loadChecklist}>CheckList</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: 12 }}>
          {/* Search */}
          <div className="search-bar" style={{ margin: 0, flex: 1 }}>
            <span style={{ fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>Find by Hawb No. or Origin:</span>
            <input
              className="form-control"
              style={{ maxWidth: 220, margin: '0 8px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchHawbs(1, pageSize); } }}
              placeholder=""
            />
            <button className="btn btn-secondary btn-sm" onClick={() => { setPage(1); fetchHawbs(1, pageSize); }}>Search</button>
          </div>
          {/* MAWB filter */}
          <select
            className="form-control"
            style={{ width: 220 }}
            value={selectedMawbId}
            onChange={e => setSelectedMawbId(e.target.value)}
          >
            <option value="">All MAWBs</option>
            {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add House AWB</button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : hawbs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No HAWBs found</div>
              <p>{selectedMawbId ? 'No house airway bills for this MAWB.' : 'Select a MAWB or add a new HAWB.'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Hawb No</th>
                  <th>Port Of Origin</th>
                  <th>Port Of Destination</th>
                  <th>NO Of Package</th>
                  <th>Weight</th>
                  <th>Item Description</th>
                  <th>Shipment Type</th>
                  <th>Mawb No</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hawbs.map(h => (
                  <tr key={h.id}>
                    <td><span className="font-mono" style={{ fontWeight: 600 }}>{h.hawb_no}</span></td>
                    <td>{h.origin}</td>
                    <td>{h.destination}</td>
                    <td>{h.total_packages}</td>
                    <td>{parseFloat(String(h.gross_weight)).toFixed(2)}</td>
                    <td className="text-muted">{h.item_description || '—'}</td>
                    <td>{msgTypeBadge(h.message_type)}</td>
                    <td className="font-mono text-sm">{h.mawb_no}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-link" onClick={() => openEdit(h)}>Edit</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link" onClick={() => openAmend(h)}>Amend</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link danger" onClick={() => setDeleteDialog(h)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          total={total} page={page} pageSize={pageSize}
          onPage={p => { setPage(p); fetchHawbs(p, pageSize); }}
          onPageSize={ps => { setPageSize(ps); setPage(1); fetchHawbs(1, ps); }}
        />
      </div>

      {/* HAWB Modal (Add / Edit / Amend) */}
      {modalMode && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalMode(null); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{modalTitle[modalMode]}</span>
              <button className="modal-close" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Master AWB: <span className="required">*</span></label>
                  {modalMode === 'edit' ? (
                    // Edit: MAWB disabled
                    <select className="form-control" value={form.mawb_id} disabled style={{ background: '#f1f5f9' }}>
                      {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}
                    </select>
                  ) : modalMode === 'amend' ? (
                    // Amend: show amended MAWBs (children of parent)
                    <select className="form-control" value={form.mawb_id} onChange={e => f('mawb_id', e.target.value)}>
                      {amendedMawbs.length === 0 ? (
                        <option value={activeHawb?.mawb_id || ''}>No amended MAWBs found</option>
                      ) : (
                        amendedMawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)
                      )}
                    </select>
                  ) : (
                    // Add: all MAWBs
                    <select className="form-control" value={form.mawb_id} onChange={e => handleMawbSelect(e.target.value)}>
                      <option value="">Select MAWB...</option>
                      {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">House AWB: <span className="required">*</span></label>
                  <input
                    className="form-control font-mono"
                    value={form.hawb_no}
                    onChange={e => f('hawb_no', e.target.value)}
                    placeholder="House AWB number"
                    disabled={modalMode === 'amend'}
                    style={modalMode === 'amend' ? { background: '#f1f5f9' } : {}}
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Port Of Origin: <span className="required">*</span></label>
                  <input className="form-control" value={form.origin} onChange={e => f('origin', e.target.value)} placeholder="e.g. PVG" maxLength={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Port Of DEST: <span className="required">*</span></label>
                  <input className="form-control" value={form.destination} onChange={e => f('destination', e.target.value)} placeholder="e.g. BOM" maxLength={3} />
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Packages:</label>
                  <input className="form-control" type="number" value={form.total_packages} onChange={e => f('total_packages', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (KGS):</label>
                  <input className="form-control" type="number" step="0.001" value={form.gross_weight} onChange={e => f('gross_weight', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Item Description:</label>
                  <input className="form-control" value={form.item_description} onChange={e => f('item_description', e.target.value)} placeholder="AS PER INVOICE" maxLength={100} />
                </div>
              </div>
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

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="modal-close" onClick={() => setDeleteDialog(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete HAWB <strong>{deleteDialog.hawb_no}</strong>?</p>
              <p className="text-muted text-sm" style={{ marginTop: 8 }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteDialog(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#fff' }}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Dialog */}
      {showChecklist && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
          <div className="modal" style={{ maxWidth: 900, width: '95%' }}>
            <div className="modal-header">
              <span className="modal-title">Check List Details</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={printChecklist}>Print Page</button>
                <button className="modal-close" onClick={() => setShowChecklist(false)}>×</button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {checklistData.length === 0 ? (
                <div className="empty-state">No transmitted MAWBs found.</div>
              ) : checklistData.map((mawb: any) => (
                <div key={mawb.id} style={{ marginBottom: 24 }}>
                  {/* MAWB row */}
                  <table style={{ width: '100%', marginBottom: 0, borderBottom: 'none' }}>
                    <thead>
                      <tr>
                        <th>Master AWB</th>
                        <th>Port Of Origin</th>
                        <th>Port Of Dest</th>
                        <th>Packages</th>
                        <th>Weight</th>
                        <th>Item Desc</th>
                        <th>Message Type</th>
                        <th>Transmission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: '#f8fafc' }}>
                        <td><strong>{mawb.mawb_no}</strong></td>
                        <td>{mawb.origin}</td>
                        <td>{mawb.destination}</td>
                        <td>{mawb.total_packages}</td>
                        <td>{parseFloat(String(mawb.gross_weight)).toFixed(2)}</td>
                        <td>CONSOL</td>
                        <td>{mawb.message_type || 'F'}</td>
                        <td className="text-sm">{mawb.transmission_date ? fmtDateTime(mawb.transmission_date) : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {/* HAWB rows */}
                  {mawb.hawbs && mawb.hawbs.length > 0 && (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0' }}>
                          <th>House AWB</th>
                          <th>Port Of Origin</th>
                          <th>Port Of Dest</th>
                          <th>Packages</th>
                          <th>Weight</th>
                          <th>Item Desc</th>
                          <th>Message Type</th>
                          <th>Transmission Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mawb.hawbs.map((h: any) => (
                          <tr key={h.id}>
                            <td>{h.hawb_no}</td>
                            <td>{h.origin}</td>
                            <td>{h.destination}</td>
                            <td>{h.total_packages}</td>
                            <td>{parseFloat(String(h.gross_weight)).toFixed(2)}</td>
                            <td>{h.item_description || '—'}</td>
                            <td>{h.message_type || 'F'}</td>
                            <td className="text-sm">{mawb.transmission_date ? fmtDateTime(mawb.transmission_date) : '—'}</td>
                          </tr>
                        ))}
                        {/* Summary row */}
                        <tr style={{ fontWeight: 600, background: '#f1f5f9' }}>
                          <td>Hawb Count: {mawb.hawbs.length}</td>
                          <td colSpan={2}>Total:</td>
                          <td>{mawb.hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0)}</td>
                          <td>{mawb.hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0).toFixed(2)}</td>
                          <td colSpan={3}></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HawbPage;
