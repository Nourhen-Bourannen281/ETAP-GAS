import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Navires.css';

function Navires() {
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    immatriculation: '',
    capacite: '',
    pays: '',
    proprietaire: ''
  });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/navires');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement navires:', error);
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
        alert('Le nom du navire est obligatoire');
        return;
      }

      if (editingId) {
        await api.put(`/navires/${editingId}`, form);
      } else {
        await api.post('/navires', form);
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
      immatriculation: '',
      capacite: '',
      pays: '',
      proprietaire: ''
    });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      immatriculation: item.immatriculation || '',
      capacite: item.capacite || '',
      pays: item.pays?._id || item.pays || '',
      proprietaire: item.proprietaire || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce navire ?')) {
      try {
        await api.delete(`/navires/${id}`);
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
        <h2>Navires</h2>
      </div>

      <button 
        className="btn-nouveau"
        onClick={() => {
          setEditingId(null);
          resetForm();
          setShowModal(true);
        }}
      >
        + Nouveau Navire
      </button>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Immatriculation</th>
            <th>Capacité (T)</th>
            <th>Pays</th>
            <th>Propriétaire</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item._id}>
              <td className="font-medium">{item.nom}</td>
              <td>{item.immatriculation || '-'}</td>
              <td>{item.capacite ? `${item.capacite} T` : '-'}</td>
              <td>{item.pays?.nom || '-'}</td>
              <td>{item.proprietaire || '-'}</td>
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
            <h3>{editingId ? 'Modifier Navire' : 'Nouveau Navire'}</h3>

            <div className="form-group">
              <label>Nom du navire *</label>
              <input
                placeholder="Nom du navire"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Immatriculation</label>
                <input
                  placeholder="Immatriculation"
                  value={form.immatriculation}
                  onChange={e => setForm({ ...form, immatriculation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Capacité (Tonnes)</label>
                <input
                  type="number"
                  placeholder="Capacité en tonnes"
                  value={form.capacite}
                  onChange={e => setForm({ ...form, capacite: e.target.value })}
                />
              </div>
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

            <div className="form-group">
              <label>Propriétaire</label>
              <input
                placeholder="Nom du propriétaire"
                value={form.proprietaire}
                onChange={e => setForm({ ...form, proprietaire: e.target.value })}
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

export default Navires;