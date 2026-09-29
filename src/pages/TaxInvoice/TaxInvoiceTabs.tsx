import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Sub-navigation shared by every page in the Tax Invoice module. */
const TABS: Array<{ label: string; path: string; exact?: boolean }> = [
  { label: 'Invoices', path: '/tax-invoice', exact: true },
  { label: 'New Invoice', path: '/tax-invoice/new' },
  { label: 'Parties', path: '/tax-invoice/parties' },
  { label: 'Payment Dashboard', path: '/tax-invoice/dashboard' },
];

const TaxInvoiceTabs: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (t: { path: string; exact?: boolean }) =>
    t.exact ? pathname === t.path || pathname === `${t.path}/` : pathname.startsWith(t.path);

  return (
    <div className="tab-bar">
      {TABS.map(t => (
        <button
          key={t.path}
          className={`tab-btn ${isActive(t) ? 'active' : ''}`}
          onClick={() => navigate(t.path)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default TaxInvoiceTabs;
