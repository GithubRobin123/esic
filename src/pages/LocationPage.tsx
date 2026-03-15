import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Location } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LocationPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ iata_code: '', city_name: '', country: '' });
  const [saving, setSaving] = useState(false);
  const { hasRole } = useAuth();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch { toast.error('Failed to load locations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!form.iata_code || !form.city_name) { toast.error('IATA code and city name required'); return; }
    setSaving(true);
    try {
      await api.post('/locations', form);
      toast.success('Location added');
      setShowModal(false);
      setForm({ iata_code: '', city_name: '', country: '' });
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Remove location ${code}?`)) return;
    try {
      await api.delete(`/locations/${id}`);
      toast.success('Removed');
      fetch();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage IATA airport/port codes</p>
        </div>
        {hasRole(['master_admin', 'admin']) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Location</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>IATA Code</th>
                  <th>City / Airport</th>
                  <th>Country</th>
                  {hasRole(['master_admin', 'admin']) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {locations.map(l => (
                  <tr key={l.id}>
                    <td><span className="badge badge-info font-mono">{l.iata_code}</span></td>
                    <td style={{ fontWeight: 500 }}>{l.city_name}</td>
                    <td className="text-muted">{l.country || '—'}</td>
                    {hasRole(['master_admin', 'admin']) && (
                      <td>
                        <button className="btn-link danger" onClick={() => handleDelete(l.id, l.iata_code)}>Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Location</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">IATA Code <span className="required">*</span></label>
                <input className="form-control font-mono" value={form.iata_code} onChange={e => setForm(p => ({ ...p, iata_code: e.target.value.toUpperCase() }))} placeholder="e.g. DEL" maxLength={3} />
              </div>
              <div className="form-group">
                <label className="form-label">City / Airport Name <span className="required">*</span></label>
                <input className="form-control" value={form.city_name} onChange={e => setForm(p => ({ ...p, city_name: e.target.value }))} placeholder="e.g. Delhi (Indira Gandhi Intl)" />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-control" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. India" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage;
