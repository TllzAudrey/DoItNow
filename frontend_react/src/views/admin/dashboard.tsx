import React from 'react';
import AdminNav from '../../components/AdminNav';

const Dashboard: React.FC = () => {

  return (
    <div style={{ backgroundColor: '#1a1d23', minHeight: '100vh', width: '100%' }}>
      <AdminNav />
      <div className="container" style={{ padding: '30px 50px', width: '100%' }}>
        <h1 style={{ 
          fontSize: '2em',
          fontWeight: '600',
          color: '#e8eaed',
          marginBottom: '30px'
        }}>Admin Dashboard</h1>
        <p style={{ color: '#8b93a1', fontSize: '1.1em' }}>Bienvenue sur le tableau de bord administrateur !</p>
      </div>
    </div>
  );
};
export default Dashboard;
