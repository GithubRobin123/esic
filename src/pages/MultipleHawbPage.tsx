import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mawb } from '../types';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/dateUtils';

interface HawbRow {
  hawb_no: string;
  origin: string;
  destination: string;
  total_packages: string;
  gross_weight: string;
  item_description: string;
}

const MultipleHawbPage: React.FC = () => {
  const navigate = useNavigate();
  const [mawbs, setMawbs] = useState<Mawb[]>([]);
  const [selectedMawbId, setSelectedMawbId] = useState('');
  const [numHawbs, setNumHawbs] = useState('1');
  const [rows, setRows] = useState<HawbRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistData, setChecklistData] = useState<any[]>([]);

  useEffect(() => {
    api.get('/mawbs', { params: { pageSize: 1000 } }).then(r => setMawbs(r.data.data ?? [])).catch(() => {});
  }, []);

  const selectedMawb = mawbs.find(m => m.id === selectedMawbId);

  const handleAddRows = () => {
    const count = parseInt(numHawbs) || 1;
    const origin = selectedMawb?.origin || '';
    const destination = selectedMawb?.destination || '';
    const newRows: HawbRow[] = Array.from({ length: count }, (_, i) => ({
      hawb_no: rows[i]?.hawb_no || '',
      origin,
      destination,
      total_packages: rows[i]?.total_packages || '',
      gross_weight: rows[i]?.gross_weight || '',
      item_description: rows[i]?.item_description || '',
    }));
    setRows(newRows);
  };

  const updateRow = (idx: number, field: keyof HawbRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const deleteRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const totalHawbs = rows.filter(r => r.hawb_no.trim()).length;
  const totalPkg = rows.reduce((s, r) => s + (parseInt(r.total_packages) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (parseFloat(r.gross_weight) || 0), 0);

  const handleSave = async () => {
    if (!selectedMawbId) { toast.error('Please select a MAWB'); return; }
    const validRows = rows.filter(r => r.hawb_no.trim());
    if (validRows.length === 0) { toast.error('Add at least one HAWB number'); return; }
    setSaving(true);
    try {
      await api.post('/hawbs/batch', { mawb_id: selectedMawbId, hawbs: validRows });
      toast.success(`${validRows.length} HAWB(s) created`);
      navigate(`/hawb?mawb_id=${selectedMawbId}&mawb_no=${selectedMawb?.mawb_no || ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleChecklist = async () => {
    if (!selectedMawbId) { toast.error('Please select a MAWB first'); return; }
    try {
      const res = await api.get('/hawbs/checklist/data', { params: { mawb_id: selectedMawbId } });
      setChecklistData(res.data);
      setShowChecklist(true);
    } catch { toast.error('Failed to load checklist'); }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('checklist-print-area');
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=1100,height=700');
    if (!win) { window.print(); return; }
    win.document.write(`
      <html><head><title>Check List Details</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 11px; }
        th { background: #e2e8f0; font-weight: 700; }
        tr.mawb-row td { background: #f8fafc; font-weight: 600; }
        tr.totals-row td { background: #f1f5f9; font-weight: 700; }
        .section { margin-bottom: 20px; }
        h3 { margin: 0 0 6px 0; font-size: 13px; }
        @media print { body { margin: 0; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const NUM_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

  const thStyle: React.CSSProperties = { border: '1px solid #cbd5e1', padding: '5px 8px', background: '#e2e8f0', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: 12 };

  return (
    <div className="page-container">
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
            <span style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700 }}>
              Add Multiple Hawbs
            </span>
          </div>
          <p className="page-subtitle">Add multiple house airway bills at once</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hawb')}>← View All HAWBs</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Master AWB:</label>
              <select
                className="form-control"
                style={{ minWidth: 200 }}
                value={selectedMawbId}
                onChange={e => setSelectedMawbId(e.target.value)}
              >
                <option value="">Select MAWB...</option>
                {mawbs.map(m => <option key={m.id} value={m.id}>{m.mawb_no}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>No Of Hawbs:</label>
              <select
                className="form-control"
                style={{ width: 100 }}
                value={numHawbs}
                onChange={e => setNumHawbs(e.target.value)}
              >
                {NUM_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAddRows}
              disabled={!selectedMawbId}
            >
              Add/update Rows
            </button>
          </div>

          {/* Table */}
          {rows.length > 0 && (
            <div className="table-wrapper" style={{ marginBottom: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Hawb No</th>
                    <th>Port Of Origin</th>
                    <th>Port Of Destination</th>
                    <th>NO Of Package</th>
                    <th>Weight</th>
                    <th>Item Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          className="form-control font-mono"
                          style={{ minWidth: 120 }}
                          value={row.hawb_no}
                          onChange={e => updateRow(idx, 'hawb_no', e.target.value)}
                          placeholder="ENTER HOUSE NO"
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ width: 80 }}
                          value={row.origin}
                          onChange={e => updateRow(idx, 'origin', e.target.value)}
                          maxLength={3}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ width: 80 }}
                          value={row.destination}
                          onChange={e => updateRow(idx, 'destination', e.target.value)}
                          maxLength={3}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ width: 90 }}
                          type="number"
                          value={row.total_packages}
                          onChange={e => updateRow(idx, 'total_packages', e.target.value)}
                          placeholder="Packages"
                          min={0}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ width: 100 }}
                          type="number"
                          step="0.01"
                          value={row.gross_weight}
                          onChange={e => updateRow(idx, 'gross_weight', e.target.value)}
                          placeholder="Weight"
                          min={0}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ minWidth: 160 }}
                          value={row.item_description}
                          onChange={e => updateRow(idx, 'item_description', e.target.value)}
                          placeholder="DESCRIPTION"
                          maxLength={100}
                        />
                      </td>
                      <td>
                        <button className="btn-link danger" onClick={() => deleteRow(idx)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ fontWeight: 600, background: '#f8fafc' }}>
                    <td>Total Hawb : {totalHawbs}</td>
                    <td colSpan={2}></td>
                    <td>Total PKG : {totalPkg}</td>
                    <td>Total Weight : {totalWeight.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {rows.length === 0 && (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No rows yet</div>
              <p>Select a MAWB, choose number of HAWBs, then click "Add/update Rows"</p>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedMawbId}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }}></span> Saving...</> : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={handleChecklist}>CheckList</button>
          </div>
        )}
      </div>

      {/* Checklist Dialog */}
      {showChecklist && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 24, overflowY: 'auto' }}>
          <div className="modal" style={{ maxWidth: 1200, width: '98%' }}>
            <div className="modal-header">
              <span className="modal-title">
                Check List Details — {selectedMawb?.mawb_no}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>Print Page</button>
                <button className="modal-close" onClick={() => setShowChecklist(false)}>×</button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '12px 16px' }}>
              <div id="checklist-print-area">
                {checklistData.length === 0 ? (
                  <div className="empty-state">No data found for selected MAWB.</div>
                ) : checklistData.map((mawb: any) => (
                  <div key={mawb.id} className="section" style={{ marginBottom: 20 }}>
                    {/* MAWB header row */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Master AWB</th>
                          <th style={thStyle}>Port Of Origin</th>
                          <th style={thStyle}>Port Of Dest</th>
                          <th style={thStyle}>Packages</th>
                          <th style={thStyle}>Weight</th>
                          <th style={thStyle}>Item Desc</th>
                          <th style={thStyle}>Msg Type</th>
                          <th style={thStyle}>Transmission Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#f0f9ff' }}>
                          <td style={tdStyle}><strong>{mawb.mawb_no}</strong></td>
                          <td style={tdStyle}>{mawb.origin}</td>
                          <td style={tdStyle}>{mawb.destination}</td>
                          <td style={tdStyle}>{mawb.total_packages}</td>
                          <td style={tdStyle}>{parseFloat(String(mawb.gross_weight)).toFixed(2)}</td>
                          <td style={tdStyle}>CONSOL</td>
                          <td style={tdStyle}>{mawb.message_type || 'F'}</td>
                          <td style={{ ...tdStyle, fontSize: 11 }}>{fmtDateTime(mawb.transmission_date)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* HAWB rows */}
                    {mawb.hawbs?.length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0' }}>
                            <th style={thStyle}>House AWB</th>
                            <th style={thStyle}>Port Of Origin</th>
                            <th style={thStyle}>Port Of Dest</th>
                            <th style={thStyle}>Packages</th>
                            <th style={thStyle}>Weight</th>
                            <th style={thStyle}>Item Desc</th>
                            <th style={thStyle}>Msg Type</th>
                            <th style={thStyle}>Transmission Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mawb.hawbs.map((h: any) => (
                            <tr key={h.id}>
                              <td style={tdStyle}>{h.hawb_no}</td>
                              <td style={tdStyle}>{h.origin}</td>
                              <td style={tdStyle}>{h.destination}</td>
                              <td style={tdStyle}>{h.total_packages}</td>
                              <td style={tdStyle}>{parseFloat(String(h.gross_weight)).toFixed(2)}</td>
                              <td style={tdStyle}>{h.item_description || '—'}</td>
                              <td style={tdStyle}>{h.message_type || 'F'}</td>
                              <td style={{ ...tdStyle, fontSize: 11 }}>{fmtDateTime(mawb.transmission_date)}</td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 700, background: '#f1f5f9' }}>
                            <td style={tdStyle}>Hawb Count: {mawb.hawbs.length}</td>
                            <td style={tdStyle} colSpan={2}>Total:</td>
                            <td style={tdStyle}>{mawb.hawbs.reduce((s: number, h: any) => s + Number(h.total_packages), 0)}</td>
                            <td style={tdStyle}>{mawb.hawbs.reduce((s: number, h: any) => s + parseFloat(h.gross_weight), 0).toFixed(2)}</td>
                            <td style={tdStyle} colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleHawbPage;
