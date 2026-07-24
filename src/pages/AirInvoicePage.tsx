import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AirInvoiceCalc } from '../types';
import { fmtDate } from '../utils/dateUtils';

import DateInput from '../components/DateInput';
const RATE_TYPE_LABEL: Record<string, string> = {
  monthly: 'Monthly Charges',
  mbl: 'Per MBL',
  hbl: 'Per HBL',
};

const money = (v: number | undefined) => Number(v || 0).toFixed(2);

// ─── Printable invoice body (shared by "generate" preview & reprint) ──────────
const InvoiceDocument: React.FC<{ inv: AirInvoiceCalc; invoiceNo: string }> = ({ inv, invoiceNo }) => {
  const rateType = inv.rateType || inv.rate_type || 'mbl';
  const taxable = inv.taxableAmount ?? inv.taxable_amount ?? 0;
  const gstRate = inv.gstRate ?? inv.gst_rate ?? 18;
  const gstAmount = inv.gstAmount ?? inv.gst_amount ?? 0;
  const roundOff = inv.roundOff ?? inv.round_off ?? 0;
  const total = inv.total ?? inv.total_amount ?? 0;

  const cellB: React.CSSProperties = { border: '1px solid #333', padding: '10px 12px', fontSize: 13, lineHeight: 1.55, verticalAlign: 'top' };
  const cellR: React.CSSProperties = { ...cellB, textAlign: 'right' };
  const th: React.CSSProperties = { ...cellB, background: '#f0f0f0', fontWeight: 700, textAlign: 'left' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', width: '100%', maxWidth: 794, margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, marginBottom: 14, letterSpacing: 2 }}>INVOICE</div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ ...cellB, width: '58%' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{inv.supplier.name}</div>
              {inv.supplier.addressLines.map((l, i) => <div key={i}>{l}</div>)}
              <div style={{ marginTop: 4 }}>Mobile: {inv.supplier.mobile}</div>
              <div>GSTIN: {inv.supplier.gstin}</div>
              <div>Email: {inv.supplier.email}</div>
            </td>
            <td style={cellB}>
              <div><strong>Invoice No.</strong><br />{invoiceNo}</div>
              <div style={{ marginTop: 10 }}><strong>Dated</strong><br />{fmtDate(inv.invoice_date)}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <tbody>
          <tr>
            <td style={cellB}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Buyer</div>
              <div style={{ fontWeight: 600 }}>{inv.buyer.company_name}</div>
              {inv.buyer.address1 && <div>{inv.buyer.address1}</div>}
              {inv.buyer.address2 && <div>{inv.buyer.address2}</div>}
              {inv.buyer.billing_state && <div>{inv.buyer.billing_state}</div>}
              {inv.buyer.gstin && <div>GSTIN: {inv.buyer.gstin}</div>}
              {inv.buyer.email && <div>Email: {inv.buyer.email}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 34 }}>Sl</th>
            <th style={th}>Description of Goods</th>
            <th style={{ ...th, width: 90 }}>Quantity</th>
            <th style={{ ...th, width: 80 }}>Rate</th>
            <th style={{ ...th, width: 50 }}>per</th>
            <th style={{ ...th, textAlign: 'right', width: 110 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellB}>1</td>
            <td style={cellB}>
              <div style={{ fontWeight: 600 }}>{inv.description}</div>
              <div style={{ color: '#444' }}>SAC CODE: {inv.sac_code}</div>
              <div style={{ color: '#444' }}>Period: {fmtDate(inv.period_from)} to {fmtDate(inv.period_to)}</div>
            </td>
            <td style={cellB}>{inv.quantity} {rateType === 'monthly' ? 'Mo.' : 'Nos.'}</td>
            <td style={cellB}>{money(inv.rate)}</td>
            <td style={cellB}>{rateType === 'monthly' ? 'Mo' : 'Nos'}</td>
            <td style={cellR}>{money(taxable)}</td>
          </tr>
          <tr>
            <td style={cellB}></td>
            <td style={{ ...cellB, textAlign: 'right', fontStyle: 'italic' }}>OUTPUT IGST {gstRate}%</td>
            <td style={cellB}></td><td style={cellB}></td><td style={cellB}></td>
            <td style={cellR}>{money(gstAmount)}</td>
          </tr>
          <tr>
            <td style={cellB}></td>
            <td style={{ ...cellB, textAlign: 'right', fontStyle: 'italic' }}>ROUND OFF</td>
            <td style={cellB}></td><td style={cellB}></td><td style={cellB}></td>
            <td style={cellR}>{money(roundOff)}</td>
          </tr>
          <tr>
            <td style={{ ...cellB, background: '#f7f7f7' }} colSpan={2}><strong>Total</strong></td>
            <td style={{ ...cellB, background: '#f7f7f7', fontWeight: 700 }}>{inv.quantity} {rateType === 'monthly' ? 'Mo.' : 'Nos.'}</td>
            <td style={{ ...cellB, background: '#f7f7f7' }}></td>
            <td style={{ ...cellB, background: '#f7f7f7' }}></td>
            <td style={{ ...cellR, background: '#f7f7f7', fontWeight: 700, fontSize: 14 }}>₹ {money(total)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <tbody>
          <tr>
            <td style={cellB}>
              <div><strong>Amount Chargeable (in words)</strong></div>
              <div>Rs. {inv.amount_in_words} ONLY</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ ...cellB, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Bank Details</div>
          <div>{inv.bank.accountName}</div>
          <div><strong>A/C:</strong> {inv.bank.accountNo}</div>
          <div><strong>IFSC:</strong> {inv.bank.ifsc}</div>
          <div><strong>Branch:</strong> {inv.bank.branch}</div>
        </div>
        <div style={{ ...cellB, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Declaration</div>
          <div style={{ fontSize: 12, color: '#333' }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, marginTop: 14, color: '#666' }}>This is a Computer Generated Invoice</div>
    </div>
  );
};

const printHtml = (title: string, innerHtml: string) => {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) { toast.error('Popup blocked — allow popups to print'); return; }
  win.document.write(`<html><head><title>${title}</title>
    <style>
      @page{size:A4;margin:12mm}
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;margin:0;padding:16px}
      table{border-collapse:collapse}
      @media print{body{padding:0}}
    </style></head>
    <body>${innerHtml}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
};

// ─── Generator page ────────────────────────────────────────────────────────────
const AirInvoicePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<AirInvoiceCalc | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<AirInvoiceCalc | null>(null);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handlePreview = async () => {
    if (!userId || !fromDate || !toDate) { toast.error('Select user, from date and to date'); return; }
    setLoadingPreview(true);
    setPreview(null);
    setSaved(null);
    try {
      const res = await api.get('/reports/air-invoice/preview', { params: { user_id: userId, from_date: fromDate, to_date: toDate } });
      setPreview(res.data);
      setInvoiceNo(res.data.suggested_invoice_no);
      setInvoiceDate(res.data.invoice_date);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to compute invoice');
    } finally { setLoadingPreview(false); }
  };

  const handleGenerate = async () => {
    if (!preview || !invoiceNo.trim()) { toast.error('Invoice No. is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/reports/air-invoice/generate', {
        user_id: userId, from_date: fromDate, to_date: toDate,
        invoice_no: invoiceNo.trim(), invoice_date: invoiceDate,
      });
      setSaved(res.data);
      toast.success(`Invoice ${res.data.invoice_no} generated`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const area = document.getElementById('air-invoice-print-area');
    if (!area) return;
    printHtml(`Invoice ${saved?.invoice_no || invoiceNo}`, area.innerHTML);
  };

  const resetAll = () => {
    setPreview(null); setSaved(null); setInvoiceNo(''); setInvoiceDate('');
  };

  const activeDoc = saved || preview;
  const activeInvoiceNo = saved?.invoice_no || invoiceNo;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Generate Air Invoice</span></div>
        <div className="card-body">
          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">User <span className="required">*</span></label>
              <select className="form-control" value={userId} onChange={e => { setUserId(e.target.value); resetAll(); }}>
                <option value="">Select User...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}{u.full_name ? ` — ${u.full_name}` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From Date <span className="required">*</span></label>
              <DateInput className="form-control" value={fromDate} onChange={e => { setFromDate(e.target.value); resetAll(); }} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date <span className="required">*</span></label>
              <DateInput className="form-control" value={toDate} onChange={e => { setToDate(e.target.value); resetAll(); }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handlePreview} disabled={loadingPreview}>
            {loadingPreview ? 'Calculating...' : 'Preview'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Billing Breakdown</span></div>
          <div className="card-body">
            <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Invoice No.</label>
                <input className="form-control font-mono" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} disabled={!!saved} />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <DateInput className="form-control" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} disabled={!!saved} />
              </div>
            </div>
            <table style={{ width: '100%', marginBottom: 12 }}>
              <tbody>
                <tr><td className="text-muted">Billing Plan</td><td style={{ fontWeight: 600 }}>{RATE_TYPE_LABEL[preview.rateType || 'mbl']}</td></tr>
                <tr><td className="text-muted">Quantity</td><td>{preview.quantity}</td></tr>
                <tr><td className="text-muted">Rate</td><td>₹ {money(preview.rate)}</td></tr>
                <tr><td className="text-muted">Taxable Amount</td><td>₹ {money(preview.taxableAmount)}</td></tr>
                <tr><td className="text-muted">GST ({preview.gstRate}%)</td><td>₹ {money(preview.gstAmount)}</td></tr>
                <tr><td className="text-muted">Round Off</td><td>₹ {money(preview.roundOff)}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>Total Payable</td><td style={{ fontWeight: 700 }}>₹ {money(preview.total)}</td></tr>
              </tbody>
            </table>
            {preview.quantity === 0 && preview.rateType !== 'monthly' && (
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                No transmitted {preview.rateType === 'mbl' ? 'MAWBs' : 'HAWBs'} found for this user in the selected period.
              </div>
            )}
            {!saved ? (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={saving}>
                {saving ? 'Generating...' : 'Generate & Save Invoice'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handlePrint}>⬇ Download PDF</button>
            )}
          </div>
        </div>
      )}

      {activeDoc && (
        <div className="card">
          <div className="card-header"><span className="card-title">Invoice Preview</span></div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <div id="air-invoice-print-area">
              <InvoiceDocument inv={activeDoc} invoiceNo={activeInvoiceNo} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirInvoicePage;
export { InvoiceDocument, printHtml };
