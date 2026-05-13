import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/Tiers.css';;   // Même fichier CSS pour conserver le thème

function Tiers() {
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [banques, setBanques] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, client, fournisseur

  const [form, setForm] = useState({
    raisonSociale: '',
    type: 0,
    adresse: '',
    email: '',
    telephone: '',
    matriculeFiscale: '',
    pays: '',
    banque: ''
  });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/tiers');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement tiers:', error);
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

  const fetchBanques = async () => {
    try {
      const res = await api.get('/banques');
      setBanques(res.data);
    } catch (error) {
      console.error('Erreur chargement banques:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPays();
    fetchBanques();
  }, []);

  const filteredData = () => {
    if (filterType === 'client') return data.filter(item => item.type === 0);
    if (filterType === 'fournisseur') return data.filter(item => item.type === 1);
    return data;
  };

  const handleSave = async () => {
    try {
      if (!form.raisonSociale.trim()) {
        alert('La raison sociale est obligatoire');
        return;
      }

      if (editingId) {
        await api.put(`/tiers/${editingId}`, form);
      } else {
        await api.post('/tiers', form);
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
      raisonSociale: '',
      type: 0,
      adresse: '',
      email: '',
      telephone: '',
      matriculeFiscale: '',
      pays: '',
      banque: ''
    });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      raisonSociale: item.raisonSociale,
      type: item.type,
      adresse: item.adresse || '',
      email: item.email || '',
      telephone: item.telephone || '',
      matriculeFiscale: item.matriculeFiscale || '',
      pays: item.pays?._id || item.pays || '',
      banque: item.banque?._id || item.banque || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce tiers ?')) {
      try {
        await api.delete(`/tiers/${id}`);
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
        <h2>Tiers (Clients & Fournisseurs)</h2>
        <button 
          className="btn-nouveau"
          onClick={() => {
            setEditingId(null);
            resetForm();
            setShowModal(true);
          }}
        >
          + Nouveau Tiers
        </button>
      </div>

      {/* Filtres */}
      <div className="filters">
        <button 
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          Tous
        </button>
        <button 
          className={`filter-btn ${filterType === 'client' ? 'active' : ''}`}
          onClick={() => setFilterType('client')}
        >
          Clients
        </button>
        <button 
          className={`filter-btn ${filterType === 'fournisseur' ? 'active' : ''}`}
          onClick={() => setFilterType('fournisseur')}
        >
          Fournisseurs
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Raison Sociale</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Matricule Fiscale</th>
            <th>Pays</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData().map(item => (
            <tr key={item._id}>
              <td>
                <span className={item.type === 0 ? 'type-client' : 'type-fournisseur'}>
                  {item.type === 0 ? 'Client' : 'Fournisseur'}
                </span>
              </td>
              <td className="font-medium">{item.raisonSociale}</td>
              <td>{item.email || '-'}</td>
              <td>{item.telephone || '-'}</td>
              <td>{item.matriculeFiscale || '-'}</td>
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
          <div className="modal" style={{ width: '520px' }}>
            <h3>{editingId ? 'Modifier Tiers' : 'Nouveau Tiers'}</h3>

            <div className="form-group">
              <label>Type de tiers</label>
              <select 
                value={form.type} 
                onChange={e => setForm({ ...form, type: parseInt(e.target.value) })}
              >
                <option value={0}>Client</option>
                <option value={1}>Fournisseur</option>
              </select>
            </div>

            <div className="form-group">
              <label>Raison Sociale *</label>
              <input
                placeholder="Raison Sociale"
                value={form.raisonSociale}
                onChange={e => setForm({ ...form, raisonSociale: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  placeholder="Téléphone"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                />
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

            <div className="form-group">
              <label>Matricule Fiscale</label>
              <input
                placeholder="Matricule Fiscale"
                value={form.matriculeFiscale}
                onChange={e => setForm({ ...form, matriculeFiscale: e.target.value })}
              />
            </div>

            <div className="form-row">
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
                <label>Banque</label>
                <select 
                  value={form.banque} 
                  onChange={e => setForm({ ...form, banque: e.target.value })}
                >
                  <option value="">Sélectionner une banque</option>
                  {banques.map(b => (
                    <option key={b._id} value={b._id}>{b.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleSave}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tiers;