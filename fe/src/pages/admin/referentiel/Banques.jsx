import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Banques.css';

function Banques() {
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    codeSwift: '',
    adresse: '',
    pays: ''
  });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/banques');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement banques:', error);
    }
  };

  const fetchPays = async () => {
    try {
      const res = await api.get('/pays');
      setPays(res.data);
    } catch (error) {
      console.error('Erreur chargement pays:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPays();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.nom.trim()) {
        alert('Le nom de la banque est obligatoire');
        return;
      }

      if (editingId) {
        await api.put(`/banques/${editingId}`, form);
      } else {
        await api.post('/banques', form);
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({
      nom: '',
      codeSwift: '',
      adresse: '',
      pays: ''
    });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      codeSwift: item.codeSwift || '',
      adresse: item.adresse || '',
      pays: item.pays?._id || item.pays || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette banque ?')) {
      try {
        await api.delete(`/banques/${id}`);
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="page-contrats">
      <div className="header-contrats">
        <h2>Banques</h2>
      </div>

      <button 
        className="btn-nouveau"
        onClick={() => {
          setEditingId(null);
          resetForm();
          setShowModal(true);
        }}
      >
        + Nouvelle Banque
      </button>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Code Swift</th>
            <th>Adresse</th>
            <th>Pays</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item._id}>
              <td className="font-medium">{item.nom}</td>
              <td>{item.codeSwift || '-'}</td>
              <td>{item.adresse || '-'}</td>
              <td>{item.pays?.nom || '-'}</td>
              <td className="actions">
                <button onClick={() => handleEdit(item)} className="btn-edit">Modifier</button>
                <button onClick={() => handleDelete(item._id)} className="btn-delete">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px' }}>
            <h3>{editingId ? 'Modifier Banque' : 'Nouvelle Banque'}</h3>

            <div className="form-group">
              <label>Nom de la banque *</label>
              <input
                placeholder="Nom de la banque"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Code Swift</label>
                <input
                  placeholder="Code Swift"
                  value={form.codeSwift}
                  onChange={e => setForm({ ...form, codeSwift: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pays</label>
                <select
                  value={form.pays}
                  onChange={e => setForm({ ...form, pays: e.target.value })}
                >
                  <option value="">Sélectionner un pays</option>
                  {pays.map(p => (
                    <option key={p._id} value={p._id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                placeholder="Adresse complète"
                value={form.adresse}
                onChange={e => setForm({ ...form, adresse: e.target.value })}
              />
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Banques;