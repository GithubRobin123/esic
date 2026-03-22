import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props { title: string; description?: string; }

const ComingSoon: React.FC<Props> = ({ title, description }) => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div className="empty-state" style={{ padding: '100px 20px' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🚧</div>
        <div className="empty-state-title">{title}</div>
        <p style={{ marginTop: 8, color: 'var(--text-muted)', maxWidth: 400, margin: '8px auto 20px' }}>
          {description || 'This feature is coming soon. The module is part of the EDISS system and will be implemented in a future update.'}
        </p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );
};

export const NotFoundPage = () => <ComingSoon title="Page Not Found" description="The page you're looking for doesn't exist." />;

export default ComingSoon;
