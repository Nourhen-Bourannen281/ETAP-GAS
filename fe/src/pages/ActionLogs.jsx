import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import './ActionLogs.css';

function ActionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState('');
  const token = localStorage.getItem('token');
  
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api', 
    headers: { Authorization: `Bearer ${token}` } 
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/action-logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeClass = (type) => {
    switch(type) {
      case 'CREATE':
        return 'action-create';
      case 'UPDATE':
        return 'action-update';
      case 'DELETE':
        return 'action-delete';
      case 'LOGIN':
        return 'action-login';
      case 'LOGOUT':
        return 'action-logout';
      default:
        return 'action-default';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter && !log.utilisateur?.nom?.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    if (filterType && log.action !== filterType) {
      return false;
    }
    return true;
  });

  if (loading) return <div className="loading">Chargement des journaux...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Journal des Actions</h2>
        <button className="btn-refresh" onClick={fetchLogs}>
          🔄 Actualiser
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Filtrer par utilisateur..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les types</option>
          <option value="CREATE">Création</option>
          <option value="UPDATE">Modification</option>
          <option value="DELETE">Suppression</option>
          <option value="LOGIN">Connexion</option>
          <option value="LOGOUT">Déconnexion</option>
        </select>
      </div>

      <div className="logs-list">
        {filteredLogs.length === 0 ? (
          <div className="no-data">Aucun journal trouvé</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Description</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log._id}>
                  <td>{new Date(log.dateAction).toLocaleString()}</td>
                  <td>
                    <strong>{log.utilisateur?.nom}</strong>
                    <br />
                    <small>{log.utilisateur?.role}</small>
                  </td>
                  <td>
                    <span className={`action-badge ${getActionTypeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.description}</td>
                  <td>{log.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ActionLogs;