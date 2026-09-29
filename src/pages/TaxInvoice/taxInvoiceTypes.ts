/** Types for the standalone Tax Invoice module. Kept local to the module. */

export type GstMode = 'cgst_sgst' | 'igst';
export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

export interface Party {
  id: string;
  name: string;
  gstin?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  pincode?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

/** A row in the invoice form. Numbers stay strings while the user is typing. */
export interface ItemDraft {
  description: string;
  hsn_sac: string;
  quantity: string;
  unit: string;
  rate: string;
  gst_rate: string;
}

export interface InvoiceItem {
  id?: string;
  line_no: number;
  description: string;
  hsn_sac?: string | null;
  quantity: number;
  unit?: string | null;
  rate: number;
  gst_rate: number;
  amount: number;
}

export interface GstSlabBreakup {
  gst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax?: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_on: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  created_by_username?: string | null;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  party_id: string | null;
  party_snapshot: Partial<Party>;
  place_of_supply?: string | null;
  gst_mode: GstMode;
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  amount_paid: number;
  pending_amount: number;
  status: InvoiceStatus;
  is_cancelled: boolean;
  notes?: string | null;
  created_by_username?: string | null;
  created_at?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceListRow extends Omit<Invoice, 'items' | 'payments'> {}

export interface PartyPending {
  party_id: string | null;
  party_name: string;
  gstin?: string | null;
  invoice_count: number;
  pending_count: number;
  total_invoiced: number;
  total_received: number;
  total_pending: number;
  oldest_pending_date?: string | null;
}

export interface DashboardSummary {
  invoice_count: number;
  cancelled_count: number;
  pending_count: number;
  total_invoiced: number;
  total_received: number;
  total_pending: number;
}

export interface Creator {
  id: string;
  username: string;
  full_name?: string | null;
}
