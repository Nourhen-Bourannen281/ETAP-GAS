import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Ref.css';

function TypeProduits() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '' });

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    const res = await api.get('/type-produits');
    setData(res.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await api.put(`/type-produits/${editingId}`, form);
    } else {
      await api.post('/type-produits', form);
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ nom: '', description: '' });
    fetchData();
  };

  return (
    <div className="page-pays">

      <div className="page-header">
        <div className="page-header-content">
          <h1>Types Produits</h1>
          <p className="page-subtitle">Gestion des catégories produits</p>
        </div>
      </div>

      <div className="page-actions">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nouveau type
        </button>
      </div>

      <div className="table-container">
        <div className="table-card">

          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map(item => (
                <tr key={item._id}>
                  <td className="cell-text">{item.nom}</td>
                  <td>{item.description}</td>
                  <td className="cell-actions">

                    <button className="btn-edit" onClick={() => {
                      setEditingId(item._id);
                      setForm(item);
                      setShowModal(true);
                    }}>
                      Modifier
                    </button>

                    <button className="btn-delete" onClick={() => api.delete(`/type-produits/${item._id}`)}>
                      Supprimer
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h3>{editingId ? 'Modifier' : 'Ajouter'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nom</label>
                <input value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave}>Enregistrer</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default TypeProduits;