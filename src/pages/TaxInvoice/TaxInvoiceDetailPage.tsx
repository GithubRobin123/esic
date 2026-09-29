import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Invoice } from './taxInvoiceTypes';
import {
  getInvoice, addPayment, removePayment, cancelInvoice, deleteInvoice,
  downloadPdf, downloadExcel, readApiError,
} from './taxInvoiceApi';
import { money, fmtDate, todayISO, fromSavedInvoice } from './taxInvoiceCalc';
import TaxInvoiceTabs from './TaxInvoiceTabs';
import TaxInvoicePreview from './TaxInvoicePreview';
import StatusBadge from './StatusBadge';

const METHODS = ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Other'];

const TaxInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState('NEFT');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setInv(await getInvoice(id));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load invoice');
      navigate('/tax-invoice', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever the route id changes; `load` is stable enough for this.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  // Default the payment box to whatever is still outstanding.
  useEffect(() => {
    if (inv && inv.pending_amount > 0) setPayAmount(String(inv.pending_amount));
  }, [inv]);

  const preview = useMemo(() => (inv ? fromSavedInvoice(inv) : null), [inv]);

  const download = async (kind: 'pdf' | 'excel') => {
    if (!inv) return;
    try {
      if (kind === 'pdf') await downloadPdf(inv.id, inv.invoice_no);
      else await downloadExcel(inv.id, inv.invoice_no);
    } catch (e: any) {
      toast.error(await readApiError(e, `Failed to download ${kind.toUpperCase()}`));
    }
  };

  const recordPayment = async () => {
    if (!inv) return;
    const amount = parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a payment amount greater than 0'); return; }
    if (amount > inv.pending_amount) {
      toast.error(`Amount exceeds the outstanding balance of Rs. ${money(inv.pending_amount)}`);
      return;
    }

    setBusy(true);
    try {
      const updated = await addPayment(inv.id, {
        amount, paid_on: payDate, method: payMethod,
        reference: payRef.trim(), notes: payNotes.trim(),
      });
      setInv(updated);
      setPayRef(''); setPayNotes('');
      toast.success('Payment recorded');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to record payment');
    } finally {
      setBusy(false);
    }
  };

  const deletePayment = async (paymentId: string, amount: number) => {
    if (!inv) return;
    if (!window.confirm(`Remove the payment of Rs. ${money(amount)}?`)) return;
    setBusy(true);
    try {
      setInv(await removePayment(inv.id, paymentId));
      toast.success('Payment removed');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to remove payment');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!inv) return;
    if (!window.confirm(
      `Cancel invoice ${inv.invoice_no}?\n\nIt keeps its number for the audit trail but drops out of all pending totals. This cannot be undone.`
    )) return;
    setBusy(true);
    try {
      setInv(await cancelInvoice(inv.id));
      toast.success('Invoice cancelled');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  const hardDelete = async () => {
    if (!inv) return;
    if (!window.confirm(`Permanently delete ${inv.invoice_no}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteInvoice(inv.id);
      toast.success('Invoice deleted');
      navigate('/tax-invoice');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <TaxInvoiceTabs />
        <div className="loading-center"><span className="spinner"></span> Loading...</div>
      </div>
    );
  }
  if (!inv || !preview) return null;

  return (
    <div className="page-container">
      <TaxInvoiceTabs />

      <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="page-title">
            {inv.invoice_no} <StatusBadge status={inv.status} />
          </h1>
          <p className="page-subtitle">
            {inv.party_snapshot?.name} · {fmtDate(inv.invoice_date)}
            {inv.created_by_username ? ` · created by ${inv.created_by_username}` : ''}
          </p>
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/tax-invoice')}>← Back</button>
          <button className="btn btn-success" onClick={() => download('pdf')}>Download PDF</button>
          <button className="btn btn-success" onClick={() => download('excel')}>Download Excel</button>
          {!inv.is_cancelled && (
            <button className="btn btn-primary" onClick={() => navigate(`/tax-invoice/${inv.id}/edit`)}>Edit</button>
          )}
          {!inv.is_cancelled && (
            <button className="btn btn-warning" onClick={cancel} disabled={busy}>Cancel Invoice</button>
          )}
          {hasRole(['master_admin']) && inv.payments.length === 0 && (
            <button className="btn btn-danger" onClick={hardDelete} disabled={busy}>Delete</button>
          )}
        </div>
      </div>

      {/* Money summary */}
      <div className="form-row-3 mb-16">
        <div className="card"><div className="card-body">
          <div className="text-sm text-muted">Invoice Total</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Rs. {money(inv.total_amount)}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="text-sm text-muted">Received</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>Rs. {money(inv.amount_paid)}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="text-sm text-muted">Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: inv.pending_amount > 0 ? '#dc2626' : '#16a34a' }}>
            Rs. {money(inv.pending_amount)}
          </div>
        </div></div>
      </div>

      {inv.is_cancelled && (
        <div className="alert alert-danger mb-16">
          This invoice is cancelled. It is excluded from all pending and outstanding totals.
        </div>
      )}

      {/* Payments */}
      <div className="card mb-16">
        <div className="card-header"><span className="card-title">Payments</span></div>
        <div className="card-body">
          {!inv.is_cancelled && inv.pending_amount > 0 && (
            <>
              <div className="form-row-4">
                <div className="form-group">
                  <label className="form-label">Amount Received <span className="required">*</span></label>
                  <input className="form-control" value={payAmount} inputMode="decimal"
                    onChange={e => setPayAmount(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" value={payDate}
                    onChange={e => setPayDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference (UTR / Cheque)</label>
                  <input className="form-control" value={payRef} maxLength={100}
                    onChange={e => setPayRef(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-control" value={payNotes} maxLength={200}
                  onChange={e => setPayNotes(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={recordPayment} disabled={busy}>
                {busy ? 'Saving...' : 'Mark Payment Received'}
              </button>
              <div className="divider" />
            </>
          )}

          {inv.pending_amount === 0 && !inv.is_cancelled && (
            <div className="alert alert-success">This invoice is fully paid.</div>
          )}

          {inv.payments.length === 0 ? (
            <p className="text-muted text-sm">No payments recorded yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Amount</th><th>Method</th><th>Reference</th>
                    <th>Notes</th><th>Recorded By</th><th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {inv.payments.map(p => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.paid_on)}</td>
                      <td className="font-mono">Rs. {money(p.amount)}</td>
                      <td>{p.method || '—'}</td>
                      <td className="font-mono text-sm">{p.reference || '—'}</td>
                      <td className="text-sm">{p.notes || '—'}</td>
                      <td className="text-sm">{p.created_by_username || '—'}</td>
                      <td>
                        <button className="btn btn-danger btn-xs" disabled={busy}
                          onClick={() => deletePayment(p.id, p.amount)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printed view */}
      <div className="card">
        <div className="card-header"><span className="card-title">Invoice</span></div>
        <div className="card-body">
          <TaxInvoicePreview
            invoiceNo={inv.invoice_no}
            invoiceDate={inv.invoice_date}
            placeOfSupply={inv.place_of_supply || ''}
            party={inv.party_snapshot}
            items={preview.drafts}
            totals={preview.totals}
            gstMode={inv.gst_mode}
            notes={inv.notes || ''}
            cancelled={inv.is_cancelled}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxInvoiceDetailPage;
