import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import { getAuthToken, removeAuthToken } from '../../utils/auth';

type User = {
  id: number;
  pseudo: string;
  email: string;
  roles: string[];
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pour le modal d'édition
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ pseudo: '', email: '', password: '', role: '0' });
  
  // Pour le modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ pseudo: '', email: '', password: '', role: '0' });

  const fetchUsers = () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('Non authentifié. Veuillez vous connecter.');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            removeAuthToken();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          const text = await res.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData?.message || errorData?.error || `HTTP ${res.status}: Failed to fetch users`);
          } catch (e) {
            throw new Error(`HTTP ${res.status}: ${text || 'Failed to fetch users'}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        console.log('Users loaded:', data);
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      pseudo: user.pseudo,
      email: user.email,
      password: '', // Ne pas pré-remplir le mot de passe
      role: user.roles.includes('ROLE_ADMIN') ? '1' : '0'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ pseudo: '', email: '', password: '', role: '0' });
  };

  // ---- MODAL CREATION LOGIC ----
  const openCreateModal = () => {
    setCreateFormData({ pseudo: '', email: '', password: '', role: '0' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({ pseudo: '', email: '', password: '', role: '0' });
  };

  const handleCreateUser = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    if (!createFormData.pseudo.trim() || !createFormData.email.trim() || !createFormData.password.trim()) {
      alert('Le pseudo, l\'email et le mot de passe sont requis');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pseudo: createFormData.pseudo,
          email: createFormData.email,
          password: createFormData.password,
          role: parseInt(createFormData.role)
        }),
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        throw new Error((errorData as any)?.error || 'Erreur lors de la création de l\'utilisateur');
      }

      await response.json();
      closeCreateModal();
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  // ---- FIN MODAL CREATION LOGIC ----

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const body: any = {
        pseudo: formData.pseudo,
        email: formData.email,
        role: parseInt(formData.role)
      };

      // N'inclure le mot de passe que s'il est fourni
      if (formData.password.trim()) {
        body.password = formData.password;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      // amélioration de la gestion des erreurs pour afficher les détails retournés par l'API
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        console.error('Update error details:', errorData);
        alert((errorData as any)?.details || (errorData as any)?.error || 'Erreur lors de la mise à jour');
        return;
      }

      const result = await response.json();
      console.log('User updated:', result);
      closeModal();
      fetchUsers(); // Recharger la liste des utilisateurs
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Essayer de parser la réponse en JSON
        let errorMessage = 'Erreur lors de la suppression';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      console.log('User deleted');
      fetchUsers(); // Recharger la liste des utilisateurs
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    
    <div style={{ backgroundColor: '#1a1d23', minHeight: '100vh', width: '100%' }}>
      <AdminNav />

      <div className="container" style={{ padding: '30px 50px', width: '100%' }}>
        <div style={{ display: 'flex',gap:'20px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2em',
            fontWeight: '600',
            color: '#e8eaed',
            marginBottom: '30px'
          }}>
            👥 Gestion des utilisateurs
          </h1>
          <button 
            onClick={openCreateModal}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(46, 204, 113, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27ae60';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2ecc71';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.3)';
            }}
          >
            <span style={{ fontSize: '1.2em' }}>➕</span>
            <span>Nouvel utilisateur</span>
          </button>
        </div>
        

        {users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#252930',
            borderRadius: '12px',
            border: '1px solid #2d3139'
          }}>
          </div>
        ) : (
          <div style={{    
            overflow: 'hidden', 
            width: '100%'
          }}>
            <div style={{ overflowX: 'auto',width: '70%' ,backgroundColor: '#252930',border: '1px solid #2d3139',borderRadius: '12px',}}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#2d3139',
                    borderBottom: '2px solid #3a3f4b'
                  }}>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>👤 Pseudo</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '220px'
                    }}>✉️ Email</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '300px'
                    }}>👤 Role</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '180px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ marginBottom: '1rem' }}>
                      <td style={{ padding: '20px'}}><strong>{user.pseudo}</strong></td>
                      <td style={{ padding: '20px'}}>{user.email}</td>
                      <td style={{ padding: '20px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#dc3545' : '#28a745',
                          color: 'white',
                          fontSize: '0.85em'
                        }}>
                          {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '20px',justifyContent: 'center' }}>
                          <button 
                            onClick={() => openEditModal(user)}
                            style={{
                              padding: '7px 20px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#f39c12',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(243, 156, 18, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f39c12';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(243, 156, 18, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f39c12';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(243, 156, 18, 0.2)';
                            }}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => {
                              if (user.roles.includes('ROLE_ADMIN')) {
                                alert('Impossible de supprimer un administrateur depuis l\'interface. Veuillez utiliser la base de données directement.');
                              } else {
                                handleDeleteUser(user.id);
                              }
                            }}
                            disabled={user.roles.includes('ROLE_ADMIN')}
                            style={{
                              padding: '7px 20px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#6c757d' : '#e74c3c',
                              color: 'white',
                              cursor: user.roles.includes('ROLE_ADMIN') ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)',
                              opacity: user.roles.includes('ROLE_ADMIN') ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!user.roles.includes('ROLE_ADMIN')) {
                                e.currentTarget.style.backgroundColor = '#c0392b';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!user.roles.includes('ROLE_ADMIN')) {
                                e.currentTarget.style.backgroundColor = '#e74c3c';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.2)';
                              }
                            }}
                            title={user.roles.includes('ROLE_ADMIN') ? "Impossible de supprimer un administrateur" : "Supprimer définitivement"}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal pour créer un utilisateur */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'black',
            color: 'white',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '400px',
            maxWidth: '600px'
          }}>
            <h2 style={{ color: 'white' }}>Créer un nouvel utilisateur</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'white' }}>
                Pseudo *
              </label>
              <input
                type="text"
                value={createFormData.pseudo}
                onChange={(e) => setCreateFormData({ ...createFormData, pseudo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
                maxLength={16}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'white' }}>
                Email *
              </label>
              <input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
                maxLength={64}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'white' }}>
                Mot de passe *
              </label>
              <input
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'white' }}>
                Rôle *
              </label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="0">Utilisateur</option>
              </select>
              <small style={{ color: '#8b93a1', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                Note : Les administrateurs doivent être créés directement dans la base de données.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeCreateModal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  color: 'black'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour éditer un utilisateur */}
      {showModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'black',
            color: 'white',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '400px',
            maxWidth: '600px'
          }}>
            <h2 style={{ color: 'white' }}>Modifier l'utilisateur</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Pseudo *
              </label>
              <input
                type="text"
                value={formData.pseudo}
                onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                maxLength={16}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                maxLength={64}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nouveau mot de passe (laisser vide pour ne pas changer)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={editingUser?.roles.includes('ROLE_ADMIN')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  opacity: editingUser?.roles.includes('ROLE_ADMIN') ? 0.6 : 1,
                  cursor: editingUser?.roles.includes('ROLE_ADMIN') ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="0">Utilisateur</option>
                {editingUser?.roles.includes('ROLE_ADMIN') && <option value="1">Administrateur</option>}
              </select>
              {editingUser?.roles.includes('ROLE_ADMIN') ? (
                <small style={{ color: '#8b93a1', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  Le rôle d'un administrateur ne peut pas être modifié depuis l'interface.
                </small>
              ) : (
                <small style={{ color: '#8b93a1', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  Note : Les administrateurs doivent être créés directement dans la base de données.
                </small>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  color: 'black'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateUser}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
