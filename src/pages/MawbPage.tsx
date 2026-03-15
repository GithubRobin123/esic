import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mawb, MawbForm, Profile, Location } from '../types';
import toast from 'react-hot-toast';

const emptyForm: MawbForm = {
  mawb_no: '', mawb_date: '', airline_code: '', origin: '', destination: '',
  flight_no: '', flight_origin_date: '', igm_no: '', igm_date: '',
  shipment_type: 'T', total_packages: '', gross_weight: '',
  item_description: '', special_handling_code: '', uld_number: '',
  customs_house_code: '', profile_id: '',
};

const SHIPMENT_TYPES = [{ v: 'T', l: 'T - Total' }, { v: 'P', l: 'P - Part Shipment' }, { v: 'S', l: 'S - Split' }];

const MawbPage: React.FC = () => {
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MawbForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const navigate = useNavigate();

  const fetchMawbs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mawbs', { params: search ? { search } : {} });
      setMawbs(res.data);
    } catch { toast.error('Failed to load MAWBs'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    fetchMawbs();
  }, [fetchMawbs]);

  useEffect(() => {
    api.get('/profiles').then(r => setProfiles(r.data)).catch(() => {});
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m: Mawb) => {
    setEditId(m.id);
    setForm({
      mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0,10) || '',
      airline_code: m.airline_code || '', origin: m.origin, destination: m.destination,
      flight_no: m.flight_no || '', flight_origin_date: m.flight_origin_date?.slice(0,10) || '',
      igm_no: m.igm_no || '', igm_date: m.igm_date?.slice(0,10) || '',
      shipment_type: m.shipment_type, total_packages: m.total_packages,
      gross_weight: m.gross_weight, item_description: m.item_description || '',
      special_handling_code: m.special_handling_code || '', uld_number: m.uld_number || '',
      customs_house_code: m.customs_house_code || '', profile_id: m.profile_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.mawb_no || !form.origin || !form.destination) {
      toast.error('MAWB No, Origin and Destination are required'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/mawbs/${editId}`, form);
        toast.success('MAWB updated');
      } else {
        await api.post('/mawbs', form);
        toast.success('MAWB created');
      }
      setShowModal(false);
      fetchMawbs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, mawbNo: string) => {
    if (!window.confirm(`Delete MAWB ${mawbNo}? This will also delete all related HAWBs.`)) return;
    try {
      await api.delete(`/mawbs/${id}`);
      toast.success('MAWB deleted');
      fetchMawbs();
    } catch { toast.error('Delete failed'); }
  };

  const f = (v: keyof MawbForm, val: string) => setForm(p => ({ ...p, [v]: val }));

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: 'badge-gray', transmitted: 'badge-info', acknowledged: 'badge-success', error: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Master Airway Bills (MAWB)</h1>
          <p className="page-subtitle">Manage consol master airway bills for ICES 1.5 transmission</p>
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
                onKeyDown={e => e.key === 'Enter' && fetchMawbs()}
                style={{ margin: 0 }}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchMawbs}>Search</button>
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
            <table>
              <thead>
                <tr>
                  <th>MAWB No.</th>
                  <th>Origin</th>
                  <th>Dest</th>
                  <th>Packages</th>
                  <th>Gross Weight</th>
                  <th>HAWBs</th>
                  <th>Created</th>
                  <th>Transmitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mawbs.map(m => (
                  <tr key={m.id}>
                    <td><span className="font-mono" style={{ fontWeight: 600 }}>{m.mawb_no}</span></td>
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
                    <td className="text-muted text-sm">{new Date(m.created_at).toLocaleString('en-IN')}</td>
                    <td className="text-muted text-sm">
                      {m.transmission_date ? new Date(m.transmission_date).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>{statusBadge(m.status)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-link" onClick={() => openEdit(m)}>Edit</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link" onClick={() => navigate(`/hawb?mawb_id=${m.id}&mawb_no=${m.mawb_no}`)}>Part</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link" onClick={() => navigate(`/transmission/generate?mawb_id=${m.id}`)}>Amend</button>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <button className="btn-link danger" onClick={() => handleDelete(m.id, m.mawb_no)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MAWB Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit MAWB' : 'Add New MAWB'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Flight & MAWB Details */}
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>MAWB Details</p>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">MAWB No. <span className="required">*</span></label>
                  <input className="form-control font-mono" value={form.mawb_no} onChange={e => f('mawb_no', e.target.value)} placeholder="e.g. 75555765765" />
                </div>
                <div className="form-group">
                  <label className="form-label">MAWB Date</label>
                  <input className="form-control" type="date" value={form.mawb_date} onChange={e => f('mawb_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Airline Code</label>
                  <input className="form-control" value={form.airline_code} onChange={e => f('airline_code', e.target.value)} placeholder="e.g. AI" maxLength={3} />
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Origin <span className="required">*</span></label>
                  <select className="form-control" value={form.origin} onChange={e => f('origin', e.target.value)}>
                    <option value="">Select origin...</option>
                    {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code} - {l.city_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination <span className="required">*</span></label>
                  <select className="form-control" value={form.destination} onChange={e => f('destination', e.target.value)}>
                    <option value="">Select destination...</option>
                    {locations.map(l => <option key={l.iata_code} value={l.iata_code}>{l.iata_code} - {l.city_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shipment Type</label>
                  <select className="form-control" value={form.shipment_type} onChange={e => f('shipment_type', e.target.value)}>
                    {SHIPMENT_TYPES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Total Packages</label>
                  <input className="form-control" type="number" value={form.total_packages} onChange={e => f('total_packages', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gross Weight (KGS)</label>
                  <input className="form-control" type="number" step="0.001" value={form.gross_weight} onChange={e => f('gross_weight', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">ULD Number</label>
                  <input className="form-control" value={form.uld_number} onChange={e => f('uld_number', e.target.value)} placeholder="e.g. ULD XXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Handling Code</label>
                  <input className="form-control" value={form.special_handling_code} onChange={e => f('special_handling_code', e.target.value)} placeholder="e.g. PER" maxLength={15} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Item Description</label>
                <input className="form-control" value={form.item_description} onChange={e => f('item_description', e.target.value)} placeholder="e.g. CONSOL, GARMENTS, MACHINERY PARTS" maxLength={100} />
              </div>
              <div className="divider" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Flight Details</p>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Flight No.</label>
                  <input className="form-control" value={form.flight_no} onChange={e => f('flight_no', e.target.value)} placeholder="e.g. AI123" maxLength={15} />
                </div>
                <div className="form-group">
                  <label className="form-label">Flight Origin Date</label>
                  <input className="form-control" type="date" value={form.flight_origin_date} onChange={e => f('flight_origin_date', e.target.value)} />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">IGM No.</label>
                  <input className="form-control" value={form.igm_no} onChange={e => f('igm_no', e.target.value)} placeholder="7-digit IGM number" maxLength={7} />
                </div>
                <div className="form-group">
                  <label className="form-label">IGM Date</label>
                  <input className="form-control" type="date" value={form.igm_date} onChange={e => f('igm_date', e.target.value)} />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Customs House Code</label>
                  <input className="form-control" value={form.customs_house_code} onChange={e => f('customs_house_code', e.target.value)} placeholder="e.g. INDEL4" maxLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Profile</label>
                  <select className="form-control" value={form.profile_id} onChange={e => f('profile_id', e.target.value)}>
                    <option value="">Select profile...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.profile_code} - {p.company_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : (editId ? 'Update MAWB' : 'Create MAWB')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MawbPage;
