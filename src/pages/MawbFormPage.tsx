import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { MawbForm } from '../types';
import { useAuth } from '../hooks/useAuth';
import { sanitizeDecimal } from '../utils/numberUtils';
import toast from 'react-hot-toast';

type FormMode = 'add' | 'edit' | 'part' | 'amend';

interface InlineHawbRow {
  hawb_no: string;
  total_packages: string;
  gross_weight: string;
  item_description: string;
}

interface ExistingHawbRow {
  id: string;
  hawb_no: string;
  origin: string;
  destination: string;
  total_packages: string;
  gross_weight: string;
  item_description: string;
}

const emptyHawbRow = (): InlineHawbRow => ({
  hawb_no: '',
  total_packages: '',
  gross_weight: '',
  item_description: '',
});

const emptyForm: MawbForm = {
  mawb_no: '', mawb_date: '', origin: '', destination: '',
  total_packages: '', gross_weight: '', customs_house_code: '', profile_id: '',
  flight_no: '', flight_origin_date: '', igm_no: '', igm_date: '',
};

const deriveChc = (dest: string) =>
  dest.length >= 3 ? `IN${dest.substring(0, 3).toUpperCase()}4` : '';

const MawbFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedLocation, user } = useAuth();

  const mode: FormMode = location.pathname.endsWith('/edit') ? 'edit'
    : location.pathname.endsWith('/amend') ? 'amend'
    : location.pathname.endsWith('/part') ? 'part'
    : 'add';

  const [form, setForm] = useState<MawbForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode !== 'add');
  const [validationWarn, setValidationWarn] = useState('');
  const [inlineHawbs, setInlineHawbs] = useState<InlineHawbRow[]>([emptyHawbRow()]);
  const [hawbCount, setHawbCount] = useState(1);
  const [activeMawbNo, setActiveMawbNo] = useState('');
  const [existingHawbs, setExistingHawbs] = useState<ExistingHawbRow[]>([]);

  const isAdd = mode === 'add';
  const showFlightDetails = mode === 'edit' || mode === 'part' || mode === 'amend';
  // Part is treated like a fresh MAWB — new HAWBs can be added inline
  const showNewHawbSection = isAdd || mode === 'part';

  // Load existing MAWB for edit/part/amend
  const fetchMawb = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/mawbs/${id}`);
      const m = res.data;
      setActiveMawbNo(m.mawb_no);
      setForm({
        mawb_no: m.mawb_no,
        mawb_date: m.mawb_date?.slice(0, 10) || '',
        origin: m.origin,
        destination: m.destination,
        total_packages: m.total_packages,
        gross_weight: m.gross_weight,
        customs_house_code: m.customs_house_code || '',
        profile_id: m.profile_id || '',
        flight_no: m.flight_no || '',
        flight_origin_date: m.flight_origin_date?.slice(0, 10) || '',
        igm_no: m.igm_no || '',
        igm_date: m.igm_date?.slice(0, 10) || '',
      });

      // Amend: load the parent's existing HAWBs so they can be carried into the amendment (editable, but numbers fixed)
      if (location.pathname.endsWith('/amend')) {
        const hres = await api.get('/hawbs', { params: { mawb_id: id, pageSize: 1000 } });
        const rows: ExistingHawbRow[] = (hres.data.data || []).map((h: any) => ({
          id: h.id,
          hawb_no: h.hawb_no,
          origin: h.origin,
          destination: h.destination,
          total_packages: String(h.total_packages),
          gross_weight: String(h.gross_weight),
          item_description: h.item_description || '',
        }));
        setExistingHawbs(rows);
      }
    } catch {
      toast.error('Failed to load MAWB');
      navigate('/mawb');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, location.pathname]);

  useEffect(() => {
    if (mode !== 'add') {
      fetchMawb();
    } else {
      const dest = selectedLocation?.iata_code || '';
      setForm({
        ...emptyForm,
        destination: dest,
        customs_house_code: deriveChc(dest) || selectedLocation?.customs_house_code || user?.customs_house_code || '',
        profile_id: user?.profile_id || '',
      });
    }
  }, [mode, fetchMawb, selectedLocation, user]); // eslint-disable-line

  // Keep destination synced when location changes in add mode
  useEffect(() => {
    if (isAdd && selectedLocation?.iata_code) {
      const dest = selectedLocation.iata_code;
      setForm(prev => ({ ...prev, destination: dest, customs_house_code: deriveChc(dest) }));
    }
  }, [selectedLocation, isAdd]);

  const f = (k: keyof MawbForm, v: string) => {
    setForm(p => {
      const updated = { ...p, [k]: v };
      if (k === 'destination') {
        updated.customs_house_code = deriveChc(v);
      }
      return updated;
    });
  };

  // Sync hawb count input to table rows
  const handleHawbCountChange = (val: string) => {
    const n = Math.max(0, Math.min(500, parseInt(val, 10) || 0));
    setHawbCount(n);
    setInlineHawbs(prev => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, emptyHawbRow)];
      }
      return prev.slice(0, n);
    });
  };

  const addHawbRow = () => {
    const next = inlineHawbs.length + 1;
    setHawbCount(next);
    setInlineHawbs(prev => [...prev, emptyHawbRow()]);
  };

  const removeHawbRow = (index: number) => {
    const updated = inlineHawbs.filter((_, i) => i !== index);
    setHawbCount(updated.length);
    setInlineHawbs(updated);
  };

  const updateHawbRow = (index: number, field: keyof InlineHawbRow, value: string) => {
    setInlineHawbs(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  // Amend: existing HAWBs are editable (packages/weight/description/route), but HAWB numbers stay fixed
  const updateExistingHawbRow = (index: number, field: keyof Omit<ExistingHawbRow, 'id' | 'hawb_no'>, value: string) => {
    setExistingHawbs(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const existingTotalPackages = existingHawbs.reduce((s, r) => s + (parseInt(r.total_packages, 10) || 0), 0);
  const existingTotalWeight = existingHawbs.reduce((s, r) => s + (parseFloat(r.gross_weight) || 0), 0);
  const showExistingTotalsWarning = existingHawbs.length > 0 && (
    (String(form.total_packages).trim() !== '' && Number(form.total_packages) !== existingTotalPackages) ||
    (String(form.gross_weight).trim() !== '' && Math.abs(Number(form.gross_weight) - existingTotalWeight) > 0.01)
  );

  const preparedHawbs = inlineHawbs
    .map(row => ({
      hawb_no: row.hawb_no.trim(),
      origin: form.origin.trim().toUpperCase(),
      destination: form.destination.trim().toUpperCase(),
      total_packages: row.total_packages.trim(),
      gross_weight: row.gross_weight.trim(),
      item_description: row.item_description.trim(),
    }))
    .filter(row => Boolean(row.hawb_no || row.total_packages || row.gross_weight));

  const hawbTotalPackages = preparedHawbs.reduce((s, r) => s + (parseInt(r.total_packages, 10) || 0), 0);
  const hawbTotalWeight = preparedHawbs.reduce((s, r) => s + (parseFloat(r.gross_weight) || 0), 0);
  const showTotalsWarning = preparedHawbs.length > 0 && (
    (String(form.total_packages).trim() !== '' && Number(form.total_packages) !== hawbTotalPackages) ||
    (String(form.gross_weight).trim() !== '' && Math.abs(Number(form.gross_weight) - hawbTotalWeight) > 0.01)
  );

  const checkHawbValidation = async (mawbId: string, mawbPkgs: string | number, mawbWt: string | number) => {
    try {
      const res = await api.get('/hawbs', { params: { mawb_id: mawbId, pageSize: 1000 } });
      const hawbs = res.data.data || [];
      if (hawbs.length === 0) { setValidationWarn(''); return; }
      const totalPkg = hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0);
      const totalWt = hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0);
      const warnings: string[] = [];
      if (Number(mawbPkgs) !== totalPkg) warnings.push(`MAWB packages (${mawbPkgs}) ≠ HAWB total (${totalPkg})`);
      if (Math.abs(parseFloat(String(mawbWt)) - totalWt) > 0.01) warnings.push(`MAWB weight (${mawbWt}) ≠ HAWB total (${totalWt.toFixed(2)})`);
      setValidationWarn(warnings.join(' | '));
    } catch { /* ignore */ }
  };

  const doSave = async (): Promise<boolean> => {
    if (!form.mawb_no || !form.origin || !form.destination) {
      toast.error('MAWB No and Origin are required');
      return false;
    }
    if (isAdd && form.mawb_no.length !== 11) {
      toast.error('MAWB number must be exactly 11 digits');
      return false;
    }
    if (showNewHawbSection && preparedHawbs.length > 0) {
      const seen = new Set<string>();
      for (let i = 0; i < preparedHawbs.length; i++) {
        const row = preparedHawbs[i];
        if (!row.hawb_no) {
          toast.error(`HAWB row ${i + 1}: HAWB No is required`);
          return false;
        }
        const key = row.hawb_no.toUpperCase();
        if (seen.has(key)) {
          toast.error(`Duplicate HAWB No: ${row.hawb_no}`);
          return false;
        }
        seen.add(key);
      }
    }

    setSaving(true);
    try {
      if (isAdd) {
        if (preparedHawbs.length > 0) {
          const res = await api.post('/mawbs/with-hawbs', { ...form, hawbs: preparedHawbs });
          const count = res.data?.hawbs?.length ?? preparedHawbs.length;
          toast.success(`MAWB created with ${count} HAWB${count === 1 ? '' : 's'}`);
        } else {
          await api.post('/mawbs', form);
          toast.success('MAWB created');
        }
      } else if (mode === 'edit' && id) {
        await api.put(`/mawbs/${id}`, form);
        toast.success('MAWB updated');
      } else if (mode === 'part' && id) {
        const res = await api.post(`/mawbs/part/${id}`, form);
        let hawbMsg = '';
        if (preparedHawbs.length > 0) {
          const hres = await api.post('/hawbs/batch', { mawb_id: res.data.id, hawbs: preparedHawbs });
          const count = hres.data?.length ?? preparedHawbs.length;
          hawbMsg = ` with ${count} HAWB${count === 1 ? '' : 's'}`;
        }
        toast.success(`Part MAWB created: ${res.data.mawb_no}${hawbMsg}`);
      } else if (mode === 'amend' && id) {
        const res = await api.post(`/mawbs/amend/${id}`, form);
        const newMawbId = res.data.id;
        for (const h of existingHawbs) {
          await api.post(`/hawbs/amend/${h.id}`, {
            mawb_id: newMawbId,
            origin: h.origin,
            destination: h.destination,
            total_packages: h.total_packages,
            gross_weight: h.gross_weight,
            item_description: h.item_description,
          });
        }
        const hawbMsg = existingHawbs.length > 0 ? ` with ${existingHawbs.length} HAWB${existingHawbs.length === 1 ? '' : 's'}` : '';
        toast.success(`Amended MAWB created: ${res.data.mawb_no}${hawbMsg}`);
      }
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndGoToList = async () => {
    const ok = await doSave();
    if (ok) navigate('/mawb');
  };

  const handleSaveAndAddAnother = async () => {
    const ok = await doSave();
    if (ok) {
      const dest = selectedLocation?.iata_code || '';
      setForm({
        ...emptyForm,
        destination: dest,
        customs_house_code: deriveChc(dest) || selectedLocation?.customs_house_code || user?.customs_house_code || '',
        profile_id: user?.profile_id || '',
      });
      setInlineHawbs([emptyHawbRow()]);
      setHawbCount(1);
      setValidationWarn('');
    }
  };

  const pageTitle = {
    add: 'Add MAWB',
    edit: `Edit MAWB — ${activeMawbNo}`,
    part: `Part MAWB — ${activeMawbNo}`,
    amend: `Amend MAWB — ${activeMawbNo}`,
  }[mode];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-center"><span className="spinner"></span> Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <h1 className="page-title">{pageTitle}</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/mawb')}>← Back to List</button>
      </div>

      <div className="card" style={{ maxWidth: 960, marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '20px 24px' }}>

          {validationWarn && (
            <div className="alert alert-warning" style={{ marginBottom: 12, fontSize: 12 }}>
              ⚠️ {validationWarn}
            </div>
          )}

          {/* MAWB No */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">MAWB No <span className="required">*</span></label>
              <input
                className="form-control font-mono"
                value={form.mawb_no}
                onChange={e => {
                  const max = isAdd ? 11 : 20;
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  if (clean.length <= max) f('mawb_no', clean);
                }}
                placeholder={isAdd ? 'e.g. 12345678901' : ''}
                maxLength={isAdd ? 11 : 20}
                disabled={mode !== 'add'}
                style={mode !== 'add' ? { background: '#f1f5f9' } : {}}
              />
              {isAdd && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {form.mawb_no.length}/11 digits
                </p>
              )}
              {(mode === 'part' || mode === 'amend') && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  New: {form.mawb_no}-{mode === 'part' ? 'P' : 'A'}
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Port of Origin <span className="required">*</span></label>
              <input
                className="form-control font-mono"
                value={form.origin}
                onChange={e => f('origin', e.target.value.toUpperCase())}
                placeholder="e.g. DXB"
                maxLength={3}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Total Packages</label>
              <input
                className="form-control"
                type="number"
                value={form.total_packages}
                onChange={e => {
                  f('total_packages', e.target.value);
                  if (mode === 'edit' && id) checkHawbValidation(id, e.target.value, form.gross_weight);
                }}
                min={0}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gross Weight</label>
              <input
                className="form-control"
                type="text"
                inputMode="decimal"
                value={form.gross_weight}
                onChange={e => {
                  const clean = sanitizeDecimal(e.target.value);
                  f('gross_weight', clean);
                  if (mode === 'edit' && id) checkHawbValidation(id, form.total_packages, clean);
                }}
              />
            </div>
          </div>

          {/* Flight details – edit / part / amend only */}
          {showFlightDetails && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Flight Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">IGM No.</label>
                  <input className="form-control" value={form.igm_no} onChange={e => f('igm_no', e.target.value.toUpperCase())} placeholder="Enter IGM No" maxLength={7} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">IGM Date</label>
                  <input className="form-control" type="date" value={form.igm_date} onChange={e => f('igm_date', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Flight No.</label>
                  <input className="form-control" value={form.flight_no} onChange={e => f('flight_no', e.target.value.toUpperCase())} placeholder="e.g. AI123" maxLength={15} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Flight Date</label>
                  <input className="form-control" type="date" value={form.flight_origin_date} onChange={e => f('flight_origin_date', e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HAWB List — add & part modes (new HAWBs can be entered; part is treated like a fresh MAWB) */}
      {showNewHawbSection && (
        <div className="card" style={{ maxWidth: 960, marginBottom: 24 }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h2 className="page-title" style={{ fontSize: 18, margin: 0 }}>HAWB List</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>No. of HAWBs:</label>
                <input
                  type="number"
                  className="form-control"
                  value={hawbCount === 0 ? '' : hawbCount}
                  min={0}
                  max={500}
                  onChange={e => handleHawbCountChange(e.target.value)}
                  onBlur={e => { if (e.target.value === '') handleHawbCountChange('0'); }}
                  style={{ width: 80, margin: 0 }}
                  placeholder="0"
                />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addHawbRow}>+ Add HAWB</button>
          </div>

          <div className="table-wrapper" style={{ margin: 0 }}>
            {inlineHawbs.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Enter a number above or click "+ Add HAWB" to add HAWB rows.
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>HAWB NO</th>
                      <th style={{ width: 140 }}>PACKAGES</th>
                      <th style={{ width: 140 }}>WEIGHT</th>
                      <th>DESCRIPTION</th>
                      <th style={{ width: 80 }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inlineHawbs.map((row, index) => (
                      <tr key={index}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{index + 1}</td>
                        <td>
                          <input
                            className="form-control font-mono"
                            value={row.hawb_no}
                            onChange={e => updateHawbRow(index, 'hawb_no', e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                            placeholder="House AWB No"
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            type="number"
                            value={row.total_packages}
                            onChange={e => updateHawbRow(index, 'total_packages', e.target.value)}
                            min={0}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            type="text"
                            inputMode="decimal"
                            value={row.gross_weight}
                            onChange={e => updateHawbRow(index, 'gross_weight', sanitizeDecimal(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={row.item_description}
                            onChange={e => updateHawbRow(index, 'item_description', e.target.value.replace(/[^a-zA-Z0-9 .,\-/]/g, '').toUpperCase())}
                            placeholder="AS PER INVOICE"
                            maxLength={30}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px' }}
                            onClick={() => removeHawbRow(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                  <span>Rows: {inlineHawbs.length} &nbsp;|&nbsp; With data: {preparedHawbs.length}</span>
                  <span>HAWB totals: {hawbTotalPackages} pkgs / {hawbTotalWeight.toFixed(3)} KGS</span>
                </div>

                {showTotalsWarning && (
                  <div className="alert alert-warning" style={{ margin: '0 16px 12px', fontSize: 12 }}>
                    HAWB totals do not match MAWB totals. You can save and adjust later.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* HAWB List — amend mode: existing HAWBs carried over, editable (HAWB No fixed, no new rows) */}
      {mode === 'amend' && (
        <div className="card" style={{ maxWidth: 960, marginBottom: 24 }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="page-title" style={{ fontSize: 18, margin: 0 }}>HAWB List (Existing — editable)</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              These HAWBs will be carried into the amendment. You can edit details, but HAWB numbers cannot be changed. New HAWBs cannot be added in Amend.
            </p>
          </div>

          <div className="table-wrapper" style={{ margin: 0 }}>
            {existingHawbs.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No HAWBs found on this MAWB.
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>HAWB NO</th>
                      <th style={{ width: 100 }}>ORIGIN</th>
                      <th style={{ width: 100 }}>DEST</th>
                      <th style={{ width: 140 }}>PACKAGES</th>
                      <th style={{ width: 140 }}>WEIGHT</th>
                      <th>DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingHawbs.map((row, index) => (
                      <tr key={row.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{index + 1}</td>
                        <td>
                          <input
                            className="form-control font-mono"
                            value={row.hawb_no}
                            disabled
                            style={{ background: '#f1f5f9' }}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={row.origin}
                            onChange={e => updateExistingHawbRow(index, 'origin', e.target.value.toUpperCase())}
                            maxLength={3}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={row.destination}
                            onChange={e => updateExistingHawbRow(index, 'destination', e.target.value.toUpperCase())}
                            maxLength={3}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            type="number"
                            value={row.total_packages}
                            onChange={e => updateExistingHawbRow(index, 'total_packages', e.target.value)}
                            min={0}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            type="text"
                            inputMode="decimal"
                            value={row.gross_weight}
                            onChange={e => updateExistingHawbRow(index, 'gross_weight', sanitizeDecimal(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={row.item_description}
                            onChange={e => updateExistingHawbRow(index, 'item_description', e.target.value.replace(/[^a-zA-Z0-9 .,\-/]/g, '').toUpperCase())}
                            placeholder="AS PER INVOICE"
                            maxLength={30}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                  <span>HAWBs: {existingHawbs.length}</span>
                  <span>HAWB totals: {existingTotalPackages} pkgs / {existingTotalWeight.toFixed(3)} KGS</span>
                </div>

                {showExistingTotalsWarning && (
                  <div className="alert alert-warning" style={{ margin: '0 16px 12px', fontSize: 12 }}>
                    HAWB totals do not match MAWB totals. You can save and adjust later.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ maxWidth: 960, display: 'flex', gap: 12, alignItems: 'center' }}>
        {isAdd ? (
          <>
            <button className="btn btn-primary" onClick={handleSaveAndGoToList} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : 'Save & Go To MAWB List'}
            </button>
            <button className="btn btn-secondary" onClick={handleSaveAndAddAnother} disabled={saving}>
              Save & Add Another
            </button>
            <button className="btn-link" onClick={() => navigate('/mawb')}>Back to List</button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={handleSaveAndGoToList} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/mawb')}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default MawbFormPage;
