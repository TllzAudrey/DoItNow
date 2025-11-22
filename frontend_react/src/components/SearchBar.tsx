import React, { useState, useEffect } from 'react';

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Rechercher une tâche, un contenu ou un auteur..." 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce: attendre 200ms après la dernière frappe avant de chercher
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 200);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div style={{
      position: 'relative',
      marginBottom: '25px'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{
          position: 'absolute',
          left: '15px',
          fontSize: '1.2em',
          color: '#8b93a1',
          pointerEvents: 'none'
        }}>
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '14px 50px 14px 50px',
            fontSize: '0.95em',
            border: '2px solid #2d3139',
            borderRadius: '12px',
            backgroundColor: '#252930',
            color: '#e8eaed',
            outline: 'none',
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
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2em',
              color: '#8b93a1',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e8eaed'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8b93a1'}
            title="Effacer"
          >
            ✕
          </button>
        )}
      </div>
      {searchQuery && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.85em',
          color: '#8b93a1',
          paddingLeft: '15px'
        }}>
          Recherche en cours pour: <strong style={{ color: '#3498db' }}>"{searchQuery}"</strong>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

