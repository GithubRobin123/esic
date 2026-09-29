import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Party, ItemDraft, Invoice } from './taxInvoiceTypes';
import {
  listParties, nextInvoiceNo, createInvoice, updateInvoice, getInvoice,
  downloadPdf, downloadExcel, readApiError, InvoicePayload,
} from './taxInvoiceApi';
import {
  computeLocal, resolveGstMode, money, todayISO, emptyItem, numberToWordsINR, toDateInput,
} from './taxInvoiceCalc';
import TaxInvoiceTabs from './TaxInvoiceTabs';
import TaxInvoicePreview from './TaxInvoicePreview';

const GST_PRESETS = ['0', '5', '12', '18', '28'];

const TaxInvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState<Invoice | null>(null);

  const party = useMemo(() => parties.find(p => p.id === partyId), [parties, partyId]);
  const gstMode = useMemo(() => resolveGstMode(party?.state_code), [party]);
  const totals = useMemo(() => computeLocal(items, discount, gstMode), [items, discount, gstMode]);

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const ps = await listParties();
        if (cancelled) return;
        setParties(ps);

        if (isEdit && id) {
          const inv = await getInvoice(id);
          if (cancelled) return;
          if (inv.is_cancelled) {
            toast.error('This invoice is cancelled and cannot be edited.');
            navigate(`/tax-invoice/${id}`, { replace: true });
            return;
          }
          setInvoiceNo(inv.invoice_no);
          setInvoiceDate(toDateInput(inv.invoice_date) || todayISO());
          setPartyId(inv.party_id || '');
          setPlaceOfSupply(inv.place_of_supply || '');
          setDiscount(String(inv.discount ?? 0));
          setNotes(inv.notes || '');
          setItems(inv.items.length ? inv.items.map(it => ({
            description: it.description,
            hsn_sac: it.hsn_sac || '',
            quantity: String(it.quantity),
            unit: it.unit || '',
            rate: String(it.rate),
            gst_rate: String(it.gst_rate),
          })) : [emptyItem()]);

          // A deactivated party won't be in the active list — add it back so
          // the dropdown can still show the invoice's own party.
          if (inv.party_id && !ps.some(p => p.id === inv.party_id)) {
            setParties([{ ...(inv.party_snapshot as Party), id: inv.party_id }, ...ps]);
          }
        } else {
          setInvoiceNo(await nextInvoiceNo());
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e.response?.data?.message || 'Failed to load invoice');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  // Default place of supply to the party's state, unless already set by hand.
  useEffect(() => {
    if (party && !placeOfSupply) setPlaceOfSupply(party.state || '');
  }, [party]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Item row helpers ──────────────────────────────────────────────────────
  const setItem = (idx: number, key: keyof ItemDraft, value: string) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));

  const addRow = () => setItems(prev => [...prev, emptyItem()]);

  const removeRow = (idx: number) =>
    setItems(prev => (prev.length === 1 ? [emptyItem()] : prev.filter((_, i) => i !== idx)));

  const numericInput = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

  // ─── Save ──────────────────────────────────────────────────────────────────
  const buildPayload = useCallback((): InvoicePayload => ({
    invoice_no: invoiceNo.trim(),
    invoice_date: invoiceDate,
    party_id: partyId,
    place_of_supply: placeOfSupply.trim(),
    discount: parseFloat(discount || '0') || 0,
    notes: notes.trim(),
    items: items.map(it => ({
      description: it.description.trim(),
      hsn_sac: it.hsn_sac.trim(),
      quantity: parseFloat(it.quantity) || 0,
      unit: it.unit.trim(),
      rate: parseFloat(it.rate) || 0,
      gst_rate: parseFloat(it.gst_rate) || 0,
    })),
  }), [invoiceNo, invoiceDate, partyId, placeOfSupply, discount, notes, items]);

  const validate = (): string | null => {
    if (!partyId) return 'Select a party.';
    if (!invoiceNo.trim()) return 'Invoice number is required.';
    if (!invoiceDate) return 'Invoice date is required.';
    if (totals.errors.length) return totals.errors[0];
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) { toast.error(problem); return; }

    setSaving(true);
    try {
      const result = isEdit && id
        ? await updateInvoice(id, buildPayload())
        : await createInvoice(buildPayload());

      setSaved(result);
      toast.success(isEdit ? 'Invoice updated' : `Invoice ${result.invoice_no} created`);

      if (!isEdit) navigate(`/tax-invoice/${result.id}`, { replace: true });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const download = async (kind: 'pdf' | 'excel') => {
    if (!saved) { toast.error('Save the invoice first'); return; }
    try {
      if (kind === 'pdf') await downloadPdf(saved.id, saved.invoice_no);
      else await downloadExcel(saved.id, saved.invoice_no);
    } catch (e: any) {
      toast.error(await readApiError(e, `Failed to download ${kind.toUpperCase()}`));
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

  const isIntra = gstMode === 'cgst_sgst';

  return (
    <div className="page-container">
      <TaxInvoiceTabs />

      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Tax Invoice' : 'New Tax Invoice'}</h1>
          <p className="page-subtitle">Enter the party, line items and GST — totals update as you type</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/tax-invoice')}>← Back to list</button>
      </div>

      {/* ─── Header fields ─────────────────────────────────────────────────── */}
      <div className="card mb-16">
        <div className="card-header"><span className="card-title">Invoice Details</span></div>
        <div className="card-body">
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Invoice No. <span className="required">*</span></label>
              <input className="form-control font-mono" value={invoiceNo} maxLength={40}
                onChange={e => setInvoiceNo(e.target.value.toUpperCase())} />
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                Auto-generated — change it if you need a different number.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date <span className="required">*</span></label>
              <input className="form-control" type="date" value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Place of Supply</label>
              <input className="form-control" value={placeOfSupply} maxLength={100}
                onChange={e => setPlaceOfSupply(e.target.value)} placeholder="e.g. Maharashtra" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Party <span className="required">*</span></label>
            <div className="flex gap-8">
              <select className="form-control" value={partyId} onChange={e => setPartyId(e.target.value)}>
                <option value="">— Select Party —</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.gstin ? ` (${p.gstin})` : ''}
                  </option>
                ))}
              </select>
              <button className="btn btn-secondary" type="button"
                onClick={() => navigate('/tax-invoice/parties')} style={{ whiteSpace: 'nowrap' }}>
                Manage Parties
              </button>
            </div>
          </div>

          {party && (
            <div className="alert alert-info" style={{ marginTop: 4 }}>
              <strong>{party.name}</strong>
              {party.gstin && <> · GSTIN {party.gstin}</>}
              {party.state && <> · {party.state}</>}
              <br />
              Tax applied: <strong>{isIntra ? 'CGST + SGST' : 'IGST'}</strong>
              {isIntra
                ? ' — party is in the same state as the supplier.'
                : party.state_code
                  ? ' — inter-state supply.'
                  : ' — no state code on this party, so inter-state is assumed.'}
            </div>
          )}
        </div>
      </div>

      {/* ─── Line items ────────────────────────────────────────────────────── */}
      <div className="card mb-16">
        <div className="card-header">
          <span className="card-title">Line Items</span>
          <button className="btn btn-primary btn-sm" onClick={addRow}>+ Add Row</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ minWidth: 220 }}>Description <span className="required">*</span></th>
                <th style={{ width: 110 }}>HSN/SAC</th>
                <th style={{ width: 90 }}>Qty <span className="required">*</span></th>
                <th style={{ width: 80 }}>Unit</th>
                <th style={{ width: 110 }}>Rate <span className="required">*</span></th>
                <th style={{ width: 90 }}>GST %</th>
                <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="text-muted">{idx + 1}</td>
                  <td>
                    <input className="form-control" value={it.description} maxLength={500}
                      placeholder="Service or product description"
                      onChange={e => setItem(idx, 'description', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-control font-mono" value={it.hsn_sac} maxLength={20}
                      placeholder="998439"
                      onChange={e => setItem(idx, 'hsn_sac', e.target.value.replace(/[^0-9A-Za-z]/g, ''))} />
                  </td>
                  <td>
                    <input className="form-control" value={it.quantity} inputMode="decimal"
                      onChange={e => setItem(idx, 'quantity', numericInput(e.target.value))} />
                  </td>
                  <td>
                    <input className="form-control" value={it.unit} maxLength={20}
                      onChange={e => setItem(idx, 'unit', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-control" value={it.rate} inputMode="decimal"
                      onChange={e => setItem(idx, 'rate', numericInput(e.target.value))} />
                  </td>
                  <td>
                    <input className="form-control" value={it.gst_rate} inputMode="decimal" list="gst-presets"
                      onChange={e => setItem(idx, 'gst_rate', numericInput(e.target.value))} />
                  </td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>
                    {money(totals.lineAmounts[idx] ?? 0)}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-xs" onClick={() => removeRow(idx)} title="Remove row">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <datalist id="gst-presets">
          {GST_PRESETS.map(g => <option key={g} value={g} />)}
        </datalist>
      </div>

      {/* ─── Totals + notes ────────────────────────────────────────────────── */}
      <div className="form-row-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Notes</span></div>
          <div className="card-body">
            <textarea className="form-control" rows={6} value={notes} maxLength={2000}
              placeholder="Payment terms, PO reference, anything to print on the invoice..."
              onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Summary</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Discount (Rs.)</label>
              <input className="form-control" value={discount} inputMode="decimal"
                onChange={e => setDiscount(numericInput(e.target.value))} />
            </div>

            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <tr>
                  <td className="text-muted">Subtotal</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{money(totals.subtotal)}</td>
                </tr>
                {totals.discount > 0 && (
                  <tr>
                    <td className="text-muted">Discount</td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>- {money(totals.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-muted">Taxable Value</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{money(totals.taxable_amount)}</td>
                </tr>
                {isIntra ? (
                  <>
                    <tr>
                      <td className="text-muted">CGST</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{money(totals.cgst_amount)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">SGST</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{money(totals.sgst_amount)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="text-muted">IGST</td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>{money(totals.igst_amount)}</td>
                  </tr>
                )}
                {totals.round_off !== 0 && (
                  <tr>
                    <td className="text-muted">Round Off</td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      {totals.round_off < 0 ? '- ' : ''}{money(Math.abs(totals.round_off))}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 6 }}>TOTAL</td>
                  <td className="font-mono" style={{
                    textAlign: 'right', fontWeight: 700, fontSize: 16,
                    borderTop: '1px solid var(--border)', paddingTop: 6,
                  }}>
                    Rs. {money(totals.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-sm text-muted" style={{ marginTop: 10 }}>
              {numberToWordsINR(totals.total_amount)} RUPEES ONLY
            </div>
          </div>
        </div>
      </div>

      {totals.errors.length > 0 && (
        <div className="alert alert-warning mt-16">
          <strong>Fix before saving:</strong>
          <ul style={{ margin: '6px 0 0 18px' }}>
            {totals.errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ─── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => setShowPreview(true)} disabled={!partyId}>
          Preview
        </button>
        <button className="btn btn-primary" onClick={save} disabled={saving || totals.errors.length > 0}>
          {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}
        </button>
        <button className="btn btn-success" onClick={() => download('pdf')} disabled={!saved}>
          Download PDF
        </button>
        <button className="btn btn-success" onClick={() => download('excel')} disabled={!saved}>
          Download Excel
        </button>
        {!saved && (
          <span className="text-sm text-muted" style={{ alignSelf: 'center' }}>
            Save the invoice to enable downloads.
          </span>
        )}
      </div>

      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Invoice Preview</span>
              <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <TaxInvoicePreview
                invoiceNo={invoiceNo}
                invoiceDate={invoiceDate}
                placeOfSupply={placeOfSupply}
                party={party}
                items={items}
                totals={totals}
                gstMode={gstMode}
                notes={notes}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setShowPreview(false); save(); }}
                disabled={saving || totals.errors.length > 0}>
                {isEdit ? 'Update Invoice' : 'Save Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoiceFormPage;
