import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { CanDo } from '../types';
import toast from 'react-hot-toast';
import { fmtDate } from '../utils/dateUtils';

const emptyForm = {
  type: 'CAN' as 'CAN' | 'DO',
  reference_no: '',
  mawb_no: '',
  hawb_no: '',
  consignee_name: '',
  consignee_address: '',
  issue_date: '',
  valid_till: '',
  customs_house_code: '',
  remarks: '',
};

const CanDoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAN' | 'DO'>('CAN');
  const [rows, setRows] = useState<CanDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CanDo | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/can-do', { params: { type: activeTab } });
      setRows(r.data);
    } catch {
      toast.error('Failed to load records');
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, type: activeTab });
    setShowModal(true);
  };

  const openEdit = (row: CanDo) => {
    setEditing(row);
    setForm({
      type: row.type,
      reference_no: row.reference_no || '',
      mawb_no: row.mawb_no || '',
      hawb_no: row.hawb_no || '',
      consignee_name: row.consignee_name || '',
      consignee_address: row.consignee_address || '',
      issue_date: row.issue_date ? row.issue_date.split('T')[0] : '',
      valid_till: row.valid_till ? row.valid_till.split('T')[0] : '',
      customs_house_code: row.customs_house_code || '',
      remarks: row.remarks || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/reports/can-do/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mawb_no && !form.reference_no) {
      toast.error('Either MAWB No. or Reference No. is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/reports/can-do/${editing.id}`, { ...form, status: editing.status || 'active' });
        toast.success('Updated');
      } else {
        await api.post('/reports/can-do', form);
        toast.success(`${form.type} created`);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="page-container">
      <h1 className="page-title">CAN / DO Management</h1>

      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--border-color)' }}>
        {(['CAN', 'DO'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 14,
            }}
          >
            {tab === 'CAN' ? 'CAN (Cancellation)' : 'DO (Delivery Order)'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">{activeTab} Records ({rows.length})</span>
          <button className="btn btn-primary" onClick={openNew}>+ New {activeTab}</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ref No.</th>
                <th>MAWB No.</th>
                <th>HAWB No.</th>
                <th>Consignee</th>
                <th>Issue Date</th>
                <th>Valid Till</th>
                <th>Customs Code</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={11} className="text-center text-muted" style={{ padding: '40px 0' }}>No {activeTab} records found. Click "+ New {activeTab}" to add one.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td className="font-mono">{r.reference_no || '—'}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.mawb_no || '—'}</td>
                  <td className="font-mono">{r.hawb_no || '—'}</td>
                  <td>
                    <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.consignee_name || '—'}
                    </div>
                  </td>
                  <td className="text-sm">{r.issue_date ? fmtDate(r.issue_date) : '—'}</td>
                  <td className="text-sm">{r.valid_till ? fmtDate(r.valid_till) : '—'}</td>
                  <td className="font-mono text-sm">{r.customs_house_code || '—'}</td>
                  <td>
                    <span className={`badge ${r.status === 'active' ? 'badge-success' : r.status === 'cancelled' ? 'badge-danger' : 'badge-gray'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{fmtDate(r.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => handleDelete(r.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit' : 'New'} {form.type}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-control" value={form.type} onChange={e => f('type', e.target.value)} disabled={!!editing}>
                      <option value="CAN">CAN</option>
                      <option value="DO">DO</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference No.</label>
                    <input className="form-control font-mono" value={form.reference_no} onChange={e => f('reference_no', e.target.value)} />
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">MAWB No.</label>
                    <input className="form-control font-mono" value={form.mawb_no} onChange={e => f('mawb_no', e.target.value)} placeholder="e.g. 123-45678901" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HAWB No.</label>
                    <input className="form-control font-mono" value={form.hawb_no} onChange={e => f('hawb_no', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Consignee Name</label>
                  <input className="form-control" value={form.consignee_name} onChange={e => f('consignee_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Consignee Address</label>
                  <textarea className="form-control" value={form.consignee_address} onChange={e => f('consignee_address', e.target.value)} rows={2} />
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input className="form-control" type="date" value={form.issue_date} onChange={e => f('issue_date', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Till</label>
                    <input className="form-control" type="date" value={form.valid_till} onChange={e => f('valid_till', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Customs House Code</label>
                  <input className="form-control font-mono" value={form.customs_house_code} onChange={e => f('customs_house_code', e.target.value.toUpperCase())} maxLength={6} placeholder="e.g. INDEL4" />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea className="form-control" value={form.remarks} onChange={e => f('remarks', e.target.value)} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanDoPage;
