import React from 'react';
import Logout from '../views/logout';

const AdminNav: React.FC = () => {
  const currentPath = window.location.pathname;

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/tasks', label: 'Tasks', icon: '📋' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
    { path: '/admin/priorities', label: 'Priorities', icon: '⚡' },
  ];

  return (
    <nav style={{
      backgroundColor: '#252930',
      borderBottom: '2px solid #2d3139',
      padding: '0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div style={{
        width: '100%',
        margin: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 20px',
                  color: isActive ? '#3498db' : '#8b93a1',
                  textDecoration: 'none',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.95em',
                  borderBottom: isActive ? '3px solid #3498db' : '3px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#e8eaed';
                    e.currentTarget.style.borderBottomColor = '#3a3f4b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#8b93a1';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.1em' }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
          
        </div>
        <div style={{display: 'flex', gap: '15px'}}>
          <a
            href="/tasks"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#9b59b6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '0.9em',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8e44ad';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 89, 182, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#9b59b6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(155, 89, 182, 0.3)';
            }}
          >
            <span style={{ fontSize: '1.1em' }}>👤</span>
            <span>Mes Tâches</span>
          </a>
          <Logout />
        </div>

      </div>
    </nav>
  );
};

export default AdminNav;

