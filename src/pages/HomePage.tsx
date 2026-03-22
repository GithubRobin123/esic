import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ICEGATE_ERRORS = [
  { code: '000', desc: 'SUBMITTED JOB SUCCESSFULLY' },
  { code: '001', desc: 'MESSAGE TYPE CAN BE F/A ONLY' },
  { code: '002', desc: 'CONSOL NOT SUBMITTED – AMENDMENT CANNOT BE FILED' },
  { code: '003', desc: 'MASTER HAS ALREADY BEEN SUBMITTED, GO FOR AMENDMENT' },
  { code: '004', desc: 'CARN NO IS NULL' },
  { code: '005', desc: 'CARN NUMBER/AIRLINE CODE NOT REGISTERED' },
  { code: '006', desc: 'MASTER AIRWAY BILL NO IS NULL' },
  { code: '007', desc: 'MASTER NO. HAS WRONG AIRLINE CODE' },
  { code: '008', desc: 'MASTER NO. HAS WRONG CHECK DIGIT' },
  { code: '009', desc: 'MASTER NO. HAS WRONG AIRLINE CODE/CHECK DIGIT' },
  { code: '010', desc: 'MASTER NO. HAS SPECIAL CHARACTER' },
  { code: '011', desc: 'MASTER NO. HAS WRONG AIRLINE CODE/SP.CHAR.EXISTS' },
  { code: '012', desc: 'MASTER NO. HAS WRONG CHECK DIGIT/SP.CHAR.EXISTS' },
  { code: '013', desc: 'MASTER NO. HAS WRONG CHECK DIGIT/AIRLINE CD/SP.CHAR.EXISTS' },
  { code: '014', desc: 'PORT OF ORIGIN IS NULL' },
  { code: '015', desc: 'PORT OF ORIGIN NOT VALID IN CONSOL MASTER' },
  { code: '016', desc: 'PORT OF DESTINATION IS NULL' },
  { code: '017', desc: 'PORT OF DESTINATION NOT VALID IN CONSOL MASTER' },
  { code: '018', desc: 'TOTAL PACKAGE IN CONSOL MASTER CANNOT BE NULL OR ZERO/NEGATIVE' },
  { code: '019', desc: 'GROSS WEIGHT CANNOT BE NULL OR ZERO/NEGATIVE' },
  { code: '020', desc: 'ITEM DESCRIPTION CANNOT BE NULL' },
  { code: '021', desc: 'MESSAGE TYPE CAN BE F/A/D ONLY' },
  { code: '022', desc: 'HOUSE AIRWAY BILL NUMBER NULL' },
  { code: '023', desc: 'HOUSE CONTAINS SPECIAL CHARACTERS' },
  { code: '024', desc: 'PORT OF ORIGIN IS NULL IN HOUSE' },
  { code: '025', desc: 'PORT OF ORIGIN NOT VALID IN CONSOL HOUSE' },
  { code: '026', desc: 'PORT OF DESTINATION IS NULL IN HOUSE' },
  { code: '027', desc: 'PORT OF DESTINATION NOT VALID IN CONSOL HOUSE' },
  { code: '028', desc: 'TOTAL PACKAGES IS NULL/ZERO/NEGATIVE IN HOUSE' },
  { code: '029', desc: 'GROSS WEIGHT IS NULL/ZERO/NEGATIVE IN HOUSE' },
  { code: '030', desc: 'ITEM DESCRIPTION CANNOT BE NULL IN HOUSE' },
  { code: '031', desc: 'SUBMISSION MODE IS NOT VALID IN HOUSE' },
  { code: '032', desc: 'FOUND DUPLICATE HOUSE DETAIL IN HOUSE' },
  { code: '033', desc: 'NO OF PACKAGES AT CONSOL MASTER CANNOT BE MORE THAN CONSOL HOUSES' },
  { code: '034', desc: 'DIFF OF GROSS WT IS MORE/LESS 10% BETWEEN MASTER AND HOUSES LEVELS' },
  { code: '035', desc: 'HOUSE LEVEL DATA IS NOT THREE FOR THIS JOB' },
  { code: '036', desc: 'LATE SUBMISSION – AMENDMENT NO.— DATED — PUT FOR APPROVAL' },
  { code: '037', desc: 'MULTIPLE LINES IN IGM IS THERE – MODIFY THE JOB' },
  { code: '038', desc: 'HAWB DATE CANNOT BE NULL' },
  { code: '039', desc: 'HAWB DATE CANNOT BE NULL' },
];

const USAGE_TIPS = [
  {
    step: 1,
    text: 'Please enter the MAWB details by clicking MAWB > Add MAWB. Similarly you can add the HAWB.',
  },
  {
    step: 2,
    text: 'After completing MAWB/HAWB feeding, select the Checklist option from Report and cross-check all the data carefully.',
  },
  {
    step: 3,
    text: 'If all the MAWB/HAWB details are correct, you may transmit the data to Customs through the Transmit option.',
  },
  {
    step: 4,
    text: 'If you are filing Consol Manifest after the arrival of a Flight, then IGM No and IGM Year are mandatory.',
    highlight: true,
  },
  {
    step: 5,
    text: 'Please check up the status of consols filed with ICEGATE.',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
        borderRadius: 10,
        padding: '24px 32px',
        marginBottom: 28,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Welcome, {user?.full_name || user?.username}
          </div>
          <div style={{ opacity: 0.85, fontSize: 14 }}>
            EDISS — Electronic Data Interchange Shipping System &nbsp;|&nbsp; ICES 1.5 Compliant
          </div>
          {user?.customs_house_code && (
            <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(255,255,255,0.18)', borderRadius: 6, padding: '3px 12px', fontSize: 13, fontFamily: 'monospace' }}>
              Customs House: <strong>{user.customs_house_code}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 600 }} onClick={() => navigate('/mawb/new')}>
            + Add MAWB
          </button>
          <button className="btn" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }} onClick={() => navigate('/hawb/new')}>
            + Add HAWB
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* Quick links */}
        {[
          { label: 'MAWB Entry', icon: '✈', path: '/mawb', color: '#3b82f6' },
          { label: 'HAWB Entry', icon: '📦', path: '/hawb', color: '#10b981' },
          { label: 'Checklist Report', icon: '✅', path: '/report/checklist', color: '#f59e0b' },
          { label: 'Transmit / CGM', icon: '📡', path: '/transmission/generate', color: '#8b5cf6' },
        ].map(q => (
          <button
            key={q.path}
            onClick={() => navigate(q.path)}
            style={{
              background: '#fff',
              border: `1px solid #e5e7eb`,
              borderLeft: `4px solid ${q.color}`,
              borderRadius: 8,
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 15,
              fontWeight: 600,
              color: '#1f2937',
              textAlign: 'left',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <span style={{ fontSize: 26 }}>{q.icon}</span>
            {q.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Usage Tips */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ textDecoration: 'underline' }}>Usage Tips</span>
          </div>
          <div className="card-body">
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {USAGE_TIPS.map(tip => (
                <li key={tip.step} style={{
                  display: 'flex',
                  gap: 14,
                  marginBottom: 16,
                  padding: tip.highlight ? '10px 12px' : '0',
                  background: tip.highlight ? '#fef9c3' : 'transparent',
                  border: tip.highlight ? '1px solid #fde047' : 'none',
                  borderRadius: tip.highlight ? 6 : 0,
                }}>
                  <span style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: tip.highlight ? '#eab308' : 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}>{tip.step}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.55, color: '#374151', fontWeight: tip.highlight ? 600 : 400 }}>
                    {tip.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ICEGATE Error Codes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">ICEGATE Response Codes</span>
          </div>
          <div className="table-wrapper" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>CODE</th>
                  <th>ERROR DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {ICEGATE_ERRORS.map(e => (
                  <tr key={e.code} style={{ background: e.code === '000' ? '#f0fdf4' : undefined }}>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: e.code === '000' ? '#16a34a' : '#374151' }}>
                      {e.code}
                    </td>
                    <td style={{ fontSize: 13, color: e.code === '000' ? '#16a34a' : '#374151', fontWeight: e.code === '000' ? 600 : 400 }}>
                      {e.desc}
                    </td>
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

export default HomePage;
