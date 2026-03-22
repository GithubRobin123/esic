import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface DropdownItem { label: string; path: string; }
interface NavItem { label: string; path?: string; items?: DropdownItem[]; adminOnly?: boolean; noUser?: boolean; }

const NAV_ITEMS: NavItem[] = [
  { label: 'MAWB', path: '/mawb' },
  {
    label: 'HAWB',
    items: [
      { label: 'Add House AWB', path: '/hawb/new' },
      { label: 'Add Multiple Hawbs', path: '/hawb/add-multiple' },
      { label: 'View All HAWBs', path: '/hawb' },
    ],
  },
  {
    label: 'Report',
    items: [
      { label: 'CheckList', path: '/report/checklist' },
      { label: 'Account Statement', path: '/report/account-statement' },
    ],
  },
  {
    label: 'Transmission',
    items: [
      { label: 'Generate File', path: '/transmission/generate' },
      { label: 'Transmit Console', path: '/transmission/console' },
    ],
  },
  { label: 'Location', path: '/location' },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { label: 'Register User', path: '/admin/register-user' },
      { label: 'Register Profile', path: '/admin/register-profile' },
      { label: 'Statement By Consol User', path: '/admin/statement-consol' },
      { label: 'Statement With HAWB', path: '/admin/statement-hawb' },
      { label: 'Download File', path: '/admin/download-file' },
      { label: 'Change Password', path: '/admin/change-password' },
      { label: 'Change Invoice No.', path: '/admin/change-invoice' },
    ],
  },
  {
    label: 'Accounting',
    adminOnly: true,   // hidden from regular 'user' role
    items: [
      { label: 'View Invoice', path: '/accounting/invoice' },
      { label: 'Statement', path: '/accounting/statement' },
      { label: 'Mail List', path: '/accounting/mail-list' },
      { label: 'Master Update', path: '/accounting/master-update' },
      { label: 'Account Master', path: '/accounting/account-master' },
    ],
  },
];

const Dropdown = ({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="dropdown-menu">
      {items.map(item => (
        <span
          key={item.path}
          className="dropdown-item"
          onClick={() => { navigate(item.path); onClose(); }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, logout, hasRole, selectedLocation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path?: string) => path && location.pathname.startsWith(path);

  return (
    <nav className="navbar" ref={navRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <a href="/mawb" className="navbar-brand" onClick={e => { e.preventDefault(); navigate('/mawb'); }}>
          EDISS
        </a>
        <ul className="nav-links">
          {NAV_ITEMS.map(item => {
            if (item.adminOnly && !hasRole(['master_admin', 'admin'])) return null;
            if (item.path) {
              return (
                <li key={item.label} className="nav-item">
                  <button
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => navigate(item.path!)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={item.label} className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                >
                  {item.label} <span className="caret">▾</span>
                </button>
                {openDropdown === item.label && item.items && (
                  <Dropdown items={item.items} onClose={() => setOpenDropdown(null)} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="nav-right">
        <span className="nav-user">
          {user?.username?.toUpperCase()}
          {selectedLocation
            ? ` — ${selectedLocation.iata_code} (${selectedLocation.customs_house_code || selectedLocation.iata_code})`
            : ` (${user?.customs_house_code || 'N/A'})`
          }
        </span>
        <button className="nav-link" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
