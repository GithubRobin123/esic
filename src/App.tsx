import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import MawbPage from './pages/MawbPage';
import HawbPage from './pages/HawbPage';
import TransmissionPage from './pages/TransmissionPage';
import LocationPage from './pages/LocationPage';
import { RegisterUserPage, RegisterProfilePage, ChangePasswordPage } from './pages/AdminPages';
import {
  ChecklistPage, AccountStatementPage, CanDoPage,
  AirManifestPage, AccountingPage, NotFoundPage
} from './pages/Placeholders';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
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

        {/* Air Manifest */}
        <Route path="/air-manifest/*" element={<ProtectedRoute><AirManifestPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/register-user" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterUserPage /></ProtectedRoute>} />
        <Route path="/admin/register-profile" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterProfilePage /></ProtectedRoute>} />
        <Route path="/admin/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['master_admin', 'admin']}><NotFoundPage /></ProtectedRoute>} />

        {/* Accounting */}
        <Route path="/accounting/*" element={<ProtectedRoute><AccountingPage /></ProtectedRoute>} />

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
