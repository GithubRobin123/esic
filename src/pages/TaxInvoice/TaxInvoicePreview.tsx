import React from 'react';
import { Party, ItemDraft, GstMode } from './taxInvoiceTypes';
import { LocalTotals, money, fmtDate, numberToWordsINR } from './taxInvoiceCalc';
import { SUPPLIER, BANK } from './supplierDetails';

interface Props {
  invoiceNo: string;
  invoiceDate: string;
  placeOfSupply?: string;
  party?: Partial<Party>;
  items: ItemDraft[];
  totals: LocalTotals;
  gstMode: GstMode;
  notes?: string;
  cancelled?: boolean;
}

const cell: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12 };
const head: React.CSSProperties = {
  ...cell, background: '#f1f5f9', fontWeight: 700, borderBottom: '1px solid #94a3b8',
};
const right: React.CSSProperties = { textAlign: 'right' };

/**
 * On-screen rendition of the invoice, laid out to match the generated PDF.
 * Purely presentational — every figure comes in via props.
 */
const TaxInvoicePreview: React.FC<Props> = ({
  invoiceNo, invoiceDate, placeOfSupply, party, items, totals, gstMode, notes, cancelled,
}) => {
  const isIntra = gstMode === 'cgst_sgst';

  return (
    <div style={{ background: '#fff', color: '#111', padding: 24, border: '1px solid #e2e8f0' }}>
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>TAX INVOICE</h2>
      {cancelled && (
        <div style={{ textAlign: 'center', color: '#b91c1c', fontWeight: 700, marginBottom: 8 }}>
          ** CANCELLED **
        </div>
      )}

      {/* Supplier */}
      <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{SUPPLIER.name}</div>
        {SUPPLIER.addressLines.map((l, i) => (
          <div key={i} style={{ fontSize: 12 }}>{l}</div>
        ))}
        <div style={{ fontSize: 12 }}>GSTIN: {SUPPLIER.gstin}</div>
        <div style={{ fontSize: 12 }}>Mobile: {SUPPLIER.mobile} &nbsp; Email: {SUPPLIER.email}</div>
      </div>

      {/* Bill to + meta */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#475569' }}>BILL TO</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{party?.name || '—'}</div>
          {party?.address1 && <div style={{ fontSize: 12 }}>{party.address1}</div>}
          {party?.address2 && <div style={{ fontSize: 12 }}>{party.address2}</div>}
          {(party?.city || party?.state || party?.pincode) && (
            <div style={{ fontSize: 12 }}>
              {[party?.city, party?.state, party?.pincode].filter(Boolean).join(', ')}
            </div>
          )}
          {party?.gstin && <div style={{ fontSize: 12 }}>GSTIN: {party.gstin}</div>}
          {party?.email && <div style={{ fontSize: 12 }}>Email: {party.email}</div>}
          {party?.phone && <div style={{ fontSize: 12 }}>Phone: {party.phone}</div>}
        </div>

        <div style={{ flex: '0 1 260px', fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Invoice No:</strong><span className="font-mono">{invoiceNo || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Invoice Date:</strong><span>{fmtDate(invoiceDate)}</span>
          </div>
          {placeOfSupply && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Place of Supply:</strong><span>{placeOfSupply}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Tax Type:</strong><span>{isIntra ? 'CGST + SGST' : 'IGST'}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8' }}>
          <thead>
            <tr>
              <th style={{ ...head, width: 30 }}>#</th>
              <th style={head}>Description</th>
              <th style={{ ...head, width: 80 }}>HSN/SAC</th>
              <th style={{ ...head, ...right, width: 60 }}>Qty</th>
              <th style={{ ...head, width: 55 }}>Unit</th>
              <th style={{ ...head, ...right, width: 80 }}>Rate</th>
              <th style={{ ...head, ...right, width: 55 }}>GST%</th>
              <th style={{ ...head, ...right, width: 95 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>{it.description || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                <td style={{ ...cell, fontFamily: 'monospace' }}>{it.hsn_sac || '—'}</td>
                <td style={{ ...cell, ...right }}>{it.quantity || '0'}</td>
                <td style={cell}>{it.unit || '—'}</td>
                <td style={{ ...cell, ...right }}>{money(parseFloat(it.rate) || 0)}</td>
                <td style={{ ...cell, ...right }}>{parseFloat(it.gst_rate) || 0}%</td>
                <td style={{ ...cell, ...right, fontFamily: 'monospace' }}>
                  {money(totals.lineAmounts[i] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <table style={{ fontSize: 12, minWidth: 280 }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 10px', textAlign: 'right' }}>Subtotal</td>
              <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace', minWidth: 100 }}>
                Rs. {money(totals.subtotal)}
              </td>
            </tr>
            {totals.discount > 0 && (
              <tr>
                <td style={{ padding: '3px 10px', textAlign: 'right' }}>Discount</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  - Rs. {money(totals.discount)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '3px 10px', textAlign: 'right' }}>Taxable Value</td>
              <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                Rs. {money(totals.taxable_amount)}
              </td>
            </tr>
            {isIntra ? (
              <>
                <tr>
                  <td style={{ padding: '3px 10px', textAlign: 'right' }}>CGST</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                    Rs. {money(totals.cgst_amount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 10px', textAlign: 'right' }}>SGST</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                    Rs. {money(totals.sgst_amount)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={{ padding: '3px 10px', textAlign: 'right' }}>IGST</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  Rs. {money(totals.igst_amount)}
                </td>
              </tr>
            )}
            {totals.round_off !== 0 && (
              <tr>
                <td style={{ padding: '3px 10px', textAlign: 'right' }}>Round Off</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  {totals.round_off < 0 ? '- ' : ''}Rs. {money(Math.abs(totals.round_off))}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid #94a3b8' }}>
                TOTAL
              </td>
              <td style={{
                padding: '6px 0', textAlign: 'right', fontWeight: 700,
                fontFamily: 'monospace', borderTop: '1px solid #94a3b8',
              }}>
                Rs. {money(totals.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, marginTop: 8 }}>
        <strong>Amount in words:</strong> {numberToWordsINR(totals.total_amount)} RUPEES ONLY
      </div>

      {/* GST slab summary, only when slabs actually differ */}
      {totals.breakup.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>GST Summary</div>
          <table style={{ borderCollapse: 'collapse', border: '1px solid #94a3b8', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={head}>GST %</th>
                <th style={{ ...head, ...right }}>Taxable</th>
                {isIntra ? (
                  <>
                    <th style={{ ...head, ...right }}>CGST</th>
                    <th style={{ ...head, ...right }}>SGST</th>
                  </>
                ) : (
                  <th style={{ ...head, ...right }}>IGST</th>
                )}
              </tr>
            </thead>
            <tbody>
              {totals.breakup.map((b, i) => (
                <tr key={i}>
                  <td style={cell}>{b.gst_rate}%</td>
                  <td style={{ ...cell, ...right }}>{money(b.taxable_amount)}</td>
                  {isIntra ? (
                    <>
                      <td style={{ ...cell, ...right }}>{money(b.cgst_amount)}</td>
                      <td style={{ ...cell, ...right }}>{money(b.sgst_amount)}</td>
                    </>
                  ) : (
                    <td style={{ ...cell, ...right }}>{money(b.igst_amount)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bank + signature */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: 16,
        marginTop: 16, paddingTop: 10, borderTop: '1px solid #cbd5e1', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 700 }}>Bank Details</div>
          <div>Account Holder: {BANK.accountName}</div>
          <div>Account No: {BANK.accountNo}</div>
          <div>IFSC: {BANK.ifsc}</div>
          <div>Branch: {BANK.branch}</div>
          <div>Account Type: {BANK.accountType}</div>
        </div>
        <div style={{ fontSize: 12, textAlign: 'right', minWidth: 180 }}>
          <div>For {SUPPLIER.name}</div>
          <div style={{ marginTop: 44 }}>Authorised Signatory</div>
        </div>
      </div>

      {notes && notes.trim() && (
        <div style={{ fontSize: 11, marginTop: 10 }}>
          <strong>Notes:</strong> {notes}
        </div>
      )}

      <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
        This is a computer-generated invoice.
      </div>
    </div>
  );
};

export default TaxInvoicePreview;
