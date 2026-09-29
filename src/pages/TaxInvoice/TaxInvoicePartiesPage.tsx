import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Party } from './taxInvoiceTypes';
import { listParties, createParty, updateParty, deactivateParty } from './taxInvoiceApi';
import { INDIA_STATES, stateByCode, stateByName } from './indiaStates';
import { SUPPLIER_STATE_CODE } from './taxInvoiceCalc';
import TaxInvoiceTabs from './TaxInvoiceTabs';

const blank = (): Partial<Party> => ({
  name: '', gstin: '', address1: '', address2: '',
  city: '', state: '', state_code: '', pincode: '', email: '', phone: '',
});

const TaxInvoicePartiesPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Party>>(blank());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      setParties(await listParties(q));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  // Debounce the search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const f = (k: keyof Party, v: any) => setForm(p => ({ ...p, [k]: v }));

  /** GSTIN carries the state code in its first two digits — keep state in step. */
  const onGstinChange = (raw: string) => {
    const gstin = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setForm(p => {
      const next: Partial<Party> = { ...p, gstin };
      if (gstin.length >= 2) {
        const st = stateByCode(gstin.slice(0, 2));
        if (st) { next.state_code = st.code; next.state = st.name; }
      }
      return next;
    });
  };

  const onStateChange = (code: string) => {
    const st = stateByCode(code);
    setForm(p => ({ ...p, state_code: code, state: st?.name || '' }));
  };

  const openAdd = () => { setEditingId(null); setForm(blank()); setShowModal(true); };

  const openEdit = (p: Party) => {
    setEditingId(p.id);
    setForm({
      ...p,
      // Older rows may have a state name but no code — backfill it in the form.
      state_code: p.state_code || stateByName(p.state)?.code || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!String(form.name ?? '').trim()) { toast.error('Party name is required'); return; }
    const gstin = String(form.gstin ?? '').trim();
    if (gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)) {
      toast.error('GSTIN must be 15 characters (2 digits then 13 letters/digits)');
      return;
    }
    if (!gstin && !form.state_code) {
      toast.error('Pick a state — it decides whether CGST+SGST or IGST applies');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateParty(editingId, form);
        toast.success('Party updated');
      } else {
        await createParty(form);
        toast.success('Party added');
      }
      setShowModal(false);
      load(search);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save party');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Party) => {
    if (!window.confirm(`Deactivate "${p.name}"?\n\nExisting invoices keep their own copy of the billing details and are not affected.`)) return;
    try {
      await deactivateParty(p.id);
      toast.success('Party deactivated');
      load(search);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to deactivate');
    }
  };

  return (
    <div className="page-container">
      <TaxInvoiceTabs />

      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Invoice Parties</h1>
          <p className="page-subtitle">Customers you raise tax invoices for</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Party</button>
      </div>

      <div className="card mb-16">
        <div className="card-body">
          <input
            className="form-control"
            placeholder="Search by name or GSTIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>City</th>
                <th>Contact</th>
                <th>Tax</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-center"><span className="spinner"></span> Loading...</div></td></tr>
              ) : parties.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-title">No parties yet</div>
                    <p>Add a party to start raising invoices.</p>
                  </div>
                </td></tr>
              ) : parties.map(p => {
                const intra = (p.state_code || '') === SUPPLIER_STATE_CODE;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td className="font-mono text-sm">{p.gstin || <span className="text-muted">—</span>}</td>
                    <td>{p.state || <span className="text-muted">—</span>}</td>
                    <td>{p.city || <span className="text-muted">—</span>}</td>
                    <td className="text-sm">
                      {p.email || ''}{p.email && p.phone ? <br /> : null}{p.phone || ''}
                      {!p.email && !p.phone && <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${intra ? 'badge-info' : 'badge-gray'}`}>
                        {intra ? 'CGST+SGST' : 'IGST'}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button className="btn btn-secondary btn-xs" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-xs" onClick={() => remove(p)}>Deactivate</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingId ? 'Edit Party' : 'Add Party'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Party Name <span className="required">*</span></label>
                <input className="form-control" value={form.name || ''} maxLength={200}
                  onChange={e => f('name', e.target.value)} placeholder="Registered business name" />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input className="form-control font-mono" value={form.gstin || ''} maxLength={15}
                    onChange={e => onGstinChange(e.target.value)} placeholder="27AABCU9603R1ZX" />
                  <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                    Leave blank for an unregistered party, then pick the state below.
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">State <span className="required">*</span></label>
                  <select className="form-control" value={form.state_code || ''}
                    onChange={e => onStateChange(e.target.value)}>
                    <option value="">— Select State —</option>
                    {INDIA_STATES.map(s => (
                      <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 1</label>
                <input className="form-control" value={form.address1 || ''} maxLength={200}
                  onChange={e => f('address1', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address Line 2</label>
                <input className="form-control" value={form.address2 || ''} maxLength={200}
                  onChange={e => f('address2', e.target.value)} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city || ''} maxLength={100}
                    onChange={e => f('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input className="form-control" value={form.pincode || ''} maxLength={10}
                    onChange={e => f('pincode', e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email || ''} maxLength={150}
                    onChange={e => f('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone || ''} maxLength={30}
                    onChange={e => f('phone', e.target.value)} />
                </div>
              </div>

              {form.state_code && (
                <div className="alert alert-info">
                  This party will be taxed as{' '}
                  <strong>{form.state_code === SUPPLIER_STATE_CODE ? 'CGST + SGST' : 'IGST'}</strong>
                  {form.state_code === SUPPLIER_STATE_CODE
                    ? ' (same state as the supplier).'
                    : ' (inter-state supply).'}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Party' : 'Add Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoicePartiesPage;
