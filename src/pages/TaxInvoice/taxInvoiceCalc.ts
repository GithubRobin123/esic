/**
 * Client-side mirror of the server's invoice arithmetic
 * (esics/src/utils/taxInvoiceCalc.ts).
 *
 * This exists purely so the on-screen preview updates instantly as the
 * operator types. It is NEVER the source of truth: the server recomputes
 * every figure from the raw line items before saving and ignores anything
 * the browser sends for totals. If the two ever disagree, the server wins
 * and the saved invoice is the correct one.
 *
 * Keep this algorithm in step with the backend module.
 */

import { GstMode, ItemDraft, GstSlabBreakup } from './taxInvoiceTypes';

export const SUPPLIER_STATE_CODE = '06'; // Haryana — from the supplier GSTIN

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Inter-state unless the party is in the supplier's own state. */
export function resolveGstMode(partyStateCode?: string | null): GstMode {
  const code = (partyStateCode || '').trim();
  return code && code === SUPPLIER_STATE_CODE ? 'cgst_sgst' : 'igst';
}

export interface LocalTotals {
  lineAmounts: number[];
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  round_off: number;
  total_amount: number;
  breakup: GstSlabBreakup[];
  /** Blocking problems — save is disabled while any of these are present. */
  errors: string[];
}

const num = (v: string | number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : NaN;
};

export function computeLocal(items: ItemDraft[], discountRaw: string, gstMode: GstMode): LocalTotals {
  const errors: string[] = [];

  const lineAmounts: number[] = [];
  const parsed = items.map((it, i) => {
    const where = `Line ${i + 1}`;
    const quantity = num(it.quantity);
    const rate = num(it.rate);
    const gst_rate = num(it.gst_rate);

    if (!String(it.description ?? '').trim()) errors.push(`${where}: description is required.`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`${where}: quantity must be greater than 0.`);
    if (!Number.isFinite(rate) || rate < 0) errors.push(`${where}: rate must be 0 or more.`);
    if (!Number.isFinite(gst_rate) || gst_rate < 0 || gst_rate > 100) errors.push(`${where}: GST % must be 0-100.`);

    const amount = Number.isFinite(quantity) && Number.isFinite(rate) ? round2(quantity * rate) : 0;
    lineAmounts.push(amount);
    return { gst_rate: Number.isFinite(gst_rate) ? gst_rate : 0, amount };
  });

  if (items.length === 0) errors.push('Add at least one line item.');

  const subtotal = round2(parsed.reduce((s, p) => s + p.amount, 0));

  let discount = num(discountRaw || '0');
  if (!Number.isFinite(discount)) discount = 0;
  discount = round2(discount);
  if (discount < 0) errors.push('Discount cannot be negative.');
  if (discount > subtotal) errors.push('Discount cannot exceed the subtotal.');

  const safeDiscount = discount >= 0 && discount <= subtotal ? discount : 0;
  const taxable_amount = round2(subtotal - safeDiscount);

  // Group by slab, preserving first-seen order (must match the server).
  const order: number[] = [];
  const grossBySlab = new Map<number, number>();
  for (const p of parsed) {
    if (!grossBySlab.has(p.gst_rate)) { grossBySlab.set(p.gst_rate, 0); order.push(p.gst_rate); }
    grossBySlab.set(p.gst_rate, round2(grossBySlab.get(p.gst_rate)! + p.amount));
  }

  const breakup: GstSlabBreakup[] = [];
  let allocated = 0;
  order.forEach((slab, idx) => {
    const gross = grossBySlab.get(slab)!;
    const isLast = idx === order.length - 1;
    const slabDiscount = isLast
      ? round2(safeDiscount - allocated)
      : subtotal > 0 ? round2((gross / subtotal) * safeDiscount) : 0;
    allocated = round2(allocated + slabDiscount);

    const slabTaxable = round2(gross - slabDiscount);
    const slabTax = round2((slabTaxable * slab) / 100);
    const cgst = gstMode === 'cgst_sgst' ? round2(slabTax / 2) : 0;
    const sgst = gstMode === 'cgst_sgst' ? round2(slabTax - cgst) : 0;

    breakup.push({
      gst_rate: slab,
      taxable_amount: slabTaxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: gstMode === 'igst' ? slabTax : 0,
      total_tax: slabTax,
    });
  });

  const cgst_amount = round2(breakup.reduce((s, b) => s + b.cgst_amount, 0));
  const sgst_amount = round2(breakup.reduce((s, b) => s + b.sgst_amount, 0));
  const igst_amount = round2(breakup.reduce((s, b) => s + b.igst_amount, 0));
  const total_tax = round2(cgst_amount + sgst_amount + igst_amount);

  const beforeRound = round2(taxable_amount + total_tax);
  const total_amount = Math.round(beforeRound);
  const round_off = round2(total_amount - beforeRound);

  return {
    lineAmounts, subtotal, discount, taxable_amount,
    cgst_amount, sgst_amount, igst_amount, total_tax,
    round_off, total_amount, breakup, errors,
  };
}

/** Rupees with Indian digit grouping, e.g. 1234567.5 -> "12,34,567.50" */
export function money(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return '0.00';
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * "2026-09-29" -> "29-09-2026".
 *
 * Split textually rather than via `new Date`, which parses a bare date as UTC
 * midnight and would then show the previous day for viewers west of UTC.
 */
export function fmtDate(value?: string | null): string {
  if (!value) return '-';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

/** Normalises whatever the API returns for a date into "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(value?: string | null): string {
  const s = String(value ?? '');
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const emptyItem = (): ItemDraft => ({
  description: '', hsn_sac: '', quantity: '1', unit: 'NOS', rate: '', gst_rate: '18',
});

/**
 * Adapts a SAVED invoice into the shape the preview component expects.
 *
 * The money values come straight from the database (they are authoritative),
 * while the per-slab breakup is recomputed from the stored line items — the
 * same apportionment the server applies when rendering the PDF.
 */
export function fromSavedInvoice(inv: {
  items: Array<{ description: string; hsn_sac?: string | null; quantity: number; unit?: string | null; rate: number; gst_rate: number; amount: number }>;
  gst_mode: GstMode;
  subtotal: number; discount: number; taxable_amount: number;
  cgst_amount: number; sgst_amount: number; igst_amount: number;
  round_off: number; total_amount: number;
}): { drafts: ItemDraft[]; totals: LocalTotals } {
  const drafts: ItemDraft[] = inv.items.map(it => ({
    description: it.description,
    hsn_sac: it.hsn_sac || '',
    quantity: String(it.quantity),
    unit: it.unit || '',
    rate: String(it.rate),
    gst_rate: String(it.gst_rate),
  }));

  const recomputed = computeLocal(drafts, String(inv.discount ?? 0), inv.gst_mode);

  return {
    drafts,
    totals: {
      ...recomputed,
      // Stored figures win — the preview must show what was actually issued.
      lineAmounts: inv.items.map(it => Number(it.amount)),
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      taxable_amount: Number(inv.taxable_amount),
      cgst_amount: Number(inv.cgst_amount),
      sgst_amount: Number(inv.sgst_amount),
      igst_amount: Number(inv.igst_amount),
      round_off: Number(inv.round_off),
      total_amount: Number(inv.total_amount),
      errors: [],
    },
  };
}

// ─── Amount in words ─────────────────────────────────────────────────────────
// Mirrors numberToWordsINR in esics/src/utils/invoiceConstants.ts so the
// on-screen preview reads the same as the generated PDF/Excel.

const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function threeDigitsToWords(n: number): string {
  let str = '';
  if (n >= 100) { str += `${ONES[Math.floor(n / 100)]} HUNDRED `; n %= 100; }
  if (n >= 20) { str += `${TENS[Math.floor(n / 10)]} `; n %= 10; }
  if (n > 0) str += `${ONES[n]} `;
  return str.trim();
}

/** 2124 -> "TWO THOUSAND ONE HUNDRED AND TWENTY FOUR" (Indian numbering). */
export function numberToWordsINR(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  if (n === 0) return 'ZERO';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} CRORE`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} LAKH`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} THOUSAND`);
  if (hundred) {
    if (hundred < 100 && parts.length > 0) parts.push(`AND ${threeDigitsToWords(hundred)}`);
    else parts.push(threeDigitsToWords(hundred));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
