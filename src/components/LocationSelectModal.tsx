import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Location } from '../types';
import { useAuth } from '../hooks/useAuth';

export const LocationSelectModal: React.FC = () => {
  const { setSelectedLocation, user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/locations')
      .then(r => {
        const active = r.data.filter((l: Location) => l.is_active);
        setLocations(active);
        // Pre-select user's customs_house_code location if available
        if (user?.customs_house_code) {
          const found = active.find((l: Location) =>
            user.customs_house_code?.includes(l.iata_code)
          );
          if (found) setSelected(found.iata_code);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleConfirm = () => {
    const loc = locations.find(l => l.iata_code === selected);
    if (!loc) return;
    setSelectedLocation(loc);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">Select Working Location</span>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Please select your working customs location for this session. This is required every login.
          </p>
          {loading ? (
            <div className="loading-center"><span className="spinner"></span> Loading locations...</div>
          ) : (
            <div className="form-group">
              <label className="form-label">Customs Location <span className="required">*</span></label>
              <select
                className="form-control"
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                <option value="">— Select Location —</option>
                {locations.map(l => (
                  <option key={l.iata_code} value={l.iata_code}>
                    {l.iata_code} — {l.city_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selected}
            style={{ width: '100%' }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSelectModal;
