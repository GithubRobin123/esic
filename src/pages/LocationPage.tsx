import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Location } from '../types';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LocationPage: React.FC = () => {
  const { selectedLocation, setSelectedLocation } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [sessionCode, setSessionCode] = useState(selectedLocation?.customs_house_code || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/locations')
      .then(r => {
        // Only show Indian customs locations (customs_house_code starts with 'IN')
        const active = (r.data as Location[]).filter(l => l.is_active && l.customs_house_code?.startsWith('IN'));
        setLocations(active);
        // Pre-select current session location if still in the list
        if (selectedLocation) {
          const still = active.find(l => l.customs_house_code === selectedLocation.customs_house_code);
          if (still) setSessionCode(still.customs_house_code ?? '');
        }
      })
      .catch(() => toast.error('Failed to load locations'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleConfirmSession = () => {
    const loc = locations.find(l => l.customs_house_code === sessionCode);
    if (!loc) { toast.error('Please select a location'); return; }
    setSelectedLocation(loc);
    toast.success(`Location set to ${loc.city_name} (${loc.customs_house_code})`);
    navigate('/mawb');
  };

  const selectedSessionLoc = locations.find(l => l.customs_house_code === sessionCode);

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

      <div style={{ maxWidth: 420 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Select Session Location</span></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              This location will be used for all MAWB entries in this session. You can change it at any time from this page.
            </p>

            {loading ? (
              <div className="loading-center"><span className="spinner"></span> Loading locations...</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Customs Location <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={sessionCode}
                    onChange={e => setSessionCode(e.target.value)}
                  >
                    <option value="">— Select Location —</option>
                    {locations.map(loc => (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
