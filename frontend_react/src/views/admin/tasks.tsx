import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import SearchBar from '../../components/SearchBar';
import { getAuthToken, removeAuthToken } from '../../utils/auth';
import { DateTime } from 'luxon';

type User = {
  id: number;
  pseudo: string;
  email: string;
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

type Status = {
  id: number;
  label: string;
};

type Task = {
  id: number;
  name: string;
  description: string | null;
  dueDate: string | null;
  isArchived: boolean;
  user: User | null;
  category: Category | null;
  priority: Priority | null;
  status: Status | null;
};

type HistoryEntry = {
  id: number;
  changedAt: string;
  changes: any;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Garder toutes les tâches en cache
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  
  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'active', 'archived'


  
  // Catégories et priorités
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  
  // Pour le modal d'édition
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', dueDate: '', isArchived: false });
  
  // Pour le modal d'historique
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentTaskHistory, setCurrentTaskHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTasks = () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('Non authentifié. Veuillez vous connecter.');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/admin/tasks/all', {
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
        console.log('Tasks loaded:', data);
        setTasks(data);
        setAllTasks(data); // Sauvegarder toutes les tâches
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
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

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchPriorities();
  }, []);

  const handleSearch = async (query: string) => {
    setCurrentSearchQuery(query);
    const token = getAuthToken();
    
    if (!token) {
      return;
    }

    // Si la recherche est vide, restaurer toutes les tâches depuis le cache
    if (!query.trim()) {
      setTasks(allTasks);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/tasks/search?q=${encodeURIComponent(query)}`, {
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
      setTasks(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Erreur lors de la recherche');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 16) : '',
      isArchived: task.isArchived
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({ name: '', description: '', dueDate: '', isArchived: false });
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
          isArchived: formData.isArchived
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      console.log('Task updated:', result);
      
      closeModal();
      // Recharger et réappliquer la recherche si nécessaire
      await fetchTasks();
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleToggleArchive = async (taskId: number, currentStatus: boolean) => {
    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    const action = currentStatus ? 'désarchiver' : 'archiver';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cette tâche ?`)) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/tasks/${taskId}/toggle-archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du changement de statut');
      }

      console.log(`Task ${action}ed`);
      // Recharger et réappliquer la recherche si nécessaire
      await fetchTasks();
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      console.error('Toggle archive error:', err);
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette tâche ?')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/task/${taskId}`, {
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

      console.log('Task deleted');
      // Recharger et réappliquer la recherche si nécessaire
      await fetchTasks();
      if (currentSearchQuery) {
        handleSearch(currentSearchQuery);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleShowHistory = async (taskId: number) => {
    const token = getAuthToken();
    if (!token) {
      alert('Non authentifié');
      return;
    }

    setLoadingHistory(true);
    setShowHistoryModal(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/tasks/${taskId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération de l\'historique');
      }

      const history = await response.json();
      setCurrentTaskHistory(history);
      setLoadingHistory(false);
    } catch (err: any) {
      console.error('History error:', err);
      alert(err.message || 'Erreur lors de la récupération de l\'historique');
      setLoadingHistory(false);
      setShowHistoryModal(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setCurrentTaskHistory([]);
  };

  const renderChangeValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    if (value === null || value === undefined) {
      return '(vide)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
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

      // Filtre par statut (archivé/actif)
      if (selectedStatus === 'active' && task.isArchived) {
        return false;
      }
      if (selectedStatus === 'archived' && !task.isArchived) {
        return false;
      }

      return true;
    });
  }, [tasks, selectedCategory, selectedPriority, selectedStatus]);

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
      <AdminNav />

      <div className="container" style={{ padding: '30px 50px', width: '100%' }}>
        <h1 style={{ 
          fontSize: '2em',
          fontWeight: '600',
          color: '#e8eaed',
          marginBottom: '30px'
        }}>
          📋 Gestion des Tâches
        </h1>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '25px',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <SearchBar onSearch={handleSearch}/>
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

            {/* Filtre par statut */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '14px 20px',
                fontSize: '0.95em',
                border: '2px solid #2d3139',
                borderRadius: '12px',
                backgroundColor: '#252930',
                color: '#e8eaed',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '150px',
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
              <option value="all">📊 Tous les statuts</option>
              <option value="active">✅ Actives</option>
              <option value="archived">📦 Archivées</option>
            </select>

            {/* Bouton pour réinitialiser les filtres */}
            {(selectedCategory || selectedPriority || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPriority('');
                  setSelectedStatus('all');
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
            padding: '60px 20px',
            backgroundColor: '#252930',
            borderRadius: '12px',
            border: '1px solid #2d3139'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>
              {isSearching ? '🔍' : '📭'}
            </div>
            <div style={{ fontSize: '1.1em', color: '#8b93a1' }}>
              {isSearching || selectedCategory || selectedPriority || selectedStatus !== 'all'
                ? 'Aucune tâche ne correspond à vos critères de recherche/filtrage'
                : 'Aucune tâche trouvée'}
            </div>
          </div>
        ) : (
          <div style={{    
            overflow: 'hidden', 
            width: '100%'
          }}>
            <div style={{ overflowX: 'auto', margin:'auto',width: '100%' ,backgroundColor: '#252930',border: '1px solid #2d3139',borderRadius: '12px',}}>
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
                    }}>👤 Utilisateur</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '220px'
                    }}>✉️ Contact</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '300px'
                    }}>📝 Tâche</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Statut</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Catégorie</th>
                    <th style={{ 
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#8b93a1',
                      fontSize: '0.85em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Priorité</th>
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
                {filteredTasks.map((task, index) => (
                  <tr key={task.id} style={{ 
                    borderBottom: '1px solid #2d3139',
                    backgroundColor: index % 2 === 0 ? '#252930' : '#1e2127',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3139'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#252930' : '#1e2127'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ 
                        fontWeight: '600',
                        color: '#e8eaed',
                        fontSize: '0.95em'
                      }}>
                        {task.user?.pseudo || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: '#8b93a1',
                        fontFamily: 'monospace'
                      }}>
                        {task.user?.email || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600',
                          color: '#e8eaed',
                          marginBottom: '4px',
                          fontSize: '0.95em'
                        }}>
                          {task.name}
                        </div>
                        {task.description && (
                          <div style={{ 
                            fontSize: '0.85em', 
                            color: '#8b93a1',
                            lineHeight: '1.4',
                            marginBottom: '6px'
                          }}>
                            {task.description.length > 80 
                              ? task.description.substring(0, 80) + '...' 
                              : task.description}
                          </div>
                        )}
                        {task.dueDate && (
                          <div style={{ 
                            fontSize: '0.8em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor:new Date(task.dueDate).toLocaleDateString('fr-FR') < DateTime.now().toLocaleString(DateTime.DATE_FULL) ? '#c20000ff' : '#008f3bff',
                            color: 'white',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 107, 107, 0.3)'
                          }}>
                            📅 Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.85em',
                        fontWeight: '600',
                        backgroundColor: task.isArchived ? '#5a6268' : '#2ecc71',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        {task.isArchived ? '📦 Archivée' : '✅ Active'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {task.category ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85em',
                          fontWeight: '600',
                          backgroundColor: task.category.color,
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          {task.category.label}
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#5a6268',
                          fontSize: '0.85em',
                          fontStyle: 'italic'
                        }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {task.priority ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85em',
                          fontWeight: '600',
                          backgroundColor: '#ffae00ff',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}>
                          ⚡ {task.priority.label}
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#5a6268',
                          fontSize: '0.85em',
                          fontStyle: 'italic'
                        }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        alignItems: 'stretch'
                      }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleShowHistory(task.id)}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(52, 152, 219, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2980b9';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3498db';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.2)';
                            }}
                            title="Voir l'historique"
                          >
                            📜
                          </button>
                          <button 
                            onClick={() => openEditModal(task)}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#f39c12',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(243, 156, 18, 0.2)'
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
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleToggleArchive(task.id, task.isArchived)}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              fontSize: '0.8em',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#7d7b7eff',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(125, 123, 126, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#7d7b7eff';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(125, 123, 126, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#7d7b7eff';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(125, 123, 126, 0.2)';
                            }}
                            title={task.isArchived ? 'Désarchiver' : 'Archiver'}
                          >
                            {task.isArchived ? '📤' : '📥'}
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
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

      {/* Modal pour éditer une tâche */}
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
            minWidth: '450px',
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
                onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
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
                onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
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
                onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                onBlur={(e) => e.target.style.borderColor = '#2d3139'}
              />
            </div>

            <div style={{ 
              marginBottom: '25px',
              padding: '12px',
              backgroundColor: '#1e2127',
              borderRadius: '8px',
              border: '1px solid #2d3139'
            }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '0.95em'
              }}>
                <input
                  type="checkbox"
                  checked={formData.isArchived}
                  onChange={(e) => setFormData({ ...formData, isArchived: e.target.checked })}
                  style={{ 
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#8b93a1', fontWeight: '500' }}>📦 Archiver cette tâche</span>
              </label>
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
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(155, 89, 182, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8e44ad';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(155, 89, 182, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#9b59b6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(155, 89, 182, 0.4)';
                }}
              >
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour l'historique */}
      {showHistoryModal && (
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
            minWidth: '550px',
            maxWidth: '750px',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
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
              📜 Historique de la tâche
            </h2>
            
            {loadingHistory ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px 20px',
                color: '#8b93a1',
                fontSize: '1.1em'
              }}>
                <div style={{ fontSize: '2em', marginBottom: '10px' }}>⏳</div>
                Chargement de l'historique...
              </div>
            ) : currentTaskHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#1e2127',
                borderRadius: '12px',
                border: '2px dashed #2d3139'
              }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>📭</div>
                <div style={{ color: '#8b93a1', fontSize: '1.05em' }}>
                  Aucun historique disponible pour cette tâche
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '5px' }}>
                {currentTaskHistory.map((entry, index) => (
                  <div key={entry.id} style={{
                    marginBottom: '16px',
                    padding: '18px',
                    border: '2px solid #2d3139',
                    borderRadius: '12px',
                    backgroundColor: index === 0 ? '#1e2d3d' : '#1e2127',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '15px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75em',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(52, 152, 219, 0.4)'
                      }}>
                        RÉCENT
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.85em',
                      color: '#8b93a1',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '500'
                    }}>
                      📅 {new Date(entry.changedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div>
                      {Object.entries(entry.changes).map(([field, change]: [string, any]) => (
                        <div key={field} style={{ 
                          marginBottom: '10px',
                          padding: '10px',
                          backgroundColor: '#252930',
                          borderRadius: '8px',
                          border: '1px solid #2d3139'
                        }}>
                          <div style={{ 
                            fontWeight: '600',
                            color: '#3498db',
                            marginBottom: '6px',
                            fontSize: '0.9em'
                          }}>
                            🔄 {field}
                          </div>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9em',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: 'rgba(231, 76, 60, 0.15)',
                              color: '#ff6b6b',
                              borderRadius: '6px',
                              fontWeight: '500',
                              border: '1px solid rgba(231, 76, 60, 0.3)'
                            }}>
                              {renderChangeValue(change.old)}
                            </span>
                            <span style={{ color: '#5a6268', fontWeight: 'bold' }}>→</span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: 'rgba(46, 204, 113, 0.15)',
                              color: '#2ecc71',
                              borderRadius: '6px',
                              fontWeight: '500',
                              border: '1px solid rgba(46, 204, 113, 0.3)'
                            }}>
                              {renderChangeValue(change.new)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '1px solid #2d3139'
            }}>
              <button
                onClick={closeHistoryModal}
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
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
