import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Please enter credentials'); return; }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/mawb');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 40%, #0369a1 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.2)', marginBottom: 12,
            fontSize: 28, fontWeight: 800, color: '#fff',
          }}>E</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>EDISS</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
            Electronic Data Interchange Shipping System
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <input
                className="form-control"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }}></span> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>
          ICES 1.5 Compliant · Indian Customs EDI System
        </p>
      </div>
    </div>
  );
};

export default Login;
