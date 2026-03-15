import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(roles)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🔒</div>
          <div className="empty-state-title">Access Denied</div>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute;
