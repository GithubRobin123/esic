import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import toast from 'react-hot-toast';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';

// ─── Register User ────────────────────────────────────────────────────────────
export const RegisterUserPage: React.FC = () => {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: 'user', profile_id: '' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { hasRole } = useAuth();

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<{ id: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetting, setResetting] = useState(false);
  // Track which rows have password visible
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());
  const togglePwVisible = (id: string) => setVisiblePw(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const loadUsers = () => api.get('/users').then(r => setUsers(r.data)).catch(() => {});

  useEffect(() => {
    api.get('/profiles').then(r => setProfiles(r.data));
    loadUsers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.full_name) { toast.error('Username, password, full name required'); return; }
    setSaving(true);
    try {
      await api.post('/users/register', form);
      toast.success(`User "${form.username}" created`);
      setForm({ username: '', password: '', full_name: '', email: '', role: 'user', profile_id: '' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setResetting(true);
    try {
      await api.put(`/users/${resetTarget.id}/reset-password`, { new_password: newPassword });
      toast.success(`Password reset for "${resetTarget.username}"`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setResetting(false); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="page-container">
      <h1 className="page-title">Register User</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">New User</span></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Username <span className="required">*</span></label>
                <input className="form-control" value={form.username} onChange={e => f('username', e.target.value)} placeholder="lowercase, no spaces" />
              </div>
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <input className="form-control" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="min 6 chars" />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-control" value={form.full_name} onChange={e => f('full_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={e => f('role', e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {hasRole(['master_admin']) && <option value="master_admin">Master Admin</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Profile / Company</label>
                <select className="form-control" value={form.profile_id} onChange={e => f('profile_id', e.target.value)}>
                  <option value="">None</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.profile_code} - {p.company_name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">All Users ({users.length})</span></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Profile</th>
                  <th>Active</th>
                  <th>Created</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="font-mono">{u.username}</td>
                    <td>{u.full_name}</td>
                    <td><span className={`badge ${u.role === 'master_admin' ? 'badge-danger' : u.role === 'admin' ? 'badge-warning' : 'badge-gray'}`}>{u.role}</span></td>
                    <td className="text-muted text-sm">{u.profile_code || '—'}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-muted text-sm">{fmtDate(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="font-mono" style={{ fontSize: 13, letterSpacing: visiblePw.has(u.id) ? 0 : 2 }}>
                          {visiblePw.has(u.id) ? (u.password_plain || '—') : (u.password_plain ? '••••••••' : '—')}
                        </span>
                        {u.password_plain && (
                          <button
                            type="button"
                            onClick={() => togglePwVisible(u.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 2px', color: 'var(--text-muted)' }}
                            title={visiblePw.has(u.id) ? 'Hide password' : 'Show password'}
                          >
                            {visiblePw.has(u.id) ? '🙈' : '👁'}
                          </button>
                        )}
                        <button
                          className="btn-link"
                          style={{ fontSize: 11 }}
                          onClick={() => { setResetTarget({ id: u.id, username: u.username }); setNewPassword(''); setShowPw(false); }}
                        >
                          Set
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setResetTarget(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Set Password — <span className="font-mono">{resetTarget.username}</span></span>
              <button className="modal-close" onClick={() => setResetTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoFocus
                    style={{ paddingRight: 70 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResetTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>
                {resetting ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Register Profile ─────────────────────────────────────────────────────────
const EMPTY_PROFILE_FORM = {
  user_id: '',
  icegate_code: '',
  pan_number: '',
  user_prefix: '',
  consol_agent_id: '',
  user_email: '',
  agent_name: '',
  address1: '',
  address2: '',
  gstin: '',
  billing_company: '',
  billing_state: '',
  gst_rate: '',
  pan_for_invoice: '',
  air_igm_rate: '',
  sea_consol_lcl_rate: '',
  sea_consol_fcl_rate: '',
  air_manifest_rate: '',
  air_manifest_min_bill: '',
  location_code: '',
  // legacy fields still needed
  profile_code: '',
  company_name: '',
  carn_number: '',
  customs_house_code: '',
};

const ACC_LOC_LIST = [
  { code: 'INDEL4', label: 'ACC Delhi' }, { code: 'INBOM4', label: 'ACC SAHAR (Mumbai)' },
  { code: 'INMAA4', label: 'ACC Chennai' }, { code: 'INCCU4', label: 'ACC Kolkata' },
  { code: 'INBLR4', label: 'ACC Bangalore' }, { code: 'INAMD4', label: 'ACC Ahmedabad' },
  { code: 'INHYD4', label: 'ACC Hyderabad' }, { code: 'INTVJ4', label: 'ACC Trivandrum' },
  { code: 'INJPR4', label: 'ACC Jaipur' }, { code: 'INGOI4', label: 'ACC Goa' },
  { code: 'INATQ4', label: 'ACC Amritsar' }, { code: 'INCOK4', label: 'ACC Cochin' },
  { code: 'INCJB4', label: 'ACC Coimbatore' }, { code: 'INVTZ4', label: 'ACC Vishakhapatnam' },
];

export const RegisterProfilePage: React.FC = () => {
  const [form, setForm] = useState({ ...EMPTY_PROFILE_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchUserId, setSearchUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfiles = () => api.get('/profiles').then(r => {
    setProfiles(r.data); setFilteredProfiles(r.data);
  });

  useEffect(() => {
    loadProfiles();
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleSearch = () => {
    if (!searchUserId) { setFilteredProfiles(profiles); return; }
    const u = users.find(x => x.id === searchUserId);
    if (!u) { setFilteredProfiles([]); return; }
    setFilteredProfiles(profiles.filter(p => (p as any).user_id === searchUserId || p.profile_code === u.username));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name) { toast.error('Agent Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/profiles/${editingId}`, form);
        toast.success('Profile updated');
      } else {
        await api.post('/profiles', form);
        toast.success('Profile created');
      }
      setForm({ ...EMPTY_PROFILE_FORM });
      setEditingId(null);
      loadProfiles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleEdit = (p: Profile) => {
    setEditingId(p.id);
    setForm({
      user_id: (p as any).user_id || '',
      icegate_code: p.icegate_code || '',
      pan_number: p.pan_number || '',
      user_prefix: p.user_prefix || '',
      consol_agent_id: p.consol_agent_id || '',
      user_email: p.user_email || '',
      agent_name: (p as any).agent_name || '',
      address1: p.address1 || '',
      address2: p.address2 || '',
      gstin: p.gstin || '',
      billing_company: p.billing_company || '',
      billing_state: p.billing_state || '',
      gst_rate: String(p.gst_rate || ''),
      pan_for_invoice: p.pan_for_invoice || '',
      air_igm_rate: String(p.air_igm_rate || ''),
      sea_consol_lcl_rate: String(p.sea_consol_lcl_rate || ''),
      sea_consol_fcl_rate: String(p.sea_consol_fcl_rate || ''),
      air_manifest_rate: String(p.air_manifest_rate || ''),
      air_manifest_min_bill: String(p.air_manifest_min_bill || ''),
      location_code: p.location_code || '',
      profile_code: p.profile_code || '',
      company_name: p.company_name || '',
      carn_number: p.carn_number || '',
      customs_house_code: p.customs_house_code || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this profile?')) return;
    try {
      await api.delete(`/profiles/${id}`);
      toast.success('Profile deleted');
      loadProfiles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const GST_RATES = ['0', '5', '12', '18', '28'];

  return (
    <div className="page-container">
      <h1 className="page-title">Add New Profile</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '560px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">New Company Profile</span></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              {/* Row 1: User + Location */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">User</label>
                  <select className="form-control" value={form.user_id} onChange={e => f('user_id', e.target.value)}>
                    <option value="">Select User...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-control" value={form.location_code} onChange={e => f('location_code', e.target.value)}>
                    <option value="">Select Location...</option>
                    {ACC_LOC_LIST.map(l => <option key={l.code} value={l.code}>{l.code} — {l.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: ICEGATE ID + Pan No */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">ICEGATE ID</label>
                  <input className="form-control font-mono" value={form.icegate_code} onChange={e => f('icegate_code', e.target.value.toUpperCase())} placeholder="ICEGATE ID" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pan No.</label>
                  <input className="form-control font-mono" value={form.pan_number} onChange={e => f('pan_number', e.target.value.toUpperCase())} placeholder="e.g. AAACE3803E" maxLength={10} />
                </div>
              </div>

              {/* Row 3: User Prefix + Control NO */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">User Prefix</label>
                  <input className="form-control font-mono" value={form.user_prefix} onChange={e => f('user_prefix', e.target.value.toUpperCase())} placeholder="ENTER CONTROL NO." maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Control NO. (CONSOL AGENT ID)</label>
                  <input className="form-control font-mono" value={form.consol_agent_id} onChange={e => f('consol_agent_id', e.target.value.toUpperCase())} placeholder="ENTER CONSOL AGENT ID" />
                </div>
              </div>

              {/* Row 4: User Email */}
              <div className="form-group">
                <label className="form-label">User Email</label>
                <input className="form-control" type="email" value={form.user_email} onChange={e => f('user_email', e.target.value)} placeholder="email@example.com" />
              </div>

              {/* Row 5: Agent Name */}
              <div className="form-group">
                <label className="form-label">Agent Name <span className="required">*</span></label>
                <input className="form-control" value={form.company_name} onChange={e => f('company_name', e.target.value)} placeholder="Company / Agent Name" />
              </div>

              {/* Row 6: Address1 + Address2 */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Address1</label>
                  <textarea className="form-control" value={form.address1} onChange={e => f('address1', e.target.value)} rows={2} placeholder="Address Line 1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address2</label>
                  <textarea className="form-control" value={form.address2} onChange={e => f('address2', e.target.value)} rows={2} placeholder="Address Line 2" />
                </div>
              </div>

              {/* Row 7: GSTIN + Billing Company */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input className="form-control font-mono" value={form.gstin} onChange={e => f('gstin', e.target.value.toUpperCase())} placeholder="GST Number" maxLength={15} />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Company</label>
                  <input className="form-control" value={form.billing_company} onChange={e => f('billing_company', e.target.value)} placeholder="Billing Company Name" />
                </div>
              </div>

              {/* Row 8: Billing State + GST + Pan For Invoice */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Billing State</label>
                  <input className="form-control" value={form.billing_state} onChange={e => f('billing_state', e.target.value)} placeholder="State" />
                </div>
                <div className="form-group">
                  <label className="form-label">GST (%)</label>
                  <select className="form-control" value={form.gst_rate} onChange={e => f('gst_rate', e.target.value)}>
                    <option value="">Select GST...</option>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pan For Invoice</label>
                <input className="form-control font-mono" value={form.pan_for_invoice} onChange={e => f('pan_for_invoice', e.target.value.toUpperCase())} placeholder="PAN for Invoice" maxLength={10} />
              </div>

              {/* Rates section */}
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate Configuration</div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Air IGM Rate</label>
                    <input className="form-control" type="number" step="0.01" value={form.air_igm_rate} onChange={e => f('air_igm_rate', e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sea Consol LCL Rate</label>
                    <input className="form-control" type="number" step="0.01" value={form.sea_consol_lcl_rate} onChange={e => f('sea_consol_lcl_rate', e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Sea Consol FCL Rate</label>
                    <input className="form-control" type="number" step="0.01" value={form.sea_consol_fcl_rate} onChange={e => f('sea_consol_fcl_rate', e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Air Manifest Rate</label>
                    <input className="form-control" type="number" step="0.01" value={form.air_manifest_rate} onChange={e => f('air_manifest_rate', e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Air Manifest Minimum Bill</label>
                  <input className="form-control" type="number" step="0.01" value={form.air_manifest_min_bill} onChange={e => f('air_manifest_min_bill', e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Profile' : 'Save'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm({ ...EMPTY_PROFILE_FORM }); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="card-title" style={{ marginRight: 'auto' }}>Profiles ({filteredProfiles.length})</span>
            <label className="form-label" style={{ margin: 0 }}>Find by User:</label>
            <select className="form-control" style={{ width: 180 }} value={searchUserId} onChange={e => setSearchUserId(e.target.value)}>
              <option value="">Select User Name</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearchUserId(''); setFilteredProfiles(profiles); }}>Clear</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>User Email</th>
                  <th>Sender ID</th>
                  <th>Receiver ID</th>
                  <th>Control No</th>
                  <th>Pan No.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted" style={{ padding: '32px 0' }}>No profiles yet</td></tr>
                )}
                {filteredProfiles.map(p => {
                  const locLabel = ACC_LOC_LIST.find(l => l.code === p.location_code)?.label || p.location_code || '—';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.company_name}</td>
                      <td className="text-sm">{locLabel}</td>
                      <td className="text-sm">{p.user_email || '—'}</td>
                      <td className="font-mono text-sm">{p.consol_agent_id || '—'}</td>
                      <td className="font-mono text-sm">{p.customs_house_code || p.location_code || '—'}</td>
                      <td className="font-mono text-sm">{p.user_prefix || '—'}</td>
                      <td className="font-mono text-sm">{p.pan_number || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn-link" onClick={() => handleEdit(p)}>EDIT</button>
                        <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
                        <button className="btn-link danger" onClick={() => handleDelete(p.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current_password || !form.new_password) { toast.error('All fields required'); return; }
    if (form.new_password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: form.current_password, new_password: form.new_password });
      toast.success('Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Change Password</h1>
      <div className="card" style={{ maxWidth: 400 }}>
        <div className="card-header"><span className="card-title">Update Your Password</span></div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Current Password <span className="required">*</span></label>
              <input className="form-control" type="password" value={form.current_password} onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password <span className="required">*</span></label>
              <input className="form-control" type="password" value={form.new_password} onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password <span className="required">*</span></label>
              <input className="form-control" type="password" value={form.confirm_password} onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Statement By Consol User ─────────────────────────────────────────────────
export const StatementConsolPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/statement-by-consol');
      setRows(r.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-container">
      <h1 className="page-title">Statement By Consol User</h1>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="card-title">Profile Summary ({rows.length})</span>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Profile Code</th>
                <th>Company Name</th>
                <th>CARN Number</th>
                <th>Total MAWBs</th>
                <th>Total HAWBs</th>
                <th>Total Packages</th>
                <th>Total Weight (kg)</th>
                <th>Transmissions</th>
                <th>Last Transmission</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={10} className="text-center text-muted" style={{ padding: '40px 0' }}>No data found</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.profile_id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td><span className="badge badge-info font-mono">{r.profile_code}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.company_name}</td>
                  <td className="font-mono text-sm">{r.carn_number || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{r.total_mawbs}</td>
                  <td style={{ textAlign: 'center' }}>{r.total_hawbs}</td>
                  <td style={{ textAlign: 'right' }}>{r.total_packages}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.total_weight).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-success">{r.total_transmissions}</span>
                  </td>
                  <td className="text-muted text-sm">
                    {fmtDateTime(r.last_transmission)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Statement With HAWB ──────────────────────────────────────────────────────
export const StatementHawbPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from_date: '', to_date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      const r = await api.get('/reports/statement-with-hawb', { params });
      setRows(r.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const f = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  // Group rows by mawb_no for display
  const grouped: Record<string, any[]> = {};
  rows.forEach(r => {
    if (!grouped[r.mawb_no]) grouped[r.mawb_no] = [];
    grouped[r.mawb_no].push(r);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Statement With HAWB</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={filters.from_date} onChange={e => f('from_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={filters.to_date} onChange={e => f('to_date', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Search'}</button>
            <button className="btn btn-secondary" onClick={() => setFilters({ from_date: '', to_date: '' })}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">MAWB + HAWB Statement ({Object.keys(grouped).length} MAWBs, {rows.filter(r => r.hawb_no).length} HAWBs)</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>MAWB / HAWB No.</th>
                <th>Profile</th>
                <th>Origin</th>
                <th>Dest</th>
                <th>Flight</th>
                <th>Packages</th>
                <th>Weight (kg)</th>
                <th>Consignee</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(grouped).length === 0 && !loading && (
                <tr><td colSpan={11} className="text-center text-muted" style={{ padding: '40px 0' }}>No data found</td></tr>
              )}
              {Object.entries(grouped).map(([mawbNo, mawbRows]) => (
                <React.Fragment key={mawbNo}>
                  <tr style={{ background: 'var(--bg-light, #f8fafc)' }}>
                    <td colSpan={11} style={{ padding: '6px 12px' }}>
                      <strong className="font-mono">{mawbNo}</strong>
                      <span className="text-muted text-sm" style={{ marginLeft: 12 }}>
                        {mawbRows[0].profile_code} — {mawbRows[0].company_name}
                      </span>
                      <span className={`badge ${mawbRows[0].mawb_status === 'transmitted' ? 'badge-success' : 'badge-gray'}`} style={{ marginLeft: 8 }}>
                        {mawbRows[0].mawb_status}
                      </span>
                    </td>
                  </tr>
                  {mawbRows.map((r, i) => r.hawb_no ? (
                    <tr key={i} style={{ background: '#fff' }}>
                      <td style={{ paddingLeft: 28 }}>
                        <span className="text-muted" style={{ marginRight: 4 }}>↳</span>
                        <span className="font-mono text-sm">{r.hawb_no}</span>
                      </td>
                      <td className="text-muted text-sm">{r.profile_code}</td>
                      <td className="font-mono text-sm">{r.origin}</td>
                      <td className="font-mono text-sm">{r.destination}</td>
                      <td className="font-mono text-sm">{r.flight_no || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{r.total_packages}</td>
                      <td style={{ textAlign: 'right' }}>{Number(r.gross_weight).toFixed(2)}</td>
                      <td className="text-sm" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.consignee_name || '—'}</td>
                      <td className="text-muted text-sm" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.item_description || '—'}</td>
                      <td className="text-sm">{fmtDate(r.hawb_date)}</td>
                      <td>—</td>
                    </tr>
                  ) : (
                    <tr key={`${i}-nomawb`} style={{ background: '#fff' }}>
                      <td colSpan={11} style={{ padding: '4px 28px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>No HAWBs attached</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Download File ────────────────────────────────────────────────────────────
export const DownloadFilePage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['master_admin', 'admin']);
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterMawbNo, setFilterMawbNo] = useState('');

  useEffect(() => {
    if (isAdmin) api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (isAdmin && filterUserId) params.user_id = filterUserId;
      if (filterMawbNo) params.mawb_no = filterMawbNo;
      const r = await api.get('/reports/download-files', { params });
      setRows(r.data);
    } catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  }, [filterUserId, filterMawbNo, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (id: string, fileName: string) => {
    setDownloading(id);
    try {
      const r = await api.get(`/reports/download-files/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileName}`);
    } catch { toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Download Transmitted Files</h1>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">User</label>
              <select
                className="form-control"
                style={{ minWidth: 160 }}
                value={filterUserId}
                onChange={e => setFilterUserId(e.target.value)}
                disabled={!isAdmin}
              >
                <option value="">{isAdmin ? 'All Users' : 'My Files Only'}</option>
                {isAdmin && users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">MAWB No.</label>
              <input
                className="form-control font-mono"
                style={{ width: 180 }}
                value={filterMawbNo}
                onChange={e => setFilterMawbNo(e.target.value)}
                placeholder="Search MAWB..."
              />
            </div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setFilterUserId(''); setFilterMawbNo(''); }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="card-title">Transmitted Files ({rows.length})</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>File Name</th>
                <th>Type</th>
                <th>MAWB No.</th>
                <th>Sent At</th>
                {isAdmin && <th>Sent By</th>}
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center text-muted" style={{ padding: '40px 0' }}>No transmitted files found</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td className="font-mono text-sm">{r.file_name}</td>
                  <td><span className="badge badge-info font-mono">{r.transmission_type}</span></td>
                  <td className="font-mono">{r.mawb_no || '—'}</td>
                  <td className="text-sm">{fmtDateTime(r.sent_at)}</td>
                  {isAdmin && <td className="text-muted text-sm">{r.username || '—'}</td>}
                  <td>
                    <span className={`badge ${r.status === 'success' ? 'badge-success' : r.status === 'error' ? 'badge-danger' : 'badge-gray'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '3px 12px', fontSize: 12 }}
                      onClick={() => handleDownload(r.id, r.file_name)}
                      disabled={downloading === r.id}
                    >
                      {downloading === r.id ? '...' : '↓ Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Change Invoice No. ───────────────────────────────────────────────────────
export const ChangeInvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNo, setNewNo] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/invoices');
      setInvoices(r.data);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setNewNo(inv.invoice_no);
  };

  const saveChange = async (inv: any) => {
    if (!newNo.trim()) { toast.error('Invoice No. cannot be empty'); return; }
    if (newNo === inv.invoice_no) { setEditingId(null); return; }
    setSaving(true);
    try {
      await api.put(`/reports/invoices/${inv.id}`, { ...inv, invoice_no: newNo });
      toast.success(`Invoice No. changed to ${newNo}`);
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Change Invoice No.</h1>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="card-title">Invoices ({invoices.length})</span>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Current Invoice No.</th>
                <th>Date</th>
                <th>MAWB No.</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Change To</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && !loading && (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '40px 0' }}>No invoices found</td></tr>
              )}
              {invoices.map((inv, i) => (
                <tr key={inv.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{inv.invoice_no}</td>
                  <td className="text-sm">{fmtDate(inv.invoice_date)}</td>
                  <td className="font-mono">{inv.mawb_no || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{Number(inv.amount).toFixed(2)} {inv.currency}</td>
                  <td>
                    <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {editingId === inv.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="form-control font-mono"
                          style={{ width: 160, padding: '3px 8px' }}
                          value={newNo}
                          onChange={e => setNewNo(e.target.value)}
                          autoFocus
                        />
                        <button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => saveChange(inv)} disabled={saving}>
                          {saving ? '...' : 'Save'}
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-warning" style={{ padding: '3px 12px', fontSize: 12 }} onClick={() => startEdit(inv)}>
                        Edit No.
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
