/** API calls for the standalone Tax Invoice module. */

import api from '../../utils/api';
import {
  Party, Invoice, InvoiceListRow, PartyPending, DashboardSummary, Creator,
} from './taxInvoiceTypes';

const BASE = '/tax-invoices';

// ─── Parties ────────────────────────────────────────────────────────────────
export const listParties = (search = '') =>
  api.get<Party[]>(`${BASE}/parties`, { params: search ? { search } : {} }).then(r => r.data);

export const createParty = (body: Partial<Party>) =>
  api.post<Party>(`${BASE}/parties`, body).then(r => r.data);

export const updateParty = (id: string, body: Partial<Party>) =>
  api.put<Party>(`${BASE}/parties/${id}`, body).then(r => r.data);

export const deactivateParty = (id: string) =>
  api.delete(`${BASE}/parties/${id}`).then(r => r.data);

// ─── Invoices ───────────────────────────────────────────────────────────────
export interface InvoiceFilters {
  search?: string;
  party_id?: string;
  created_by?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  pageSize?: number;
}

export const nextInvoiceNo = () =>
  api.get<{ invoice_no: string }>(`${BASE}/next-number`).then(r => r.data.invoice_no);

export const listInvoices = (filters: InvoiceFilters) =>
  api.get<{ data: InvoiceListRow[]; total: number; page: number; pageSize: number }>(
    BASE,
    // Strip empty values so the server doesn't receive blank filters
    { params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null)) }
  ).then(r => r.data);

export const getInvoice = (id: string) =>
  api.get<Invoice>(`${BASE}/${id}`).then(r => r.data);

export interface InvoicePayload {
  invoice_no?: string;
  invoice_date: string;
  party_id: string;
  place_of_supply?: string;
  discount?: number;
  notes?: string;
  items: Array<{
    description: string; hsn_sac?: string; quantity: number;
    unit?: string; rate: number; gst_rate: number;
  }>;
}

export const createInvoice = (body: InvoicePayload) =>
  api.post<Invoice>(BASE, body).then(r => r.data);

export const updateInvoice = (id: string, body: InvoicePayload) =>
  api.put<Invoice>(`${BASE}/${id}`, body).then(r => r.data);

export const cancelInvoice = (id: string) =>
  api.post<Invoice>(`${BASE}/${id}/cancel`).then(r => r.data);

export const deleteInvoice = (id: string) =>
  api.delete(`${BASE}/${id}`).then(r => r.data);

// ─── Payments ───────────────────────────────────────────────────────────────
export const addPayment = (
  id: string,
  body: { amount: number; paid_on?: string; method?: string; reference?: string; notes?: string }
) => api.post<Invoice>(`${BASE}/${id}/payments`, body).then(r => r.data);

export const removePayment = (invoiceId: string, paymentId: string) =>
  api.delete<Invoice>(`${BASE}/${invoiceId}/payments/${paymentId}`).then(r => r.data);

// ─── Dashboard ──────────────────────────────────────────────────────────────
export interface DashboardFilters {
  party_id?: string;
  created_by?: string;
  from_date?: string;
  to_date?: string;
  only_pending?: string;
}

const cleanParams = (f: Record<string, any>) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v != null));

export const dashboardSummary = (f: DashboardFilters) =>
  api.get<DashboardSummary>(`${BASE}/dashboard/summary`, { params: cleanParams(f) }).then(r => r.data);

export const dashboardByParty = (f: DashboardFilters) =>
  api.get<PartyPending[]>(`${BASE}/dashboard/by-party`, { params: cleanParams(f) }).then(r => r.data);

export const dashboardCreators = () =>
  api.get<Creator[]>(`${BASE}/dashboard/creators`).then(r => r.data);

// ─── Downloads ──────────────────────────────────────────────────────────────

/**
 * Downloads a generated file.
 *
 * These endpoints require the bearer token, so a plain <a href> can't be used —
 * the file is fetched as a blob and handed to the browser via a temporary
 * object URL, which is then revoked to avoid leaking memory.
 */
async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' });

  const blobUrl = window.URL.createObjectURL(res.data as Blob);
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  }
}

/** Invoice numbers contain '/', which is not valid in a filename. */
const safeName = (invoiceNo: string) => invoiceNo.replace(/[^A-Za-z0-9._-]/g, '-');

export const downloadPdf = (id: string, invoiceNo: string) =>
  downloadBlob(`${BASE}/${id}/pdf`, `${safeName(invoiceNo)}.pdf`);

export const downloadExcel = (id: string, invoiceNo: string) =>
  downloadBlob(`${BASE}/${id}/excel`, `${safeName(invoiceNo)}.xlsx`);

/**
 * Error responses for blob requests arrive as a Blob, not JSON, so the usual
 * `err.response.data.message` is unreadable. This unwraps it.
 */
export async function readApiError(err: any, fallback: string): Promise<string> {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.message || err?.message || fallback;
}
