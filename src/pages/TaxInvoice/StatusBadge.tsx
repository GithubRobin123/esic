import React from 'react';
import { InvoiceStatus } from './taxInvoiceTypes';

const MAP: Record<InvoiceStatus, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'Pending' },
  partial:   { cls: 'badge-info',    label: 'Partially Paid' },
  paid:      { cls: 'badge-success', label: 'Paid' },
  cancelled: { cls: 'badge-gray',    label: 'Cancelled' },
};

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const s = MAP[status] ?? { cls: 'badge-gray', label: String(status) };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export default StatusBadge;
