import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Hawb, HawbForm, Mawb, Location } from '../types';
import toast from 'react-hot-toast';

const emptyForm: HawbForm = {
  mawb_id: '', hawb_no: '', hawb_date: '', origin: '', destination: '',
  shipment_type: 'T', total_packages: '', gross_weight: '',
  item_description: '', consignee_name: '', consignee_address: '',
  shipper_name: '', shipper_address: '', profile_id: '',
};

const HawbPage: React.FC = () => {
  const [params] = useSearchParams();
  const mawbIdFilter = params.get('mawb_id') || '';
  const mawbNoFilter = params.get('mawb_no') || '';
  const navigate = useNavigate();

  const [hawbs, setHawbs] = useState<Hawb[]>([]);
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<HawbForm>({ ...emptyForm, mawb_id: mawbIdFilter });
  const [saving, setSaving] = useState(false);
  const [selectedMawbId, setSelectedMawbId] = useState(mawbIdFilter);

  const fetchHawbs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hawbs', { params: selectedMawbId ? { mawb_id: selectedMawbId } : {} });
      setHawbs(res.data);
    } catch { toast.error('Failed to load HAWBs'); }
    finally { setLoading(false); }
  }, [selectedMawbId]);

  useEffect(() => { fetchHawbs(); }, [fetchHawbs]);
  useEffect(() => {
    api.get('/mawbs').then(r => setMawbs(r.data)).catch(() => {});
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, mawb_id: selectedMawbId });
    setShowModal(true);
  };

  const openEdit = (h: Hawb) => {
    setEditId(h.id);
    setForm({
      mawb_id: h.mawb_id, hawb_no: h.hawb_no,
      hawb_date: h.hawb_date?.slice(0,10) || '',
      origin: h.origin, destination: h.destination,
      shipment_type: h.shipment_type, total_packages: h.total_packages,
      gross_weight: h.gross_weight, item_description: h.item_description || '',
      consignee_name: h.consignee_name || '', consignee_address: h.consignee_address || '',
      shipper_name: h.shipper_name || '', shipper_address: h.shipper_address || '',
      profile_id: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.mawb_id || !form.hawb_no || !form.origin || !form.destination) {
      toast.error('MAWB, HAWB No, Origin, Destination required'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/hawbs/${editId}`, form);
        toast.success('HAWB updated');
      } else {
        await api.post('/hawbs', form);
        toast.success('HAWB created');
      }
      setShowModal(false);
      fetchHawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, hawbNo: string) => {
    if (!window.confirm(`Delete HAWB ${hawbNo}?`)) return;
    try {
      await api.delete(`/hawbs/${id}`);
      toast.success('HAWB deleted');
      fetchHawbs();
    } catch { toast.error('Delete failed'); }
  };

  const f = (v: keyof HawbForm, val: string) => setForm(p => ({ ...p, [v]: val }));

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <div className="flex-center gap-8">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/mawb')}>← MAWBs</button>
            <h1 className="page-title" style={{ margin: 0 }}>
              House Airway Bills (HAWB)
              {mawbNoFilter && <span style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 400 }}> — MAWB: {mawbNoFilter}</span>}
            </h1>
          </div>
        </div>
        <div className="flex-center gap-8">
          <select
            className="form-control"
            style={{ width: 240 }}
            value={selectedMawbId}
            onChange={e => setSelectedMawbId(e.target.value)}
          >
            <option value="">All MAWBs</option>
            {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no} ({m.origin}→{m.destination})</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add New HAWB</button>
        </div>
      </div>

      <div className="card">
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
                  <th>HAWB No.</th>
                  <th>MAWB No.</th>
                  <th>Origin</th>
                  <th>Dest</th>
                  <th>Type</th>
                  <th>Packages</th>
                  <th>Gross Wt (KGS)</th>
                  <th>Description</th>
                  <th>Consignee</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hawbs.map(h => (
                  <tr key={h.id}>
                    <td><span className="font-mono" style={{ fontWeight: 600 }}>{h.hawb_no}</span></td>
                    <td className="font-mono text-sm">{h.mawb_no}</td>
                    <td>{h.origin}</td>
                    <td>{h.destination}</td>
                    <td>{h.shipment_type === 'T' ? 'Total' : h.shipment_type === 'P' ? 'Part' : 'Split'}</td>
                    <td>{h.total_packages}</td>
                    <td>{parseFloat(String(h.gross_weight)).toFixed(2)}</td>
                    <td className="text-muted">{h.item_description || '—'}</td>
                    <td className="text-muted">{h.consignee_name || '—'}</td>
                    <td className="text-muted text-sm">{new Date(h.created_at).toLocaleString('en-IN')}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-link" onClick={() => openEdit(h)}>Edit</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link danger" onClick={() => handleDelete(h.id, h.hawb_no)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* HAWB Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit HAWB' : 'Add New HAWB'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>HAWB Details</p>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">MAWB <span className="required">*</span></label>
                  <select className="form-control" value={form.mawb_id} onChange={e => f('mawb_id', e.target.value)}>
                    <option value="">Select MAWB...</option>
                    {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no} ({m.origin}→{m.destination})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">HAWB No. <span className="required">*</span></label>
                  <input className="form-control font-mono" value={form.hawb_no} onChange={e => f('hawb_no', e.target.value)} placeholder="House AWB number" />
                </div>
              </div>
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">HAWB Date</label>
                  <input className="form-control" type="date" value={form.hawb_date} onChange={e => f('hawb_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Origin <span className="required">*</span></label>
                  <select className="form-control" value={form.origin} onChange={e => f('origin', e.target.value)}>
                    <option value="">Origin...</option>
                    {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination <span className="required">*</span></label>
                  <select className="form-control" value={form.destination} onChange={e => f('destination', e.target.value)}>
                    <option value="">Dest...</option>
                    {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shipment Type</label>
                  <select className="form-control" value={form.shipment_type} onChange={e => f('shipment_type', e.target.value)}>
                    <option value="T">T - Total</option>
                    <option value="P">P - Part Shipment</option>
                    <option value="S">S - Split</option>
                  </select>
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Total Packages</label>
                  <input className="form-control" type="number" value={form.total_packages} onChange={e => f('total_packages', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gross Weight (KGS)</label>
                  <input className="form-control" type="number" step="0.001" value={form.gross_weight} onChange={e => f('gross_weight', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Item Description</label>
                  <input className="form-control" value={form.item_description} onChange={e => f('item_description', e.target.value)} placeholder="AS PER INVOICE" maxLength={100} />
                </div>
              </div>
              <div className="divider" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Consignee & Shipper</p>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Consignee Name</label>
                  <input className="form-control" value={form.consignee_name} onChange={e => f('consignee_name', e.target.value)} placeholder="Consignee company/person" />
                </div>
                <div className="form-group">
                  <label className="form-label">Shipper Name</label>
                  <input className="form-control" value={form.shipper_name} onChange={e => f('shipper_name', e.target.value)} placeholder="Shipper company/person" />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Consignee Address</label>
                  <textarea className="form-control" value={form.consignee_address} onChange={e => f('consignee_address', e.target.value)} rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Shipper Address</label>
                  <textarea className="form-control" value={form.shipper_address} onChange={e => f('shipper_address', e.target.value)} rows={2} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : (editId ? 'Update HAWB' : 'Create HAWB')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HawbPage;
