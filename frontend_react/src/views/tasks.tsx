import React, { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import { getAuthToken, removeAuthToken } from '../utils/auth';
import { DateTime } from 'luxon';
import Logout from './logout';
type Task = {
  id: number;
  name: string;
  description: string | null;
  dueDate: string | null;
  isArchived: boolean;
  category?: {
    id: number;
    label: string;
    color: string;
  } | null;
  priority?: {
    id: number;
    label: string;
  } | null;
};

type Category = {
  id: number;
  label: string;
  color: string;
};

type Priority = {
  id: number;
  label: string;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Cache pour toutes les tâches
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  
  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>(''); // '' = toutes, ou id de priorité

  // Catégories et priorités
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);

  // Pour le modal d'édition
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', dueDate: '', categoryId: '', priorityId: '' });

  // Pour le modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: '', description: '', dueDate: '', categoryId: '', priorityId: '' });

  const fetchTasks = () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('Non authentifié. Veuillez vous connecter.');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/tasks', {
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
            throw new Error(errorData?.message || errorData?.error || `HTTP ${res.status}: Failed to fetch tasks`);
          } catch (e) {
            throw new Error(`HTTP ${res.status}: ${text || 'Failed to fetch tasks'}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        // S'assurer que data est un tableau
        const tasksArray = Array.isArray(data) ? data : [];
        setTasks(tasksArray);
        setAllTasks(tasksArray); // Sauvegarder toutes les tâches dans le cache
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  const fetchCategories = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPriorities = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/priorities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPriorities(data);
      }
    } catch (err) {
      console.error('Error fetching priorities:', err);
    }
  };

  const fetchUserInfo = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setCurrentSearchQuery(query);
    const token = getAuthToken();
    
    if (!token) {
      return;
    }

    // Si la recherche est vide, restaurer toutes les tâches depuis le cache
    if (!query.trim()) {
      const tasksArray = Array.isArray(allTasks) ? allTasks : [];
      setTasks(tasksArray);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          removeAuthToken();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      // S'assurer que data est un tableau
      const tasksArray = Array.isArray(data) ? data : [];
      setTasks(tasksArray);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Erreur lors de la recherche');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchPriorities();
    fetchUserInfo();
  }, []);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 16) : '',
      categoryId: task.category?.id?.toString() || '',
      priorityId: task.priority?.id?.toString() || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({ name: '', description: '', dueDate: '', categoryId: '', priorityId: '' });
  };

  const openCreateModal = () => {
    setCreateFormData({ name: '', description: '', dueDate: '', categoryId: '', priorityId: '' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({ name: '', description: '', dueDate: '', categoryId: '', priorityId: '' });
  };

  const handleCreateTask = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    if (!createFormData.name.trim()) {
      alert('Le nom de la tâche est requis');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description || null,
          dueDate: createFormData.dueDate || null,
          categoryId: createFormData.categoryId ? parseInt(createFormData.categoryId) : null,
          priorityId: createFormData.priorityId ? parseInt(createFormData.priorityId) : null,
        }),
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        throw new Error((errorData as any)?.error || 'Erreur lors de la création de la tâche');
      }

      await response.json();
      closeCreateModal();
      await fetchTasks();
      // Réappliquer la recherche si nécessaire
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la tâche');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          dueDate: formData.dueDate || null,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          priorityId: formData.priorityId ? parseInt(formData.priorityId) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      await response.json();
      
      closeModal();
      await fetchTasks(); // Recharger la liste des tâches
      // Réappliquer la recherche si nécessaire
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      await fetchTasks(); // Recharger la liste des tâches
      // Réappliquer la recherche si nécessaire
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // Appliquer les filtres
  const filteredTasks = React.useMemo(() => {
    // S'assurer que tasks est un tableau
    const tasksArray = Array.isArray(tasks) ? tasks : [];

    return tasksArray.filter(task => {
      // Filtre par catégorie
      if (selectedCategory) {
        if (selectedCategory === 'none') {
          // Sans catégorie
          if (task.category !== null) {
            return false;
          }
        } else {
          // Catégorie spécifique
          if (!task.category || task.category.id.toString() !== selectedCategory) {
            return false;
          }
        }
      }

      // Filtre par priorité
      if (selectedPriority) {
        if (selectedPriority === 'none') {
          // Sans priorité
          if (task.priority !== null) {
            return false;
          }
        } else {
          // Priorité spécifique
          if (!task.priority || task.priority.id.toString() !== selectedPriority) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tasks, selectedCategory, selectedPriority]);

  // Grouper les tâches par catégorie (après filtrage)
  const groupedTasks = React.useMemo(() => {
    const groups: { [key: string]: Task[] } = {
      'Sans catégorie': []
    };

    filteredTasks.forEach(task => {
      if (task.category) {
        const categoryLabel = task.category.label;
        if (!groups[categoryLabel]) {
          groups[categoryLabel] = [];
        }
        groups[categoryLabel].push(task);
      } else {
        groups['Sans catégorie'].push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2em',
      color: '#8b93a1',
      backgroundColor: '#1a1d23'
    }}>
      ⏳ Chargement...
    </div>
  );
  
  if (error) return (
    <div style={{ 
      padding: '20px',
      margin: '20px',
      backgroundColor: 'rgba(231, 76, 60, 0.15)',
      border: '1px solid rgba(231, 76, 60, 0.3)',
      borderRadius: '8px',
      color: '#ff6b6b'
    }}>
      ❌ Erreur: {error}
    </div>
  );

  return (
    <div style={{ backgroundColor: '#1a1d23', minHeight: '100vh', width: '100%' }}>
      {/* Header avec bouton admin */}
      <div style={{
        backgroundColor: '#252930',
        borderBottom: '2px solid #2d3139',
        padding: '20px 50px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '1.8em',
          fontWeight: '600',
          color: '#e8eaed',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>✨</span>
          <span>Mes Tâches</span>
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
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
            <span>Nouvelle Tâche</span>
          </button>

          {userRoles.includes('ROLE_ADMIN') && (
            <a
              href="/admin/dashboard"
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
              }}
            >
              <span style={{ fontSize: '1.2em' }}>👨‍💼</span>
              <span>Admin</span>
            </a>
          )}
          <Logout />
        </div>
      </div>

      <div style={{ padding: '30px 50px', width: '100%', margin: '0 auto' }}>
        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '25px',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Rechercher dans vos tâches par nom, description, catégorie ou priorité..."
            />
          </div>
          
          {/* Filtres */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Filtre par catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '14px 20px',
                fontSize: '0.95em',
                border: '2px solid #2d3139',
                borderRadius: '12px',
                backgroundColor: '#252930',
                color: '#e8eaed',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3498db';
                e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2d3139';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
            >
              <option value="">🏷️ Toutes les catégories</option>
              <option value="none">📝 Sans catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Filtre par priorité */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: '14px 20px',
                fontSize: '0.95em',
                border: '2px solid #2d3139',
                borderRadius: '12px',
                backgroundColor: '#252930',
                color: '#e8eaed',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3498db';
                e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2d3139';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
            >
              <option value="">⚡ Toutes les priorités</option>
              <option value="none">📝 Sans priorité</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id.toString()}>
                  ⚡ {priority.label}
                </option>
              ))}
            </select>

            {/* Bouton pour réinitialiser les filtres */}
            {(selectedCategory || selectedPriority) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPriority('');
                }}
                style={{
                  padding: '14px 20px',
                  fontSize: '0.95em',
                  border: '2px solid #2d3139',
                  borderRadius: '12px',
                  backgroundColor: '#1e2127',
                  color: '#8b93a1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3f4b';
                  e.currentTarget.style.color = '#e8eaed';
                  e.currentTarget.style.backgroundColor = '#252930';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2d3139';
                  e.currentTarget.style.color = '#8b93a1';
                  e.currentTarget.style.backgroundColor = '#1e2127';
                }}
              >
                <span>🔄</span>
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#252930',
            borderRadius: '16px',
            border: '2px dashed #2d3139'
          }}>
            <div style={{ fontSize: '4em', marginBottom: '20px' }}>
              {currentSearchQuery.trim() ? '🔍' : '📭'}
            </div>
            <div style={{ fontSize: '1.3em', color: '#e8eaed', marginBottom: '10px', fontWeight: '600' }}>
              {currentSearchQuery.trim() ? 'Aucun résultat trouvé' : 'Aucune tâche pour le moment'}
            </div>
            <div style={{ fontSize: '1em', color: '#8b93a1', marginBottom: '30px' }}>
              {currentSearchQuery.trim() || selectedCategory || selectedPriority
                ? `Aucune tâche ne correspond à vos critères de recherche/filtrage.` 
                : 'Commencez par créer votre première tâche !'}
            </div>
            <button 
              onClick={openCreateModal}
              style={{
                padding: '14px 28px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1em',
                boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
              }}
            >
              ➕ {currentSearchQuery.trim() ? 'Créer cette tâche' : 'Créer ma première tâche'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {Object.entries(groupedTasks).map(([categoryName, categoryTasks]) => {
              if (categoryTasks.length === 0) return null;
              
              const category = categories.find(c => c.label === categoryName);
              const categoryColor = category?.color || '#5a6268';

              return (
                <div key={categoryName} style={{
                  backgroundColor: '#252930',
                  borderRadius: '16px',
                  padding: '25px',
                  border: '1px solid #2d3139',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {/* En-tête de catégorie */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: `3px solid ${categoryColor}`
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: categoryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4em',
                      boxShadow: `0 4px 12px ${categoryColor}40`
                    }}>
                      {categoryName === 'Sans catégorie' ? '📝' : '🏷️'}
                    </div>
                    <div>
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.5em',
                        fontWeight: '700',
                        color: '#e8eaed'
                      }}>
                        {categoryName}
                      </h2>
                      <div style={{
                        fontSize: '0.85em',
                        color: '#8b93a1',
                        marginTop: '2px'
                      }}>
                        {categoryTasks.length} tâche{categoryTasks.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Grille de tâches */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '16px'
                  }}>
                    {categoryTasks.map((task) => (
                      <div key={task.id} style={{
                        backgroundColor: '#1e2127',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #2d3139',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                        e.currentTarget.style.borderColor = categoryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#2d3139';
                      }}
                      >
                        {/* Barre de couleur à gauche */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          backgroundColor: categoryColor
                        }}></div>

                        {/* En-tête de la carte */}
                        <div style={{ marginBottom: '12px', paddingLeft: '8px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px'
                          }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: '1.1em',
                              fontWeight: '600',
                              color: '#e8eaed',
                              flex: 1
                            }}>
                              {task.name}
                            </h3>
                            {task.priority && (
                              <span style={{
                                padding: '4px 10px',
                                backgroundColor: '#ffae00ff',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '0.75em',
                                fontWeight: '600',
                                marginLeft: '10px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'

                              }}>
                                ⚡ {task.priority.label}
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p style={{
                              margin: '8px 0 0 0',
                              fontSize: '0.9em',
                              color: '#8b93a1',
                              lineHeight: '1.5'
                            }}>
                              {task.description.length > 100
                                ? task.description.substring(0, 100) + '...'
                                : task.description}
                            </p>
                          )}
                        </div>

                        {/* Pied de la carte */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid #2d3139',
                          paddingLeft: '8px'
                        }}>
                          {task.dueDate ? (
                            <div style={{
                              fontSize: '0.85em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor:new Date(task.dueDate).toLocaleDateString('fr-FR') < DateTime.now().toLocaleString(DateTime.DATE_FULL) ? '#c20000ff' : '#008f3bff',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85em', color: '#5a6268' }}>
                              Pas d'échéance
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(task);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#f39c12',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f39c12'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f39c12'}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal pour créer une tâche */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#252930',
            padding: '35px',
            borderRadius: '16px',
            minWidth: '500px',
            maxWidth: '600px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #2d3139'
          }}>
            <h2 style={{ 
              color: '#e8eaed',
              marginBottom: '25px',
              fontSize: '1.5em',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ✨ Créer une nouvelle tâche
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Nom de la tâche *
              </label>
              <input
                type="text"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2ecc71'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Description
              </label>
              <textarea
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2ecc71'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Date d'échéance
              </label>
              <input
                type="datetime-local"
                value={createFormData.dueDate}
                onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  colorScheme: 'dark'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2ecc71'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Catégorie
              </label>
              <select
                value={createFormData.categoryId}
                onChange={(e) => setCreateFormData({ ...createFormData, categoryId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  fontSize: '0.95em',
                  outline: 'none'
                }}
              >
                <option value="">-- Aucune catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Priorité
              </label>
              <select
                value={createFormData.priorityId}
                onChange={(e) => setCreateFormData({ ...createFormData, priorityId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  fontSize: '0.95em',
                  outline: 'none'
                }}
              >
                <option value="">-- Aucune priorité --</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '10px',
              borderTop: '1px solid #2d3139'
            }}>
              <button
                onClick={closeCreateModal}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  cursor: 'pointer',
                  color: '#8b93a1',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3f4b';
                  e.currentTarget.style.color = '#e8eaed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2d3139';
                  e.currentTarget.style.color = '#8b93a1';
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTask}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(46, 204, 113, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#27ae60';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(46, 204, 113, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2ecc71';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(46, 204, 113, 0.4)';
                }}
              >
                ✨ Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour éditer une tâche - Identique au modal de création mais avec formData */}
      {showModal && editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#252930',
            padding: '35px',
            borderRadius: '16px',
            minWidth: '500px',
            maxWidth: '600px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #2d3139'
          }}>
            <h2 style={{ 
              color: '#e8eaed',
              marginBottom: '25px',
              fontSize: '1.5em',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ✏️ Modifier la tâche
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Nom de la tâche *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Date d'échéance
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  colorScheme: 'dark'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Catégorie
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  fontSize: '0.95em',
                  outline: 'none'
                }}
              >
                <option value="">-- Aucune catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#8b93a1',
                fontSize: '0.9em'
              }}>
                Priorité
              </label>
              <select
                value={formData.priorityId}
                onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  color: '#e8eaed',
                  fontSize: '0.95em',
                  outline: 'none'
                }}
              >
                <option value="">-- Aucune priorité --</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '10px',
              borderTop: '1px solid #2d3139'
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #2d3139',
                  borderRadius: '8px',
                  backgroundColor: '#1e2127',
                  cursor: 'pointer',
                  color: '#8b93a1',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3f4b';
                  e.currentTarget.style.color = '#e8eaed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2d3139';
                  e.currentTarget.style.color = '#8b93a1';
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateTask}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3498db';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
                }}
              >
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
