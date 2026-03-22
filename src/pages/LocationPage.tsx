import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Location } from '../types';
import toast from 'react-hot-toast';

// ACC Customs House locations
const ACC_LOCATIONS: Location[] = [
  { id: 'INDEL4', iata_code: 'DEL', city_name: 'ACC Delhi',          customs_house_code: 'INDEL4', is_active: true },
  { id: 'INBOM4', iata_code: 'BOM', city_name: 'ACC SAHAR (Mumbai)', customs_house_code: 'INBOM4', is_active: true },
  { id: 'INMAA4', iata_code: 'MAA', city_name: 'ACC Chennai',        customs_house_code: 'INMAA4', is_active: true },
  { id: 'INCCU4', iata_code: 'CCU', city_name: 'ACC Kolkata',        customs_house_code: 'INCCU4', is_active: true },
  { id: 'INBLR4', iata_code: 'BLR', city_name: 'ACC Bangalore',      customs_house_code: 'INBLR4', is_active: true },
  { id: 'INAMD4', iata_code: 'AMD', city_name: 'ACC Ahmedabad',      customs_house_code: 'INAMD4', is_active: true },
  { id: 'INHYD4', iata_code: 'HYD', city_name: 'ACC Hyderabad',      customs_house_code: 'INHYD4', is_active: true },
  { id: 'INTVJ4', iata_code: 'TRV', city_name: 'ACC Trivandrum',     customs_house_code: 'INTVJ4', is_active: true },
  { id: 'INJPR4', iata_code: 'JAI', city_name: 'ACC Jaipur',         customs_house_code: 'INJPR4', is_active: true },
  { id: 'INGOI4', iata_code: 'GOI', city_name: 'ACC Goa',            customs_house_code: 'INGOI4', is_active: true },
  { id: 'INATQ4', iata_code: 'ATQ', city_name: 'ACC Amritsar',       customs_house_code: 'INATQ4', is_active: true },
  { id: 'INCOK4', iata_code: 'COK', city_name: 'ACC Cochin',         customs_house_code: 'INCOK4', is_active: true },
  { id: 'INCJB4', iata_code: 'CJB', city_name: 'ACC Coimbatore',     customs_house_code: 'INCJB4', is_active: true },
  { id: 'INVTZ4', iata_code: 'VTZ', city_name: 'ACC Vishakhapatnam', customs_house_code: 'INVTZ4', is_active: true },
];

const LocationPage: React.FC = () => {
  const { user, hasRole, selectedLocation, setSelectedLocation } = useAuth();
  const navigate = useNavigate();

  // Session location picker
  const [sessionCode, setSessionCode] = useState(selectedLocation?.customs_house_code || '');

  // Admin: permanent assignment
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermCode, setSelectedPermCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = hasRole(['master_admin', 'admin']);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      api.get('/users')
        .then(r => setUsers(r.data))
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const handleConfirmSession = () => {
    const loc = ACC_LOCATIONS.find(l => l.customs_house_code === sessionCode);
    if (!loc) { toast.error('Please select a location'); return; }
    setSelectedLocation(loc);
    toast.success(`Location set to ${loc.city_name} (${loc.customs_house_code})`);
    navigate('/mawb');
  };

  const handleUserChange = (uid: string) => {
    setSelectedUserId(uid);
    const u = users.find(x => x.id === uid);
    setSelectedPermCode(u?.customs_house_code || '');
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) { toast.error('Please select a user'); return; }
    if (!selectedPermCode) { toast.error('Please select a location'); return; }
    setSaving(true);
    try {
      await api.put(`/users/${selectedUserId}/location`, { customs_house_code: selectedPermCode });
      const loc = ACC_LOCATIONS.find(l => l.customs_house_code === selectedPermCode);
      toast.success(`Permanent location set to ${loc?.city_name || selectedPermCode}`);
      api.get('/users').then(r => setUsers(r.data));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update location');
    } finally { setSaving(false); }
  };

  const selectedSessionLoc = ACC_LOCATIONS.find(l => l.customs_house_code === sessionCode);

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Select Working Location</h1>
          <p className="page-subtitle">Choose your customs house location for this session</p>
        </div>
        {selectedLocation && (
          <button className="btn btn-secondary" onClick={() => navigate('/mawb')}>
            ← Back to MAWB
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '420px 1fr' : '420px', gap: 20, alignItems: 'start' }}>

        {/* Session location picker */}
        <div className="card">
          <div className="card-header"><span className="card-title">Select Session Location</span></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              This location will be used for all MAWB entries in this session. You can change it at any time from this page.
            </p>

            <div className="form-group">
              <label className="form-label">Customs Location <span className="required">*</span></label>
              <select
                className="form-control"
                value={sessionCode}
                onChange={e => setSessionCode(e.target.value)}
              >
                <option value="">— Select Location —</option>
                {ACC_LOCATIONS.map(loc => (
                  <option key={loc.customs_house_code} value={loc.customs_house_code}>
                    {loc.iata_code} — {loc.city_name} ({loc.customs_house_code})
                  </option>
                ))}
              </select>
            </div>

            {selectedSessionLoc && (
              <div style={{ background: 'var(--bg-light, #f0f9ff)', border: '1px solid var(--primary-light, #bae6fd)', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
                <div className="text-sm text-muted">Selected Location:</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedSessionLoc.iata_code} — {selectedSessionLoc.customs_house_code}
                </div>
                <div className="text-sm">{selectedSessionLoc.city_name}</div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleConfirmSession}
              disabled={!sessionCode}
            >
              Confirm Location &amp; Continue
            </button>
          </div>
        </div>

        {/* Admin: permanent assignment */}
        {isAdmin && (
          <div className="card">
            <div className="card-header"><span className="card-title">Assign Permanent Location to User</span></div>
            <div className="card-body" style={{ paddingBottom: 0 }}>
              <form onSubmit={handlePermSubmit}>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">User <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={selectedUserId}
                      onChange={e => handleUserChange(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">— Select User —</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} {u.customs_house_code ? `(${u.customs_house_code})` : '— No location'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={selectedPermCode}
                      onChange={e => setSelectedPermCode(e.target.value)}
                    >
                      <option value="">— Select Location —</option>
                      {ACC_LOCATIONS.map(loc => (
                        <option key={loc.customs_house_code} value={loc.customs_house_code}>
                          {loc.iata_code} — {loc.city_name} ({loc.customs_house_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginBottom: 16 }}
                  disabled={saving || !selectedUserId || !selectedPermCode}
                >
                  {saving ? 'Updating...' : 'Assign Location'}
                </button>
              </form>
            </div>

            <div className="table-wrapper" style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Assigned Location</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const loc = ACC_LOCATIONS.find(l => l.customs_house_code === u.customs_house_code);
                    return (
                      <tr key={u.id}>
                        <td className="font-mono">{u.username}</td>
                        <td>{u.full_name}</td>
                        <td>
                          <span className={`badge ${u.role === 'master_admin' ? 'badge-danger' : u.role === 'admin' ? 'badge-warning' : 'badge-gray'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.customs_house_code ? (
                            <span className="badge badge-info font-mono">
                              {loc ? `${loc.iata_code} — ${u.customs_house_code}` : u.customs_house_code}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPage;
