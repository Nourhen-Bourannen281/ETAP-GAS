import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ExportImport.css';

function ExportImport() {
  const [emissions, setEmissions] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('emissions');
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedContrat, setSelectedContrat] = useState('');
  const [formData, setFormData] = useState({ numero: '', contrat: '', pays: '', date: '' });
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
      const [emissionsRes, receptionsRes, contratsRes, paysRes] = await Promise.all([
        api.get('/emissions'),
        api.get('/receptions'),
        api.get('/contrats'),
        api.get('/pays')
      ]);
      setEmissions(emissionsRes.data);
      setReceptions(receptionsRes.data);
      setContrats(contratsRes.data);
      setPays(paysRes.data);
    } catch (error) {
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/export/${type}/${format}`, {
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
      a.download = `${type}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast(`Export ${type} vers ${format.toUpperCase()} réussi`, 'success');
    } catch (error) {
      addToast('Erreur export', 'error');
    }
  };

  const handleImport = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      setLoading(true);
      await api.post(`/import/${type}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast(`Import ${type} réussi`, 'success');
      fetchAllData();
    } catch (error) {
      addToast('Erreur import', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedItem || !selectedContrat) {
      addToast('Sélectionnez un contrat', 'error');
      return;
    }

    try {
      await api.patch(
        `/associate/${activeTab === 'emissions' ? 'emission' : 'reception'}/${selectedItem._id}`,
        { contratId: selectedContrat }
      );
      addToast('Association réussie', 'success');
      setShowAssociateModal(false);
      setSelectedContrat('');
      setSelectedItem(null);
      fetchAllData();
    } catch (error) {
      addToast('Erreur association', 'error');
    }
  };

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

      {/* Actions */}
      <div className="export-actions">
        <button
          className="btn-excel"
          onClick={() => handleExport(activeTab, 'excel')}
          disabled={loading || !currentList.length}
        >
          📊 Exporter Excel
        </button>
        <button
          className="btn-pdf"
          onClick={() => handleExport(activeTab, 'pdf')}
          disabled={loading || !currentList.length}
        >
          📄 Exporter PDF
        </button>
        <label className="btn-import">
          📥 Importer Excel
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => handleImport(e, activeTab)}
            hidden
          />
        </label>
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
                    {!item.contrat && (
                      <button
                        className="btn-associate"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAssociateModal(true);
                        }}
                      >
                        🔗 Associer
                      </button>
                    )}
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
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal association */}
      {showAssociateModal && (
        <div className="modal-overlay" onClick={() => setShowAssociateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Associer un contrat</h3>
              <button
                className="modal-close"
                onClick={() => setShowAssociateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Contrat *</label>
                <select
                  value={selectedContrat}
                  onChange={e => setSelectedContrat(e.target.value)}
                >
                  <option value="">-- Choisir un contrat --</option>
                  {contrats.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.numeroContrat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowAssociateModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn-save"
                onClick={handleAssociate}
              >
                Associer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportImport;