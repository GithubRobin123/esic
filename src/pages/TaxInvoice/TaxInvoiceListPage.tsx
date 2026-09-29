import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { InvoiceListRow, Party, Creator } from './taxInvoiceTypes';
import {
  listInvoices, listParties, dashboardCreators,
  downloadPdf, downloadExcel, readApiError,
} from './taxInvoiceApi';
import { money, fmtDate } from './taxInvoiceCalc';
import TaxInvoiceTabs from './TaxInvoiceTabs';
import StatusBadge from './StatusBadge';

const PAGE_SIZE = 25;

const TaxInvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [rows, setRows] = useState<InvoiceListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  // Seeded from ?party=<id> so the dashboard can deep-link into a party's invoices.
  const [partyId, setPartyId] = useState(searchParams.get('party') || '');
  const [createdBy, setCreatedBy] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [parties, setParties] = useState<Party[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    listParties().then(setParties).catch(() => {});
    dashboardCreators().then(setCreators).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listInvoices({
        search, party_id: partyId, created_by: createdBy, status,
        from_date: fromDate, to_date: toDate, page, pageSize: PAGE_SIZE,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, partyId, createdBy, status, fromDate, toDate, page]);

  // Debounced so typing in the search box doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // Any filter change puts us back on page 1, otherwise an out-of-range page
  // would show an empty table.
  useEffect(() => { setPage(1); }, [search, partyId, createdBy, status, fromDate, toDate]);

  const clearFilters = () => {
    setSearch(''); setPartyId(''); setCreatedBy(''); setStatus(''); setFromDate(''); setToDate('');
  };

  const grab = async (kind: 'pdf' | 'excel', row: InvoiceListRow) => {
    try {
      if (kind === 'pdf') await downloadPdf(row.id, row.invoice_no);
      else await downloadExcel(row.id, row.invoice_no);
    } catch (e: any) {
      toast.error(await readApiError(e, `Failed to download ${kind.toUpperCase()}`));
    }
  };

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-container">
      <TaxInvoiceTabs />

      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Tax Invoices</h1>
          <p className="page-subtitle">Manually raised GST invoices — {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tax-invoice/new')}>+ New Invoice</button>
      </div>

      <div className="card mb-16">
        <div className="card-body">
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Search</label>
              <input className="form-control" placeholder="Invoice no. or party name"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Party</label>
              <select className="form-control" value={partyId} onChange={e => setPartyId(e.target.value)}>
                <option value="">All parties</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Created By (user)</label>
              <select className="form-control" value={createdBy} onChange={e => setCreatedBy(e.target.value)}>
                <option value="">All users</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={clearFilters} style={{ width: '100%' }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Party</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Received</th>
                <th style={{ textAlign: 'right' }}>Pending</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ width: 190 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="loading-center"><span className="spinner"></span> Loading...</div></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-title">No invoices found</div>
                    <p>Adjust the filters, or create a new invoice.</p>
                  </div>
                </td></tr>
              ) : rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <button className="btn-link font-mono" onClick={() => navigate(`/tax-invoice/${r.id}`)}>
                      {r.invoice_no}
                    </button>
                  </td>
                  <td>{fmtDate(r.invoice_date)}</td>
                  <td>{r.party_snapshot?.name || '—'}</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{money(r.total_amount)}</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{money(r.amount_paid)}</td>
                  <td className="font-mono" style={{
                    textAlign: 'right',
                    color: r.pending_amount > 0 ? '#dc2626' : undefined,
                    fontWeight: r.pending_amount > 0 ? 600 : undefined,
                  }}>
                    {money(r.pending_amount)}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-sm">{r.created_by_username || '—'}</td>
                  <td className="td-actions">
                    <button className="btn btn-secondary btn-xs" onClick={() => navigate(`/tax-invoice/${r.id}`)}>View</button>
                    <button className="btn btn-secondary btn-xs" onClick={() => grab('pdf', r)}>PDF</button>
                    <button className="btn btn-secondary btn-xs" onClick={() => grab('excel', r)}>Excel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="card-body flex-between">
            <span className="text-sm text-muted">
              Page {page} of {lastPage} — {total} invoices
            </span>
            <div className="flex gap-8">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= lastPage}
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxInvoiceListPage;
