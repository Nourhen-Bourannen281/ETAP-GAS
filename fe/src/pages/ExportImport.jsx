import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ExportImport.css';

function ExportImport() {
  const [emissions, setEmissions] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('emissions');
  const [toasts, setToasts] = useState([]);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [emissionsRes, receptionsRes] = await Promise.all([
        api.get('/emissions'),
        api.get('/receptions')
      ]);
      setEmissions(emissionsRes.data);
      setReceptions(receptionsRes.data);
    } catch (error) {
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXPORT EXCEL
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/export/${activeTab}/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast(`Export ${activeTab} vers Excel réussi`, 'success');
    } catch (error) {
      addToast('Erreur export Excel', 'error');
    }
  };

  // ✅ EXPORT PDF
  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/export/${activeTab}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast(`Export ${activeTab} vers PDF réussi`, 'success');
    } catch (error) {
      addToast('Erreur export PDF', 'error');
    }
  };

  // ✅ SUPPRESSION
  const handleDelete = async (type, id, numero) => {
    if (window.confirm(`Supprimer ${numero} ?`)) {
      try {
        await api.delete(`/${type}/${id}`);
        addToast('Supprimé avec succès', 'success');
        fetchAllData();
      } catch (error) {
        addToast('Erreur suppression', 'error');
      }
    }
  };

  const currentList = activeTab === 'emissions' ? emissions : receptions;

  return (
    <div className="export-page">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="export-header">
        <div className="header-left">
          <h2>Export / Import</h2>
          <p>Gestion des données d&apos;exportation et d&apos;importation</p>
        </div>
      </div>

      {/* Actions - Export uniquement */}
      <div className="export-actions">
        <button
          className="btn-excel"
          onClick={handleExportExcel}
          disabled={loading || !currentList.length}
        >
          📊 Exporter Excel
        </button>
        <button
          className="btn-pdf"
          onClick={handleExportPDF}
          disabled={loading || !currentList.length}
        >
          📄 Exporter PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="export-tabs">
        <button
          className={`tab-btn ${activeTab === 'emissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emissions')}
        >
          📤 Émissions ({emissions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'receptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('receptions')}
        >
          📥 Réceptions ({receptions.length})
        </button>
      </div>

      {/* Table */}
      <div className="export-table-wrapper">
        {loading ? (
          <div className="loading-block">
            <div className="spinner" />
            <p>Chargement...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h4>Aucune donnée</h4>
            <p>
              Aucune {activeTab === 'emissions' ? 'émission' : 'réception'} enregistrée pour le moment.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Contrat</th>
                <th>{activeTab === 'emissions' ? 'Destination' : 'Origine'}</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map(item => (
                <tr key={item._id}>
                  <td><strong>{item.numeroEmission || item.numeroReception}</strong></td>
                  <td className={item.contrat ? 'associated' : 'not-associated'}>
                    {item.contrat?.numeroContrat || 'Non associé'}
                  </td>
                  <td>
                    {activeTab === 'emissions'
                      ? item.destination?.nom || '-'
                      : item.origine?.nom || '-'}
                  </td>
                  <td>{new Date(item.dateEmission || item.dateReception).toLocaleDateString()}</td>
                  <td className={`status-badge status-${item.statut || 'default'}`}>
                    {item.statut || '-'}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-delete"
                      onClick={() =>
                        handleDelete(
                          activeTab,
                          item._id,
                          item.numeroEmission || item.numeroReception
                        )
                      }
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ExportImport;