import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { IgmFlight, IgmFlightForm, IgmMawb, IgmMawbForm, EgmFlight, EgmFlightForm, EgmMawb, EgmMawbForm, EgmHawb, Location } from '../types';
import toast from 'react-hot-toast';

type Tab = 'igm-flights' | 'igm-mawbs' | 'egm-flights' | 'egm-mawbs' | 'egm-hawbs' | 'transmit';

const SHIP = [{ v: 'T', l: 'T - Total' }, { v: 'P', l: 'P - Part' }, { v: 'S', l: 'S - Split' }];

const emptyIgmFlight: IgmFlightForm = {
  message_type: 'F', customs_house_code: '', flight_no: '', flight_origin_date: '',
  expected_arrival: '', port_of_origin: '', port_of_destination: '', registration_no: '',
  nil_cargo: 'N', igm_no: '', igm_date: '', profile_id: '',
};
const emptyIgmMawb: IgmMawbForm = {
  igm_flight_id: '', message_type: 'F', customs_house_code: '', flight_no: '',
  flight_origin_date: '', uld_number: '', mawb_no: '', mawb_date: '',
  port_of_origin: '', port_of_destination: '', shipment_type: 'T',
  total_packages: '', gross_weight: '', item_description: '', special_handling_code: '',
  igm_no: '', igm_date: '',
};
const emptyEgmFlight: EgmFlightForm = {
  message_type: 'F', customs_house_code: '', egm_no: '', egm_date: '', flight_no: '',
  flight_departure_date: '', port_of_origin: '', port_of_destination: '',
  registration_no: '', nil_cargo: 'N', profile_id: '',
};
const emptyEgmMawb: EgmMawbForm = {
  egm_flight_id: '', message_type: 'F', customs_house_code: '', mawb_no: '', mawb_date: '',
  port_of_loading: '', port_of_destination: '', shipment_type: 'T',
  total_packages: '', gross_weight: '', item_description: '',
};

const AirManifestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('igm-flights');
  const [locations, setLocations] = useState<Location[]>([]);

  // IGM Flights state
  const [igmFlights, setIgmFlights] = useState<IgmFlight[]>([]);
  const [igmFlightForm, setIgmFlightForm] = useState<IgmFlightForm>(emptyIgmFlight);
  const [editIgmFlightId, setEditIgmFlightId] = useState<string | null>(null);
  const [showIgmFlightModal, setShowIgmFlightModal] = useState(false);

  // IGM MAWBs state
  const [igmMawbs, setIgmMawbs] = useState<IgmMawb[]>([]);
  const [igmMawbForm, setIgmMawbForm] = useState<IgmMawbForm>(emptyIgmMawb);
  const [editIgmMawbId, setEditIgmMawbId] = useState<string | null>(null);
  const [showIgmMawbModal, setShowIgmMawbModal] = useState(false);
  const [selectedIgmFlightId, setSelectedIgmFlightId] = useState('');

  // EGM Flights state
  const [egmFlights, setEgmFlights] = useState<EgmFlight[]>([]);
  const [egmFlightForm, setEgmFlightForm] = useState<EgmFlightForm>(emptyEgmFlight);
  const [editEgmFlightId, setEditEgmFlightId] = useState<string | null>(null);
  const [showEgmFlightModal, setShowEgmFlightModal] = useState(false);

  // EGM MAWBs state
  const [egmMawbs, setEgmMawbs] = useState<EgmMawb[]>([]);
  const [egmMawbForm, setEgmMawbForm] = useState<EgmMawbForm>(emptyEgmMawb);
  const [editEgmMawbId, setEditEgmMawbId] = useState<string | null>(null);
  const [showEgmMawbModal, setShowEgmMawbModal] = useState(false);
  const [selectedEgmFlightId, setSelectedEgmFlightId] = useState('');

  // EGM HAWBs state
  const [egmHawbs, setEgmHawbs] = useState<EgmHawb[]>([]);
  const [egmHawbForm, setEgmHawbForm] = useState({
    egm_mawb_id: '', message_type: 'F', hawb_no: '', hawb_date: '',
    mawb_no: '', port_of_origin: '', port_of_destination: '',
    shipment_type: 'T', total_packages: '' as any, gross_weight: '' as any, item_description: '',
  });
  const [editEgmHawbId, setEditEgmHawbId] = useState<string | null>(null);
  const [showEgmHawbModal, setShowEgmHawbModal] = useState(false);
  const [selectedEgmMawbId, setSelectedEgmMawbId] = useState('');

  // Transmit state
  const [transmitType, setTransmitType] = useState<'IGM' | 'EGM'>('IGM');
  const [transmitFlightId, setTransmitFlightId] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [transmitLoading, setTransmitLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  // Fetch functions
  const fetchIgmFlights = useCallback(async () => {
    try { const r = await api.get('/igm/flights'); setIgmFlights(r.data); } catch { toast.error('Failed to load IGM flights'); }
  }, []);

  const fetchIgmMawbs = useCallback(async () => {
    try {
      const params = selectedIgmFlightId ? { igm_flight_id: selectedIgmFlightId } : {};
      const r = await api.get('/igm/mawbs', { params });
      setIgmMawbs(r.data);
    } catch { toast.error('Failed to load IGM MAWBs'); }
  }, [selectedIgmFlightId]);

  const fetchEgmFlights = useCallback(async () => {
    try { const r = await api.get('/egm/flights'); setEgmFlights(r.data); } catch { toast.error('Failed to load EGM flights'); }
  }, []);

  const fetchEgmMawbs = useCallback(async () => {
    try {
      const params = selectedEgmFlightId ? { egm_flight_id: selectedEgmFlightId } : {};
      const r = await api.get('/egm/mawbs', { params });
      setEgmMawbs(r.data);
    } catch { toast.error('Failed to load EGM MAWBs'); }
  }, [selectedEgmFlightId]);

  const fetchEgmHawbs = useCallback(async () => {
    try {
      const params = selectedEgmMawbId ? { egm_mawb_id: selectedEgmMawbId } : {};
      const r = await api.get('/egm/hawbs', { params });
      setEgmHawbs(r.data);
    } catch { toast.error('Failed to load EGM HAWBs'); }
  }, [selectedEgmMawbId]);

  useEffect(() => { fetchIgmFlights(); }, [fetchIgmFlights]);
  useEffect(() => { if (activeTab === 'igm-mawbs') fetchIgmMawbs(); }, [activeTab, fetchIgmMawbs]);
  useEffect(() => { if (activeTab === 'egm-flights') fetchEgmFlights(); }, [activeTab, fetchEgmFlights]);
  useEffect(() => { if (activeTab === 'egm-mawbs') fetchEgmMawbs(); }, [activeTab, fetchEgmMawbs]);
  useEffect(() => { if (activeTab === 'egm-hawbs') fetchEgmHawbs(); }, [activeTab, fetchEgmHawbs]);

  const locOpts = locations.map(l => (
    <option key={l.iata_code} value={l.iata_code}>{l.iata_code} - {l.city_name}</option>
  ));

  const fif = (k: keyof IgmFlightForm, v: string) => setIgmFlightForm(p => ({ ...p, [k]: v }));
  const fim = (k: keyof IgmMawbForm, v: string) => setIgmMawbForm(p => ({ ...p, [k]: v }));
  const fef = (k: keyof EgmFlightForm, v: string) => setEgmFlightForm(p => ({ ...p, [k]: v }));
  const fem = (k: keyof EgmMawbForm, v: string) => setEgmMawbForm(p => ({ ...p, [k]: v }));
  const feh = (k: string, v: string) => setEgmHawbForm(p => ({ ...p, [k]: v }));

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { draft: 'badge-gray', transmitted: 'badge-success', acknowledged: 'badge-info', error: 'badge-danger' };
    return <span className={`badge ${m[s] || 'badge-gray'}`}>{s}</span>;
  };

  // ─── IGM Flight CRUD ────────────────────────────────────────────────────────
  const saveIgmFlight = async () => {
    if (!igmFlightForm.flight_no || !igmFlightForm.flight_origin_date || !igmFlightForm.port_of_origin || !igmFlightForm.port_of_destination) {
      toast.error('Flight No, Origin Date, Origin, Destination required'); return;
    }
    setSaving(true);
    try {
      if (editIgmFlightId) {
        await api.put(`/igm/flights/${editIgmFlightId}`, igmFlightForm);
        toast.success('IGM Flight updated');
      } else {
        await api.post('/igm/flights', igmFlightForm);
        toast.success('IGM Flight created');
      }
      setShowIgmFlightModal(false); fetchIgmFlights();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteIgmFlight = async (id: string) => {
    if (!window.confirm('Delete this IGM flight and all its MAWBs?')) return;
    try { await api.delete(`/igm/flights/${id}`); toast.success('Deleted'); fetchIgmFlights(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── IGM MAWB CRUD ──────────────────────────────────────────────────────────
  const saveIgmMawb = async () => {
    if (!igmMawbForm.igm_flight_id || !igmMawbForm.mawb_no || !igmMawbForm.port_of_origin || !igmMawbForm.port_of_destination) {
      toast.error('Flight, MAWB No, Origin, Destination required'); return;
    }
    setSaving(true);
    try {
      if (editIgmMawbId) {
        await api.put(`/igm/mawbs/${editIgmMawbId}`, igmMawbForm);
        toast.success('IGM MAWB updated');
      } else {
        await api.post('/igm/mawbs', igmMawbForm);
        toast.success('IGM MAWB created');
      }
      setShowIgmMawbModal(false); fetchIgmMawbs();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteIgmMawb = async (id: string) => {
    if (!window.confirm('Delete this MAWB line?')) return;
    try { await api.delete(`/igm/mawbs/${id}`); toast.success('Deleted'); fetchIgmMawbs(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── EGM Flight CRUD ────────────────────────────────────────────────────────
  const saveEgmFlight = async () => {
    if (!egmFlightForm.flight_no || !egmFlightForm.flight_departure_date || !egmFlightForm.port_of_origin || !egmFlightForm.port_of_destination) {
      toast.error('Flight No, Departure Date, Origin, Destination required'); return;
    }
    setSaving(true);
    try {
      if (editEgmFlightId) {
        await api.put(`/egm/flights/${editEgmFlightId}`, egmFlightForm);
        toast.success('EGM Flight updated');
      } else {
        await api.post('/egm/flights', egmFlightForm);
        toast.success('EGM Flight created');
      }
      setShowEgmFlightModal(false); fetchEgmFlights();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteEgmFlight = async (id: string) => {
    if (!window.confirm('Delete this EGM flight and all its MAWBs/HAWBs?')) return;
    try { await api.delete(`/egm/flights/${id}`); toast.success('Deleted'); fetchEgmFlights(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── EGM MAWB CRUD ──────────────────────────────────────────────────────────
  const saveEgmMawb = async () => {
    if (!egmMawbForm.egm_flight_id || !egmMawbForm.mawb_no) {
      toast.error('EGM Flight and MAWB No required'); return;
    }
    setSaving(true);
    try {
      if (editEgmMawbId) {
        await api.put(`/egm/mawbs/${editEgmMawbId}`, egmMawbForm);
        toast.success('EGM MAWB updated');
      } else {
        await api.post('/egm/mawbs', egmMawbForm);
        toast.success('EGM MAWB created');
      }
      setShowEgmMawbModal(false); fetchEgmMawbs();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteEgmMawb = async (id: string) => {
    if (!window.confirm('Delete this MAWB line and all its HAWBs?')) return;
    try { await api.delete(`/egm/mawbs/${id}`); toast.success('Deleted'); fetchEgmMawbs(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── EGM HAWB CRUD ──────────────────────────────────────────────────────────
  const saveEgmHawb = async () => {
    if (!egmHawbForm.egm_mawb_id || !egmHawbForm.hawb_no) {
      toast.error('EGM MAWB and HAWB No required'); return;
    }
    setSaving(true);
    try {
      if (editEgmHawbId) {
        await api.put(`/egm/hawbs/${editEgmHawbId}`, egmHawbForm);
        toast.success('EGM HAWB updated');
      } else {
        await api.post('/egm/hawbs', egmHawbForm);
        toast.success('EGM HAWB created');
      }
      setShowEgmHawbModal(false); fetchEgmHawbs();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteEgmHawb = async (id: string) => {
    if (!window.confirm('Delete this HAWB line?')) return;
    try { await api.delete(`/egm/hawbs/${id}`); toast.success('Deleted'); fetchEgmHawbs(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── Transmit ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!transmitFlightId) { toast.error('Select a flight first'); return; }
    setTransmitLoading(true);
    try {
      const url = transmitType === 'IGM' ? `/igm/preview/${transmitFlightId}` : `/egm/preview/${transmitFlightId}`;
      const r = await api.get(url);
      setPreview(r.data);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Preview failed'); }
    finally { setTransmitLoading(false); }
  };

  const handleTransmit = async () => {
    if (!transmitFlightId) { toast.error('Select a flight first'); return; }
    try {
      const url = transmitType === 'IGM' ? `/igm/transmit/${transmitFlightId}` : `/egm/transmit/${transmitFlightId}`;
      const r = await api.post(url, {}, { responseType: 'blob' });
      const cd = r.headers['content-disposition'] || '';
      const match = cd.match(/filename="?(.+)"?/);
      const fileName = match ? match[1] : `manifest.${transmitType.toLowerCase()}`;
      const url2 = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url2; a.download = fileName; a.click();
      window.URL.revokeObjectURL(url2);
      toast.success(`Downloaded: ${fileName}`);
      setPreview(null);
    } catch { toast.error('Transmit failed'); }
  };

  const tabBtn = (t: Tab, label: string) => (
    <button className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
  );

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Air Manifest</h1>
          <p className="page-subtitle">Manage IGM (Import) and EGM (Export) General Manifests per ICES 1.5</p>
        </div>
      </div>

      <div className="tab-bar">
        {tabBtn('igm-flights', 'IGM Flights')}
        {tabBtn('igm-mawbs', 'IGM MAWBs')}
        {tabBtn('egm-flights', 'EGM Flights')}
        {tabBtn('egm-mawbs', 'EGM MAWBs')}
        {tabBtn('egm-hawbs', 'EGM HAWBs')}
        {tabBtn('transmit', 'Transmit Manifest')}
      </div>

      {/* ── IGM Flights ── */}
      {activeTab === 'igm-flights' && (
        <div>
          <div className="flex-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>IGM Flights (ALCHI01 Part I)</h2>
            <button className="btn btn-primary" onClick={() => { setEditIgmFlightId(null); setIgmFlightForm(emptyIgmFlight); setShowIgmFlightModal(true); }}>+ Add IGM Flight</button>
          </div>
          <div className="card">
            <div className="table-wrapper">
              {igmFlights.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">✈️</div><div className="empty-state-title">No IGM Flights</div><p>Add an IGM flight to get started.</p></div>
              ) : (
                <table>
                  <thead><tr><th>Flight No</th><th>Origin Date</th><th>Origin</th><th>Dest</th><th>Expected Arrival</th><th>IGM No</th><th>Nil Cargo</th><th>MAWBs</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {igmFlights.map(f => (
                      <tr key={f.id}>
                        <td className="font-mono">{f.flight_no}</td>
                        <td>{f.flight_origin_date?.slice(0,10)}</td>
                        <td>{f.port_of_origin}</td>
                        <td>{f.port_of_destination}</td>
                        <td className="text-muted text-sm">{f.expected_arrival ? new Date(f.expected_arrival).toLocaleString('en-IN') : '—'}</td>
                        <td>{f.igm_no || '—'}</td>
                        <td><span className={`badge ${f.nil_cargo === 'Y' ? 'badge-warning' : 'badge-gray'}`}>{f.nil_cargo}</span></td>
                        <td><span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setSelectedIgmFlightId(f.id); setActiveTab('igm-mawbs'); }}>{f.mawb_count || 0}</span></td>
                        <td>{statusBadge(f.status)}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-link" onClick={() => { setEditIgmFlightId(f.id); setIgmFlightForm({ message_type: f.message_type, customs_house_code: f.customs_house_code||'', flight_no: f.flight_no, flight_origin_date: f.flight_origin_date?.slice(0,10)||'', expected_arrival: f.expected_arrival?.slice(0,16)||'', port_of_origin: f.port_of_origin, port_of_destination: f.port_of_destination, registration_no: f.registration_no||'', nil_cargo: f.nil_cargo||'N', igm_no: f.igm_no||'', igm_date: f.igm_date?.slice(0,10)||'', profile_id: f.profile_id||'' }); setShowIgmFlightModal(true); }}>Edit</button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button className="btn-link danger" onClick={() => deleteIgmFlight(f.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IGM MAWBs ── */}
      {activeTab === 'igm-mawbs' && (
        <div>
          <div className="flex-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>IGM MAWB Lines (ALCHI01 Part II)</h2>
            <div className="flex-center gap-8">
              <select className="form-control" style={{ width: 280 }} value={selectedIgmFlightId} onChange={e => setSelectedIgmFlightId(e.target.value)}>
                <option value="">All Flights</option>
                {igmFlights.map(f => <option key={f.id} value={f.id}>{f.flight_no} ({f.port_of_origin}→{f.port_of_destination})</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { setEditIgmMawbId(null); setIgmMawbForm({ ...emptyIgmMawb, igm_flight_id: selectedIgmFlightId }); setShowIgmMawbModal(true); }}>+ Add MAWB Line</button>
            </div>
          </div>
          <div className="card">
            <div className="table-wrapper">
              {igmMawbs.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No MAWB Lines</div><p>Select a flight and add MAWB lines.</p></div>
              ) : (
                <table>
                  <thead><tr><th>MAWB No</th><th>ULD</th><th>Origin</th><th>Dest</th><th>Type</th><th>Pkgs</th><th>Weight (KGS)</th><th>Description</th><th>Spl. Code</th><th>Actions</th></tr></thead>
                  <tbody>
                    {igmMawbs.map(m => (
                      <tr key={m.id}>
                        <td className="font-mono">{m.mawb_no}</td>
                        <td className="text-muted">{m.uld_number || '—'}</td>
                        <td>{m.port_of_origin}</td>
                        <td>{m.port_of_destination}</td>
                        <td>{m.shipment_type}</td>
                        <td>{m.total_packages}</td>
                        <td>{parseFloat(String(m.gross_weight)).toFixed(3)}</td>
                        <td className="text-muted">{m.item_description || '—'}</td>
                        <td>{m.special_handling_code || '—'}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-link" onClick={() => { setEditIgmMawbId(m.id); setIgmMawbForm({ igm_flight_id: m.igm_flight_id, message_type: m.message_type, customs_house_code: m.customs_house_code||'', flight_no: m.flight_no||'', flight_origin_date: m.flight_origin_date?.slice(0,10)||'', uld_number: m.uld_number||'', mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0,10)||'', port_of_origin: m.port_of_origin, port_of_destination: m.port_of_destination, shipment_type: m.shipment_type, total_packages: m.total_packages, gross_weight: m.gross_weight, item_description: m.item_description||'', special_handling_code: m.special_handling_code||'', igm_no: m.igm_no||'', igm_date: m.igm_date?.slice(0,10)||'' }); setShowIgmMawbModal(true); }}>Edit</button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button className="btn-link danger" onClick={() => deleteIgmMawb(m.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EGM Flights ── */}
      {activeTab === 'egm-flights' && (
        <div>
          <div className="flex-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>EGM Flights (ALCHE01 Part I)</h2>
            <button className="btn btn-primary" onClick={() => { setEditEgmFlightId(null); setEgmFlightForm(emptyEgmFlight); setShowEgmFlightModal(true); }}>+ Add EGM Flight</button>
          </div>
          <div className="card">
            <div className="table-wrapper">
              {egmFlights.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">✈️</div><div className="empty-state-title">No EGM Flights</div><p>Add an EGM flight to get started.</p></div>
              ) : (
                <table>
                  <thead><tr><th>Flight No</th><th>Departure Date</th><th>Origin</th><th>Dest</th><th>EGM No</th><th>Nil Cargo</th><th>MAWBs</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {egmFlights.map(f => (
                      <tr key={f.id}>
                        <td className="font-mono">{f.flight_no}</td>
                        <td>{f.flight_departure_date?.slice(0,10)}</td>
                        <td>{f.port_of_origin}</td>
                        <td>{f.port_of_destination}</td>
                        <td>{f.egm_no || '—'}</td>
                        <td><span className={`badge ${f.nil_cargo === 'Y' ? 'badge-warning' : 'badge-gray'}`}>{f.nil_cargo}</span></td>
                        <td><span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setSelectedEgmFlightId(f.id); setActiveTab('egm-mawbs'); }}>{f.mawb_count || 0}</span></td>
                        <td>{statusBadge(f.status)}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-link" onClick={() => { setEditEgmFlightId(f.id); setEgmFlightForm({ message_type: f.message_type, customs_house_code: f.customs_house_code||'', egm_no: f.egm_no||'', egm_date: f.egm_date?.slice(0,10)||'', flight_no: f.flight_no, flight_departure_date: f.flight_departure_date?.slice(0,10)||'', port_of_origin: f.port_of_origin, port_of_destination: f.port_of_destination, registration_no: f.registration_no||'', nil_cargo: f.nil_cargo||'N', profile_id: f.profile_id||'' }); setShowEgmFlightModal(true); }}>Edit</button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button className="btn-link danger" onClick={() => deleteEgmFlight(f.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EGM MAWBs ── */}
      {activeTab === 'egm-mawbs' && (
        <div>
          <div className="flex-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>EGM MAWB Lines (ALCHE01 Part II)</h2>
            <div className="flex-center gap-8">
              <select className="form-control" style={{ width: 280 }} value={selectedEgmFlightId} onChange={e => setSelectedEgmFlightId(e.target.value)}>
                <option value="">All EGM Flights</option>
                {egmFlights.map(f => <option key={f.id} value={f.id}>{f.flight_no} ({f.port_of_origin}→{f.port_of_destination})</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { setEditEgmMawbId(null); setEgmMawbForm({ ...emptyEgmMawb, egm_flight_id: selectedEgmFlightId }); setShowEgmMawbModal(true); }}>+ Add MAWB Line</button>
            </div>
          </div>
          <div className="card">
            <div className="table-wrapper">
              {egmMawbs.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No EGM MAWB Lines</div></div>
              ) : (
                <table>
                  <thead><tr><th>MAWB No</th><th>Port Loading</th><th>Port Dest</th><th>Type</th><th>Pkgs</th><th>Weight (KGS)</th><th>Description</th><th>HAWBs</th><th>Actions</th></tr></thead>
                  <tbody>
                    {egmMawbs.map(m => (
                      <tr key={m.id}>
                        <td className="font-mono">{m.mawb_no}</td>
                        <td>{m.port_of_loading || '—'}</td>
                        <td>{m.port_of_destination || '—'}</td>
                        <td>{m.shipment_type}</td>
                        <td>{m.total_packages}</td>
                        <td>{parseFloat(String(m.gross_weight)).toFixed(3)}</td>
                        <td className="text-muted">{m.item_description || '—'}</td>
                        <td><span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setSelectedEgmMawbId(m.id); setActiveTab('egm-hawbs'); }}>{m.hawb_count || 0}</span></td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-link" onClick={() => { setEditEgmMawbId(m.id); setEgmMawbForm({ egm_flight_id: m.egm_flight_id, message_type: m.message_type, customs_house_code: m.customs_house_code||'', mawb_no: m.mawb_no, mawb_date: m.mawb_date?.slice(0,10)||'', port_of_loading: m.port_of_loading||'', port_of_destination: m.port_of_destination||'', shipment_type: m.shipment_type, total_packages: m.total_packages, gross_weight: m.gross_weight, item_description: m.item_description||'' }); setShowEgmMawbModal(true); }}>Edit</button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button className="btn-link danger" onClick={() => deleteEgmMawb(m.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EGM HAWBs ── */}
      {activeTab === 'egm-hawbs' && (
        <div>
          <div className="flex-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>EGM HAWB Lines (ALCHE01 Part III)</h2>
            <div className="flex-center gap-8">
              <select className="form-control" style={{ width: 280 }} value={selectedEgmMawbId} onChange={e => setSelectedEgmMawbId(e.target.value)}>
                <option value="">All EGM MAWBs</option>
                {egmMawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { setEditEgmHawbId(null); setEgmHawbForm({ egm_mawb_id: selectedEgmMawbId, message_type: 'F', hawb_no: '', hawb_date: '', mawb_no: '', port_of_origin: '', port_of_destination: '', shipment_type: 'T', total_packages: '', gross_weight: '', item_description: '' }); setShowEgmHawbModal(true); }}>+ Add HAWB Line</button>
            </div>
          </div>
          <div className="card">
            <div className="table-wrapper">
              {egmHawbs.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No EGM HAWB Lines</div></div>
              ) : (
                <table>
                  <thead><tr><th>HAWB No</th><th>MAWB No</th><th>Origin</th><th>Dest</th><th>Type</th><th>Pkgs</th><th>Weight (KGS)</th><th>Description</th><th>Actions</th></tr></thead>
                  <tbody>
                    {egmHawbs.map(h => (
                      <tr key={h.id}>
                        <td className="font-mono">{h.hawb_no}</td>
                        <td className="font-mono text-sm">{h.mawb_no || '—'}</td>
                        <td>{h.port_of_origin || '—'}</td>
                        <td>{h.port_of_destination || '—'}</td>
                        <td>{h.shipment_type}</td>
                        <td>{h.total_packages}</td>
                        <td>{parseFloat(String(h.gross_weight)).toFixed(3)}</td>
                        <td className="text-muted">{h.item_description || '—'}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-link" onClick={() => { setEditEgmHawbId(h.id); setEgmHawbForm({ egm_mawb_id: h.egm_mawb_id, message_type: h.message_type, hawb_no: h.hawb_no, hawb_date: h.hawb_date?.slice(0,10)||'', mawb_no: h.mawb_no||'', port_of_origin: h.port_of_origin||'', port_of_destination: h.port_of_destination||'', shipment_type: h.shipment_type, total_packages: h.total_packages, gross_weight: h.gross_weight, item_description: h.item_description||'' }); setShowEgmHawbModal(true); }}>Edit</button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button className="btn-link danger" onClick={() => deleteEgmHawb(h.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Transmit ── */}
      {activeTab === 'transmit' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Transmit Air Manifest</span></div>
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                ℹ️ Select manifest type (IGM/EGM) and a flight, then preview and download the ICES 1.5 compliant file.
              </div>
              <div className="form-row form-row-3" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Manifest Type</label>
                  <select className="form-control" value={transmitType} onChange={e => { setTransmitType(e.target.value as 'IGM' | 'EGM'); setTransmitFlightId(''); setPreview(null); }}>
                    <option value="IGM">IGM – Import General Manifest</option>
                    <option value="EGM">EGM – Export General Manifest</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Flight</label>
                  <select className="form-control" value={transmitFlightId} onChange={e => { setTransmitFlightId(e.target.value); setPreview(null); }}>
                    <option value="">Choose flight...</option>
                    {(transmitType === 'IGM' ? igmFlights : egmFlights).map((f: any) => (
                      <option key={f.id} value={f.id}>{f.flight_no} ({f.port_of_origin}→{f.port_of_destination}) — {f.status}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={handlePreview} disabled={!transmitFlightId || transmitLoading}>
                    {transmitLoading ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Loading...</> : '👁 Preview'}
                  </button>
                  <button className="btn btn-success" onClick={handleTransmit} disabled={!transmitFlightId}>⬇ Download & Transmit</button>
                </div>
              </div>
            </div>
          </div>
          {preview && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Preview — <span className="font-mono">{preview.file_name}</span></span>
                <span className="badge badge-info">{transmitType === 'IGM' ? `${preview.mawb_count} MAWBs` : `${preview.mawb_count} MAWBs / ${preview.hawb_count} HAWBs`}</span>
              </div>
              <div className="card-body">
                <div className="alert alert-warning" style={{ marginBottom: 12 }}>⚠️ File uses ICES 1.5 format with `/` delimiters.</div>
                <div className="code-block">{preview.content}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── IGM Flight Modal ─── */}
      {showIgmFlightModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowIgmFlightModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editIgmFlightId ? 'Edit IGM Flight' : 'Add IGM Flight'}</span>
              <button className="modal-close" onClick={() => setShowIgmFlightModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Flight No. <span className="required">*</span></label><input className="form-control font-mono" value={igmFlightForm.flight_no} onChange={e => fif('flight_no', e.target.value)} placeholder="e.g. AI123" /></div>
                <div className="form-group"><label className="form-label">Origin Date <span className="required">*</span></label><input className="form-control" type="date" value={igmFlightForm.flight_origin_date} onChange={e => fif('flight_origin_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Expected Arrival</label><input className="form-control" type="datetime-local" value={igmFlightForm.expected_arrival} onChange={e => fif('expected_arrival', e.target.value)} /></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Port of Origin <span className="required">*</span></label><select className="form-control" value={igmFlightForm.port_of_origin} onChange={e => fif('port_of_origin', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Port of Destination <span className="required">*</span></label><select className="form-control" value={igmFlightForm.port_of_destination} onChange={e => fif('port_of_destination', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Nil Cargo</label><select className="form-control" value={igmFlightForm.nil_cargo} onChange={e => fif('nil_cargo', e.target.value)}><option value="N">N – Has Cargo</option><option value="Y">Y – Nil Cargo</option></select></div>
              </div>
              <div className="form-row form-row-4">
                <div className="form-group"><label className="form-label">Customs House Code</label><input className="form-control font-mono" value={igmFlightForm.customs_house_code} onChange={e => fif('customs_house_code', e.target.value)} placeholder="INDEL4" maxLength={6} /></div>
                <div className="form-group"><label className="form-label">Registration No.</label><input className="form-control" value={igmFlightForm.registration_no} onChange={e => fif('registration_no', e.target.value)} maxLength={10} /></div>
                <div className="form-group"><label className="form-label">IGM No.</label><input className="form-control font-mono" value={igmFlightForm.igm_no} onChange={e => fif('igm_no', e.target.value)} maxLength={7} /></div>
                <div className="form-group"><label className="form-label">IGM Date</label><input className="form-control" type="date" value={igmFlightForm.igm_date} onChange={e => fif('igm_date', e.target.value)} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowIgmFlightModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveIgmFlight} disabled={saving}>{saving ? 'Saving...' : editIgmFlightId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IGM MAWB Modal ─── */}
      {showIgmMawbModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowIgmMawbModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editIgmMawbId ? 'Edit IGM MAWB' : 'Add IGM MAWB Line'}</span>
              <button className="modal-close" onClick={() => setShowIgmMawbModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2">
                <div className="form-group"><label className="form-label">IGM Flight <span className="required">*</span></label><select className="form-control" value={igmMawbForm.igm_flight_id} onChange={e => fim('igm_flight_id', e.target.value)}><option value="">Select flight...</option>{igmFlights.map(f => <option key={f.id} value={f.id}>{f.flight_no} ({f.port_of_origin}→{f.port_of_destination})</option>)}</select></div>
                <div className="form-group"><label className="form-label">MAWB No. <span className="required">*</span></label><input className="form-control font-mono" value={igmMawbForm.mawb_no} onChange={e => fim('mawb_no', e.target.value)} placeholder="e.g. 05766499823" /></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">MAWB Date</label><input className="form-control" type="date" value={igmMawbForm.mawb_date} onChange={e => fim('mawb_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Port of Origin <span className="required">*</span></label><select className="form-control" value={igmMawbForm.port_of_origin} onChange={e => fim('port_of_origin', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Port of Destination <span className="required">*</span></label><select className="form-control" value={igmMawbForm.port_of_destination} onChange={e => fim('port_of_destination', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
              </div>
              <div className="form-row form-row-4">
                <div className="form-group"><label className="form-label">Shipment Type</label><select className="form-control" value={igmMawbForm.shipment_type} onChange={e => fim('shipment_type', e.target.value)}>{SHIP.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Total Packages</label><input className="form-control" type="number" value={igmMawbForm.total_packages} onChange={e => fim('total_packages', e.target.value)} min={0} /></div>
                <div className="form-group"><label className="form-label">Gross Weight (KGS)</label><input className="form-control" type="number" step="0.001" value={igmMawbForm.gross_weight} onChange={e => fim('gross_weight', e.target.value)} min={0} /></div>
                <div className="form-group"><label className="form-label">ULD Number</label><input className="form-control" value={igmMawbForm.uld_number} onChange={e => fim('uld_number', e.target.value)} maxLength={15} /></div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label className="form-label">Item Description</label><input className="form-control" value={igmMawbForm.item_description} onChange={e => fim('item_description', e.target.value)} maxLength={30} /></div>
                <div className="form-group"><label className="form-label">Special Handling Code</label><input className="form-control" value={igmMawbForm.special_handling_code} onChange={e => fim('special_handling_code', e.target.value)} placeholder="e.g. PER EAT" maxLength={15} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowIgmMawbModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveIgmMawb} disabled={saving}>{saving ? 'Saving...' : editIgmMawbId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EGM Flight Modal ─── */}
      {showEgmFlightModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEgmFlightModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editEgmFlightId ? 'Edit EGM Flight' : 'Add EGM Flight'}</span>
              <button className="modal-close" onClick={() => setShowEgmFlightModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Flight No. <span className="required">*</span></label><input className="form-control font-mono" value={egmFlightForm.flight_no} onChange={e => fef('flight_no', e.target.value)} placeholder="e.g. AI456" /></div>
                <div className="form-group"><label className="form-label">Departure Date <span className="required">*</span></label><input className="form-control" type="date" value={egmFlightForm.flight_departure_date} onChange={e => fef('flight_departure_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Nil Cargo</label><select className="form-control" value={egmFlightForm.nil_cargo} onChange={e => fef('nil_cargo', e.target.value)}><option value="N">N – Has Cargo</option><option value="Y">Y – Nil Cargo</option></select></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Port of Origin <span className="required">*</span></label><select className="form-control" value={egmFlightForm.port_of_origin} onChange={e => fef('port_of_origin', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Port of Destination <span className="required">*</span></label><select className="form-control" value={egmFlightForm.port_of_destination} onChange={e => fef('port_of_destination', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Customs House Code</label><input className="form-control font-mono" value={egmFlightForm.customs_house_code} onChange={e => fef('customs_house_code', e.target.value)} maxLength={6} /></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">EGM No.</label><input className="form-control font-mono" value={egmFlightForm.egm_no} onChange={e => fef('egm_no', e.target.value)} maxLength={7} /></div>
                <div className="form-group"><label className="form-label">EGM Date</label><input className="form-control" type="date" value={egmFlightForm.egm_date} onChange={e => fef('egm_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Registration No.</label><input className="form-control" value={egmFlightForm.registration_no} onChange={e => fef('registration_no', e.target.value)} maxLength={10} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEgmFlightModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEgmFlight} disabled={saving}>{saving ? 'Saving...' : editEgmFlightId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EGM MAWB Modal ─── */}
      {showEgmMawbModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEgmMawbModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editEgmMawbId ? 'Edit EGM MAWB' : 'Add EGM MAWB Line'}</span>
              <button className="modal-close" onClick={() => setShowEgmMawbModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2">
                <div className="form-group"><label className="form-label">EGM Flight <span className="required">*</span></label><select className="form-control" value={egmMawbForm.egm_flight_id} onChange={e => fem('egm_flight_id', e.target.value)}><option value="">Select flight...</option>{egmFlights.map(f => <option key={f.id} value={f.id}>{f.flight_no} ({f.port_of_origin}→{f.port_of_destination})</option>)}</select></div>
                <div className="form-group"><label className="form-label">MAWB No. <span className="required">*</span></label><input className="form-control font-mono" value={egmMawbForm.mawb_no} onChange={e => fem('mawb_no', e.target.value)} /></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">MAWB Date</label><input className="form-control" type="date" value={egmMawbForm.mawb_date} onChange={e => fem('mawb_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Port of Loading</label><select className="form-control" value={egmMawbForm.port_of_loading} onChange={e => fem('port_of_loading', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Port of Destination</label><select className="form-control" value={egmMawbForm.port_of_destination} onChange={e => fem('port_of_destination', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Shipment Type</label><select className="form-control" value={egmMawbForm.shipment_type} onChange={e => fem('shipment_type', e.target.value)}>{SHIP.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Total Packages</label><input className="form-control" type="number" value={egmMawbForm.total_packages} onChange={e => fem('total_packages', e.target.value)} min={0} /></div>
                <div className="form-group"><label className="form-label">Gross Weight (KGS)</label><input className="form-control" type="number" step="0.001" value={egmMawbForm.gross_weight} onChange={e => fem('gross_weight', e.target.value)} min={0} /></div>
              </div>
              <div className="form-group"><label className="form-label">Item Description</label><input className="form-control" value={egmMawbForm.item_description} onChange={e => fem('item_description', e.target.value)} maxLength={60} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEgmMawbModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEgmMawb} disabled={saving}>{saving ? 'Saving...' : editEgmMawbId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EGM HAWB Modal ─── */}
      {showEgmHawbModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEgmHawbModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editEgmHawbId ? 'Edit EGM HAWB' : 'Add EGM HAWB Line'}</span>
              <button className="modal-close" onClick={() => setShowEgmHawbModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2">
                <div className="form-group"><label className="form-label">EGM MAWB <span className="required">*</span></label><select className="form-control" value={egmHawbForm.egm_mawb_id} onChange={e => feh('egm_mawb_id', e.target.value)}><option value="">Select MAWB...</option>{egmMawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}</select></div>
                <div className="form-group"><label className="form-label">HAWB No. <span className="required">*</span></label><input className="form-control font-mono" value={egmHawbForm.hawb_no} onChange={e => feh('hawb_no', e.target.value)} /></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">HAWB Date</label><input className="form-control" type="date" value={egmHawbForm.hawb_date} onChange={e => feh('hawb_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Port of Origin</label><select className="form-control" value={egmHawbForm.port_of_origin} onChange={e => feh('port_of_origin', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
                <div className="form-group"><label className="form-label">Port of Destination</label><select className="form-control" value={egmHawbForm.port_of_destination} onChange={e => feh('port_of_destination', e.target.value)}><option value="">Select...</option>{locOpts}</select></div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group"><label className="form-label">Shipment Type</label><select className="form-control" value={egmHawbForm.shipment_type} onChange={e => feh('shipment_type', e.target.value)}>{SHIP.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Total Packages</label><input className="form-control" type="number" value={egmHawbForm.total_packages} onChange={e => feh('total_packages', e.target.value)} min={0} /></div>
                <div className="form-group"><label className="form-label">Gross Weight (KGS)</label><input className="form-control" type="number" step="0.001" value={egmHawbForm.gross_weight} onChange={e => feh('gross_weight', e.target.value)} min={0} /></div>
              </div>
              <div className="form-group"><label className="form-label">Item Description</label><input className="form-control" value={egmHawbForm.item_description} onChange={e => feh('item_description', e.target.value)} maxLength={30} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEgmHawbModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEgmHawb} disabled={saving}>{saving ? 'Saving...' : editEgmHawbId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirManifestPage;
