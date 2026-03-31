import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Conformite.css';

function Conformite() {
  const [conformites, setConformites] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conformitesRes, statsRes] = await Promise.all([
        api.get('/conformites'),
        api.get('/conformites/stats')
      ]);
      setConformites(conformitesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des conformités:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="conformite-page">
      {/* Header */}
      <div className="conformite-header">
        <div className="header-left">
          <h2>Conformité Douanière</h2>
          <p>Vérification automatique des documents et contrôles douaniers</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="conformite-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total || 0}</div>
          <div className="stat-label">Total contrôles</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.conforme || 0}</div>
          <div className="stat-label">✅ Conformes</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.nonConforme || 0}</div>
          <div className="stat-label">❌ Non conformes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.douane || 0}</div>
          <div className="stat-label">Contrôles douane</div>
        </div>
      </div>

      {/* Table */}
      <div className="conformite-table-wrapper">
        {loading ? (
          <div className="loading-block">
            <div className="spinner" />
            <p>Chargement des contrôles de conformité...</p>
          </div>
        ) : conformites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h4>Aucun contrôle enregistré</h4>
            <p>Les vérifications automatiques apparaîtront ici.</p>
          </div>
        ) : (
          <table className="conformite-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type de contrôle</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Commentaire</th>
                <th>Vérifié par</th>
              </tr>
            </thead>
            <tbody>
              {conformites.map((c) => (
                <tr key={c._id}>
                  <td>{c.document?.type || '-'}</td>
                  <td>{c.typeControle}</td>
                  <td>
                    <span
                      className={
                        c.statut === 'Conforme'
                          ? 'status-badge status-conforme'
                          : 'status-badge status-nonconforme'
                      }
                    >
                      {c.statut}
                    </span>
                  </td>
                  <td>{new Date(c.dateControle).toLocaleString('fr-FR')}</td>
                  <td className="cell-comment">{c.commentaire || '-'}</td>
                  <td>
                    {c.verifiePar?.nom ? (
                      c.verifiePar.nom
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                        🤖 Système automatique
                      </span>
                    )}
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

export default Conformite;