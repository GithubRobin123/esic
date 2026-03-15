import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import toast from 'react-hot-toast';

// ─── Register User ────────────────────────────────────────────────────────────
export const RegisterUserPage: React.FC = () => {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: 'user', profile_id: '' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { hasRole } = useAuth();

  useEffect(() => {
    api.get('/profiles').then(r => setProfiles(r.data));
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.full_name) { toast.error('Username, password, full name required'); return; }
    setSaving(true);
    try {
      await api.post('/users/register', form);
      toast.success(`User "${form.username}" created`);
      setForm({ username: '', password: '', full_name: '', email: '', role: 'user', profile_id: '' });
      api.get('/users').then(r => setUsers(r.data));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
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
          <div className="card-header"><span className="card-title">All Users</span></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Username</th><th>Full Name</th><th>Role</th><th>Profile</th><th>Active</th><th>Created</th></tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="font-mono">{u.username}</td>
                    <td>{u.full_name}</td>
                    <td><span className={`badge ${u.role === 'master_admin' ? 'badge-danger' : u.role === 'admin' ? 'badge-warning' : 'badge-gray'}`}>{u.role}</span></td>
                    <td className="text-muted">{u.profile_code || '—'}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-muted text-sm">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Register Profile ─────────────────────────────────────────────────────────
export const RegisterProfilePage: React.FC = () => {
  const [form, setForm] = useState({ profile_code: '', company_name: '', address: '', city: '', state: '', country: 'India', phone: '', email: '', carn_number: '', customs_house_code: '', icegate_code: '' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/profiles').then(r => setProfiles(r.data)); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profile_code || !form.company_name) { toast.error('Profile code and company name required'); return; }
    setSaving(true);
    try {
      await api.post('/profiles', form);
      toast.success('Profile created');
      setForm({ profile_code: '', company_name: '', address: '', city: '', state: '', country: 'India', phone: '', email: '', carn_number: '', customs_house_code: '', icegate_code: '' });
      api.get('/profiles').then(r => setProfiles(r.data));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="page-container">
      <h1 className="page-title">Register Profile</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">New Company Profile</span></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Profile Code <span className="required">*</span></label>
                  <input className="form-control font-mono" value={form.profile_code} onChange={e => f('profile_code', e.target.value.toUpperCase())} placeholder="e.g. INDEL4" maxLength={20} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customs House Code</label>
                  <input className="form-control font-mono" value={form.customs_house_code} onChange={e => f('customs_house_code', e.target.value.toUpperCase())} placeholder="e.g. INDEL4" maxLength={6} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <input className="form-control" value={form.company_name} onChange={e => f('company_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CARN Number (16-digit PAN-based)</label>
                <input className="form-control font-mono" value={form.carn_number} onChange={e => f('carn_number', e.target.value)} placeholder="e.g. AGSYE7618HCNDEL4" maxLength={16} />
              </div>
              <div className="form-group">
                <label className="form-label">ICEGATE Code</label>
                <input className="form-control font-mono" value={form.icegate_code} onChange={e => f('icegate_code', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" value={form.address} onChange={e => f('address', e.target.value)} rows={2} />
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={e => f('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-control" value={form.state} onChange={e => f('state', e.target.value)} />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Creating...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">All Profiles</span></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Profile Code</th><th>Company</th><th>CARN</th><th>Customs Code</th><th>City</th></tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td><span className="badge badge-info font-mono">{p.profile_code}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.company_name}</td>
                    <td className="font-mono text-sm">{p.carn_number || '—'}</td>
                    <td className="font-mono">{p.customs_house_code || '—'}</td>
                    <td className="text-muted">{p.city || '—'}</td>
                  </tr>
                ))}
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
