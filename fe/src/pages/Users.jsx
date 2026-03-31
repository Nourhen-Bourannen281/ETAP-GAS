import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'Client', motDePasse: '' });
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, userId: null, action: null });

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      addToast('Erreur lors du chargement des utilisateurs', 'error');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async () => {
    try {
      if (editUser) {
        await api.put(`/users/${editUser._id}`, form);
        addToast('Utilisateur modifié avec succès', 'success');
      } else {
        await api.post('/users', form);
        addToast('Utilisateur créé avec succès', 'success');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      addToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      addToast('Statut utilisateur modifié', 'info');
      fetchUsers();
    } catch (error) {
      addToast('Erreur lors du changement de statut', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      addToast('Utilisateur supprimé avec succès', 'success');
      fetchUsers();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
    setConfirmDialog({ show: false, userId: null, action: null });
  };

  const getInitials = (nom, prenom) => {
    return `${nom?.charAt(0) || ''}${prenom?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'badge-admin';
      case 'Commercial': return 'badge-commercial';
      case 'Client': return 'badge-client';
      case 'Transporteur': return 'badge-transporteur';
      case 'Fournisseur': return 'badge-fournisseur';
      default: return '';
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.nom} ${user.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeUsers = users.filter(user => user.actif).length;
  const inactiveUsers = users.filter(user => !user.actif).length;

  return (
    <div className="users-page">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✗'}
            {toast.type === 'info' && 'ℹ'}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div className="users-header-left">
            <h2>Gestion des Utilisateurs</h2>
            <p>Gérez les comptes et les permissions</p>
          </div>
          <div className="users-stats">
            <div className="stat-card">
              <div className="stat-number">{users.length}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{activeUsers}</div>
              <div className="stat-label">Actifs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{inactiveUsers}</div>
              <div className="stat-label">Inactifs</div>
            </div>
          </div>
          <button className="btn-add-user" onClick={() => { setEditUser(null); setForm({ nom: '', prenom: '', email: '', role: 'Client', motDePasse: '' }); setShowModal(true); }}>
            <span>+</span> Nouvel utilisateur
          </button>
        </div>

        {/* Table */}
        <div className="users-table-wrapper">
          <div className="users-table-toolbar">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar-sm">
                        {getInitials(user.nom, user.prenom)}
                      </div>
                      <div>
                        <div className="user-name">{user.nom} {user.prenom}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-dot ${user.actif ? 'active' : 'inactive'}`}>
                      {user.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action toggle-active"
                        onClick={() => handleToggle(user._id)}
                        title={user.actif ? 'Désactiver' : 'Activer'}
                      >
                        {user.actif ? '🔴' : '🟢'}
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => { setEditUser(user); setForm({ ...user, motDePasse: '' }); setShowModal(true); }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action danger"
                        onClick={() => setConfirmDialog({ show: true, userId: user._id, action: 'delete' })}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</h3>
            <div className="form-group">
              <label>Nom</label>
              <input
                placeholder="Nom"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                placeholder="Prénom"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="Admin">Admin</option>
                <option value="Commercial">Commercial</option>
                <option value="Client">Client</option>
                <option value="Transporteur">Transporteur</option>
                <option value="Fournisseur">Fournisseur</option>
              </select>
            </div>
            {!editUser && (
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={form.motDePasse}
                  onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                />
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-save" onClick={handleSave}>Enregistrer</button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog({ show: false, userId: null, action: null })}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">
              ⚠️
            </div>
            <h4>Confirmer la suppression</h4>
            <p>Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?</p>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={() => handleDelete(confirmDialog.userId)}>
                Supprimer
              </button>
              <button className="btn-cancel" onClick={() => setConfirmDialog({ show: false, userId: null, action: null })}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}