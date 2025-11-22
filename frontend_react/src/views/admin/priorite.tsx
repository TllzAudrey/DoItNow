import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import { getAuthToken, removeAuthToken } from '../../utils/auth';

type Priorite = {
  id: number;
  label: string;
};

const Priorite: React.FC = () => {
  const [priorite, setPriorite] = useState<Priorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pour le modal d'édition
  const [showModal, setShowModal] = useState(false);
  const [editingPriorite, setEditingPriorite] = useState<Priorite | null>(null);
  const [formData, setFormData] = useState({ label: '' });
  
  // Pour le modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ label: '' });

  const fetchPriorite = () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('Non authentifié. Veuillez vous connecter.');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/priorities', {
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
            throw new Error(errorData?.message || errorData?.error || `HTTP ${res.status}: Failed to fetch priorite`);
          } catch (e) {
            throw new Error(`HTTP ${res.status}: ${text || 'Failed to fetch priorite'}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        console.log('Priorite loaded:', data);
        setPriorite(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPriorite();
  }, []);

  const openEditModal = (priorite: Priorite) => {
    setEditingPriorite(priorite);
    setFormData({
      label: priorite.label
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPriorite(null);
    setFormData({ label: '' });
  };

  // ---- MODAL CREATION LOGIC ----
  const openCreateModal = () => {
    setCreateFormData({ label: '' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({ label: '' });
  };

  const handleCreatePriorite = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    if (!createFormData.label.trim()) {
      alert('Le label de la priorité est requis');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/priorities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          label: createFormData.label
        }),
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        throw new Error((errorData as any)?.error || 'Erreur lors de la création de la priorité');
      }

      await response.json();
      closeCreateModal();
      fetchPriorite();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la priorité');
    }
  };

  // ---- FIN MODAL CREATION LOGIC ----

  const handleUpdatePriorite = async () => {
    if (!editingPriorite) return;

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/priorities/${editingPriorite.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          label: formData.label
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      console.log('Priorite updated:', result);
      
      closeModal();
      fetchPriorite(); // Recharger la liste des priorités
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeletePriorite = async (prioriteId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette priorité ?')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/priorities/${prioriteId}`, {
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

      console.log('Priorite deleted');
      fetchPriorite(); // Recharger la liste des priorités
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
            ⚡ Gestion des priorités
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
            <span>Nouvelle priorité</span>
          </button>
        </div>
        

        {priorite.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#252930',
            borderRadius: '12px',
            border: '1px solid #2d3139'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '20px' }}>⚡</div>
            <h3 style={{ color: '#e8eaed', marginBottom: '10px', fontSize: '1.3em' }}>
              Aucune priorité
            </h3>
            <p style={{ color: '#8b93a1', fontSize: '0.95em' }}>
              Commencez par créer une priorité pour mieux gérer vos tâches.
            </p>
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
                    }}>⚡Priorité</th>
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
                  {priorite.map((priorite) => (
                    <tr key={priorite.id} style={{ marginBottom: '1rem' }}>
                      <td style={{ padding: '20px'}}><strong>{priorite.label}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '20px',justifyContent: 'center' }}>
                          <button 
                            onClick={() => openEditModal(priorite)}
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
                            onClick={() => handleDeletePriorite(priorite.id)}
                            style={{
                              padding: '7px 20px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#c0392b';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#e74c3c';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.2)';
                            }}
                            title="Supprimer définitivement"
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
      {/* Modal pour créer une priorité */}
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
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '600px'
          }}>
            <h2 >Créer une nouvelle priorité</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Label de la priorité *
              </label>
              <input
                type="text"
                value={createFormData.label}
                onChange={(e) => setCreateFormData({ ...createFormData, label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
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
                onClick={handleCreatePriorite}
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

      {/* Modal pour éditer une priorité */}
      {showModal && editingPriorite && (
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
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '600px'
          }}>
            <h2 >Modifier la priorité</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Label de la priorité *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
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
                onClick={handleUpdatePriorite}
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

export default Priorite;

