import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import MawbPage from './pages/MawbPage';
import HawbPage from './pages/HawbPage';
import MultipleHawbPage from './pages/MultipleHawbPage';
import TransmissionPage from './pages/TransmissionPage';
import LocationPage from './pages/LocationPage';
import CanDoPage from './pages/CanDoPage';
import AccountingPage from './pages/AccountingPage';
import { ChecklistPage, AccountStatementPage } from './pages/ReportPages';
import {
  RegisterUserPage, RegisterProfilePage, ChangePasswordPage,
  StatementConsolPage, StatementHawbPage, DownloadFilePage, ChangeInvoicePage,
} from './pages/AdminPages';
import { NotFoundPage } from './pages/Placeholders';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated, needsLocationSelect } = useAuth();
  const currentPath = useLocation().pathname;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Force location selection before accessing any other page
  if (needsLocationSelect && currentPath !== '/location') {
    return (
      <AppLayout>
        <Routes>
          <Route path="*" element={<Navigate to="/location" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/mawb" replace />} />
        <Route path="/login" element={<Navigate to="/mawb" replace />} />

        {/* MAWB */}
        <Route path="/mawb" element={<ProtectedRoute><MawbPage /></ProtectedRoute>} />

        {/* HAWB */}
        <Route path="/hawb" element={<ProtectedRoute><HawbPage /></ProtectedRoute>} />
        <Route path="/hawb/new" element={<ProtectedRoute><HawbPage /></ProtectedRoute>} />
        <Route path="/hawb/add-multiple" element={<ProtectedRoute><MultipleHawbPage /></ProtectedRoute>} />

        {/* Reports */}
        <Route path="/report/checklist" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
        <Route path="/report/account-statement" element={<ProtectedRoute><AccountStatementPage /></ProtectedRoute>} />

        {/* Transmission */}
        <Route path="/transmission/generate" element={<ProtectedRoute><TransmissionPage /></ProtectedRoute>} />
        <Route path="/transmission/console" element={<ProtectedRoute><TransmissionPage /></ProtectedRoute>} />

        {/* Location */}
        <Route path="/location" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />

        {/* CAN/DO */}
        <Route path="/can-do" element={<ProtectedRoute><CanDoPage /></ProtectedRoute>} />

        {/* Accounting – admin only */}
        <Route path="/accounting/*" element={<ProtectedRoute roles={['master_admin', 'admin']}><AccountingPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/register-user" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterUserPage /></ProtectedRoute>} />
        <Route path="/admin/register-profile" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterProfilePage /></ProtectedRoute>} />
        <Route path="/admin/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/admin/statement-consol" element={<ProtectedRoute roles={['master_admin', 'admin']}><StatementConsolPage /></ProtectedRoute>} />
        <Route path="/admin/statement-hawb" element={<ProtectedRoute roles={['master_admin', 'admin']}><StatementHawbPage /></ProtectedRoute>} />
        <Route path="/admin/download-file" element={<ProtectedRoute roles={['master_admin', 'admin']}><DownloadFilePage /></ProtectedRoute>} />
        <Route path="/admin/change-invoice" element={<ProtectedRoute roles={['master_admin', 'admin']}><ChangeInvoicePage /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['master_admin', 'admin']}><NotFoundPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
