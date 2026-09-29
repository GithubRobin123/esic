import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PartyPending, DashboardSummary, Party, Creator } from './taxInvoiceTypes';
import {
  dashboardSummary, dashboardByParty, dashboardCreators, listParties,
} from './taxInvoiceApi';
import { money, fmtDate } from './taxInvoiceCalc';
import TaxInvoiceTabs from './TaxInvoiceTabs';

/** Days between a date and today — used to age the oldest unpaid invoice. */
const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};

const Stat: React.FC<{ label: string; value: string; sub?: string; color?: string }> =
  ({ label, value, sub, color }) => (
    <div className="card">
      <div className="card-body">
        <div className="text-sm text-muted">{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
    </div>
  );

const TaxInvoiceDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byParty, setByParty] = useState<PartyPending[]>([]);
  const [loading, setLoading] = useState(true);

  const [createdBy, setCreatedBy] = useState('');
  const [partyId, setPartyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [onlyPending, setOnlyPending] = useState(true);

  const [parties, setParties] = useState<Party[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    listParties().then(setParties).catch(() => {});
    dashboardCreators().then(setCreators).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const filters = {
      created_by: createdBy, party_id: partyId,
      from_date: fromDate, to_date: toDate,
    };
    try {
      const [s, p] = await Promise.all([
        dashboardSummary(filters),
        dashboardByParty({ ...filters, only_pending: onlyPending ? 'true' : 'false' }),
      ]);
      setSummary(s);
      setByParty(p);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [createdBy, partyId, fromDate, toDate, onlyPending]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => {
    setCreatedBy(''); setPartyId(''); setFromDate(''); setToDate(''); setOnlyPending(true);
  };

  return (
    <div className="page-container">
      <TaxInvoiceTabs />

      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Payment Dashboard</h1>
          <p className="page-subtitle">Outstanding amounts by party</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tax-invoice/new')}>+ New Invoice</button>
      </div>

      {/* Filters */}
      <div className="card mb-16">
        <div className="card-body">
          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">User (created by)</label>
              <select className="form-control" value={createdBy} onChange={e => setCreatedBy(e.target.value)}>
                <option value="">All users</option>
                {creators.map(c => (
                  <option key={c.id} value={c.id}>{c.username}{c.full_name ? ` — ${c.full_name}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Party</label>
              <select className="form-control" value={partyId} onChange={e => setPartyId(e.target.value)}>
                <option value="">All parties</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
          </div>
          <div className="flex gap-12" style={{ alignItems: 'center' }}>
            <label className="flex gap-8" style={{ alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} />
              Show only parties with a pending balance
            </label>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="form-row-3 mb-16">
          <Stat
            label="Total Invoiced"
            value={`Rs. ${money(summary.total_invoiced)}`}
            sub={`${summary.invoice_count} invoice(s)${summary.cancelled_count ? `, ${summary.cancelled_count} cancelled` : ''}`}
          />
          <Stat
            label="Received"
            value={`Rs. ${money(summary.total_received)}`}
            color="#16a34a"
          />
          <Stat
            label="Pending"
            value={`Rs. ${money(summary.total_pending)}`}
            sub={`${summary.pending_count} invoice(s) outstanding`}
            color={summary.total_pending > 0 ? '#dc2626' : '#16a34a'}
          />
        </div>
      )}

      {/* By party */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Outstanding by Party</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Party</th>
                <th>GSTIN</th>
                <th style={{ textAlign: 'right' }}>Invoices</th>
                <th style={{ textAlign: 'right' }}>Invoiced</th>
                <th style={{ textAlign: 'right' }}>Received</th>
                <th style={{ textAlign: 'right' }}>Pending</th>
                <th>Oldest Unpaid</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-center"><span className="spinner"></span> Loading...</div></td></tr>
              ) : byParty.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-title">
                      {onlyPending ? 'Nothing outstanding' : 'No invoices match these filters'}
                    </div>
                    <p>{onlyPending ? 'Every party is fully paid up.' : 'Try widening the date range.'}</p>
                  </div>
                </td></tr>
              ) : byParty.map(p => {
                const age = daysSince(p.oldest_pending_date);
                return (
                  <tr key={p.party_id || p.party_name}>
                    <td><strong>{p.party_name || '—'}</strong></td>
                    <td className="font-mono text-sm">{p.gstin || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {p.invoice_count}
                      {p.pending_count > 0 && (
                        <span className="text-muted text-sm"> ({p.pending_count} open)</span>
                      )}
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>{money(p.total_invoiced)}</td>
                    <td className="font-mono" style={{ textAlign: 'right', color: '#16a34a' }}>
                      {money(p.total_received)}
                    </td>
                    <td className="font-mono" style={{
                      textAlign: 'right', fontWeight: 700,
                      color: p.total_pending > 0 ? '#dc2626' : '#16a34a',
                    }}>
                      {money(p.total_pending)}
                    </td>
                    <td className="text-sm">
                      {p.oldest_pending_date ? (
                        <>
                          {fmtDate(p.oldest_pending_date)}
                          {age !== null && (
                            <span className={`badge ${age > 60 ? 'badge-danger' : age > 30 ? 'badge-warning' : 'badge-gray'}`}
                              style={{ marginLeft: 6 }}>
                              {age}d
                            </span>
                          )}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {p.party_id && (
                        <button className="btn btn-secondary btn-xs"
                          onClick={() => navigate(`/tax-invoice?party=${p.party_id}`)}>
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxInvoiceDashboardPage;
