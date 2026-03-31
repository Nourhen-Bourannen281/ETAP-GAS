import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Historique.css";

const API = "http://localhost:5000/api";

const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const url =
        role === "admin"
          ? `${API}/historique?entityType=${entityType}&page=${page}&limit=10`
          : `${API}/historique/me`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistorique(role === "admin" ? res.data.data : res.data);
    } catch (err) {
      console.error("Erreur historique:", err.response?.data || err.message);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (role !== "admin") return;

    try {
      const res = await axios.get(`${API}/historique/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistorique();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, page, role]);

  return (
    <div className="historique-page">
      {/* Header */}
      <div className="historique-header">
        <div className="historique-header-content">
          <h1>Historique</h1>
          <p>Suivi des actions sur les commandes, factures, contrats et livraisons</p>
        </div>

        {/* Filtre Admin */}
        {role === "admin" && (
          <div className="historique-filter">
            <label>Filtrer par type</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="Commande">Commande</option>
              <option value="Facture">Facture</option>
              <option value="Contrat">Contrat</option>
              <option value="Livraison">Livraison</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats Admin */}
      {role === "admin" && stats.actionsParType && (
        <div className="historique-stats">
          {stats.actionsParType.map((s) => (
            <div key={s._id} className="stat-card">
              <div className="stat-value">{s.count}</div>
              <div className="stat-label">{s._id}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="historique-table-wrapper">
        {loading ? (
          <div className="loading-block">
            <div className="spinner" />
            <p>Chargement de l&apos;historique...</p>
          </div>
        ) : (
          <table className="historique-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Action</th>
                <th>Statut</th>
                <th>Détails</th>
                <th>Utilisateur</th>
                <th>Date</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    Aucun historique
                  </td>
                </tr>
              ) : (
                historique.map((h) => (
                  <tr key={h._id}>
                    <td className="cell-type">{h.entityType}</td>

                    <td>
                      <span
                        className={`badge-action action-${(h.action || "default")
                          .toLowerCase()}`}
                      >
                        {h.action}
                      </span>
                    </td>

                    <td className="cell-status">
                      {h.ancienStatut && h.nouveauStatut
                        ? `${h.ancienStatut} → ${h.nouveauStatut}`
                        : "-"}
                    </td>

                    <td className="cell-details">{h.details || "-"}</td>

                    <td className="cell-user">
                      {h.utilisateur
                        ? `${h.utilisateur.nom} (${h.utilisateur.email})`
                        : "-"}
                    </td>

                    <td className="cell-date">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>

                    <td className="cell-ip">{h.ipAddress || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Admin */}
      {role === "admin" && (
        <div className="historique-pagination">
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Précédent
          </button>

          <span className="page-indicator">Page {page}</span>

          <button
            className="btn-secondary"
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default Historique;