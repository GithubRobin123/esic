import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Invoice } from '../types';
import toast from 'react-hot-toast';
import { fmtDate } from '../utils/dateUtils';

const emptyForm = {
  invoice_no: '',
  invoice_date: '',
  mawb_no: '',
  hawb_no: '',
  consignee_name: '',
  amount: '',
  currency: 'INR',
  description: '',
};

// ─── Invoice Page ─────────────────────────────────────────────────────────────
const InvoicePage: React.FC = () => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/reports/invoices', { params });
      setRows(r.data);
    } catch {
      toast.error('Failed to load invoices');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, invoice_date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({
      invoice_no: inv.invoice_no,
      invoice_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : '',
      mawb_no: inv.mawb_no || '',
      hawb_no: inv.hawb_no || '',
      consignee_name: inv.consignee_name || '',
      amount: String(inv.amount),
      currency: inv.currency,
      description: inv.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/reports/invoices/${id}`);
      toast.success('Invoice deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoice_no || !form.invoice_date) {
      toast.error('Invoice No. and Date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0 };
      if (editing) {
        await api.put(`/reports/invoices/${editing.id}`, { ...payload, status: editing.status });
        toast.success('Invoice updated');
      } else {
        await api.post('/reports/invoices', payload);
        toast.success('Invoice created');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status Filter</label>
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn btn-secondary" onClick={load} disabled={loading}>Refresh</button>
            <button className="btn btn-primary" onClick={openNew} style={{ marginLeft: 'auto' }}>+ New Invoice</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Invoices ({rows.length})</span>
          <span className="text-muted text-sm">Total: <strong>₹ {totalAmount.toFixed(2)}</strong></span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>MAWB No.</th>
                <th>HAWB No.</th>
                <th>Consignee</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={12} className="text-center text-muted" style={{ padding: '40px 0' }}>No invoices found</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.invoice_no}</td>
                  <td className="text-sm">{r.invoice_date ? fmtDate(r.invoice_date) : '—'}</td>
                  <td className="font-mono">{r.mawb_no || '—'}</td>
                  <td className="font-mono">{r.hawb_no || '—'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.consignee_name || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(r.amount).toFixed(2)}</td>
                  <td className="font-mono text-sm">{r.currency}</td>
                  <td className="text-muted text-sm" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                  <td>
                    <span className={`badge ${r.status === 'paid' ? 'badge-success' : r.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{r.created_by_name || '—'}</td>
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
          <div className="modal" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Invoice' : 'New Invoice'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Invoice No. <span className="required">*</span></label>
                    <input className="form-control font-mono" value={form.invoice_no} onChange={e => f('invoice_no', e.target.value)} readOnly={!!editing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date <span className="required">*</span></label>
                    <input className="form-control" type="date" value={form.invoice_date} onChange={e => f('invoice_date', e.target.value)} />
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">MAWB No.</label>
                    <input className="form-control font-mono" value={form.mawb_no} onChange={e => f('mawb_no', e.target.value)} />
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
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-control" value={form.currency} onChange={e => f('currency', e.target.value)}>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => f('description', e.target.value)} rows={2} />
                </div>
                {editing && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={editing.status} onChange={e => setEditing(p => p ? { ...p, status: e.target.value } : p)}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Accounting Page Shell ────────────────────────────────────────────────────
const AccountingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const subPath = location.pathname.replace('/accounting', '').replace(/^\//, '') || 'invoice';

  const tabs = [
    { key: 'invoice', label: 'View Invoice', path: '/accounting/invoice' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Accounting</h1>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--border-color)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: subPath === tab.key ? 700 : 400,
              color: subPath === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: subPath === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(subPath === 'invoice' || subPath === '') ? <InvoicePage /> : (
        <div className="empty-state" style={{ padding: 60 }}>
          <div className="empty-state-title">Coming Soon</div>
          <p className="text-muted">This accounting sub-module will be available in a future update.</p>
        </div>
      )}
    </div>
  );
};

export default AccountingPage;
