import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Ref.css';

function Pays() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', nom: '' });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/pays');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement pays:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.nom.trim() || !form.code.trim()) {
        alert('Code et Nom sont obligatoires');
        return;
      }

      if (editingId) {
        await api.put(`/pays/${editingId}`, form);
      } else {
        await api.post('/pays', form);
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ code: '', nom: '' });
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ code: item.code, nom: item.nom });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce pays ?')) {
      try {
        await api.delete(`/pays/${id}`);
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <main className="page-pays">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Gestion des Pays</h1>
          <p className="page-subtitle">Référentiel des pays disponibles</p>
        </div>
      </div>

      {/* Bouton Nouveau */}
      <div className="page-actions">
        <button 
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm({ code: '', nom: '' });
            setShowModal(true);
          }}
        >
          + Nouveau Pays
        </button>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code ISO</th>
                <th>Nom du Pays</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item._id}>
                  <td>
                    <div className="cell-code">
                      <strong>{item.code}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="cell-text">
                      {item.nom}
                    </div>
                  </td>
                  <td className="cell-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(item)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(item._id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="empty-state">
              <p>Aucun pays enregistré</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier Pays' : 'Nouveau Pays'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Code ISO *</label>
                <input
                  placeholder="Ex: TN, FR, DZ, US"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
              <div className="form-group">
                <label>Nom du pays *</label>
                <input
                  placeholder="Nom complet du pays"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Pays;