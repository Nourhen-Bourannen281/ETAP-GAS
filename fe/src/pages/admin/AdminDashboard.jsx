import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/AdminDashboard.css';

// ============ COMPOSANT KPI CARD ============
const KPICard = ({ title, value, icon, iconClass }) => (
  <div className="kpi-card">
    <div className="kpi-content">
      <div className="kpi-info">
        <div className="kpi-label">{title}</div>
        <div className="kpi-value">{value}</div>
      </div>
      <div className={`kpi-icon ${iconClass}`}>{icon}</div>
    </div>
  </div>
);

// ============ COMPOSANT ALERTES STOCK ============
const StockAlertList = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="stock-card">
        <div className="stock-header">
          <h3><span>⚠️</span> Alertes Stock</h3>
        </div>
        <div className="stock-empty">
          <p>✅ Aucune alerte stock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h3><span>⚠️</span> Alertes Stock ({alerts.length})</h3>
      </div>
      <div className="stock-list">
        {alerts.map((alert, index) => (
          <div key={index} className="stock-item">
            <div className="stock-info">
              <h4>{alert.product?.nom || 'Produit'}</h4>
              <p>Stock: {alert.quantity} | Seuil: {alert.seuilMin}</p>
            </div>
            <div className="stock-percent">
              {Math.round((alert.quantity / alert.seuilMin) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ COMPOSANT TABLEAU COMMANDES ============
const RecentOrdersTable = ({ orders }) => {
  const getStatusClass = (status) => {
    const statusMap = {
      'Attente': 'status-attente',
      'En attente de paiement': 'status-paiement',
      'En attente de validation': 'status-validation',
      'Validée': 'status-validee',
      'Livrée': 'status-livree',
      'Payée': 'status-payee',
      'Refusée': 'status-refusee'
    };
    return statusMap[status] || 'status-attente';
  };

  return (
    <div className="data-card">
      <div className="data-header">
        <h3>📋 Commandes récentes</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6c86a3' }}>
                  Aucune commande
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td><strong>{order.numeroCommande}</strong></td>
                  <td>{order.client?.nom} {order.client?.prenom || ''}</td>
                  <td>{order.montantTotal?.toLocaleString()} TND</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.statut)}`}>
                      {order.statut}
                    </span>
                  </td>
                  <td>{new Date(order.dateCreation).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============ GRAPHIQUE REVENU (Barres + Ligne) CORRIGÉ ============
const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c86a3' }}>
        Aucune donnée de commande disponible
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxOrders = Math.max(...data.map(d => d.orders), 1);

  return (
    <div style={{ height: '280px', width: '100%' }}>
      {/* En-tête du graphique */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '12px', color: '#6c86a3' }}>Commandes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '12px', color: '#6c86a3' }}>CA (TND)</span>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '220px', gap: '12px', padding: '0 8px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {/* Barre des commandes */}
            <div style={{ 
              width: '100%', 
              backgroundColor: '#3b82f6', 
              height: `${(item.orders / maxOrders) * 160}px`,
              borderRadius: '6px 6px 4px 4px',
              transition: 'height 0.3s ease',
              minHeight: '4px'
            }}></div>
            {/* Point du CA */}
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%',
              position: 'relative',
              top: `${(item.revenue / maxRevenue) * 160 - 180}px`
            }}></div>
            {/* Date */}
            <div style={{ fontSize: '11px', textAlign: 'center', color: '#6c86a3', marginTop: '8px' }}>
              <div style={{ fontWeight: 500 }}>{item.date}</div>
              <div style={{ fontSize: '10px' }}>{item.orders} cmd</div>
              <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 500 }}>{item.revenue.toLocaleString()} TND</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ GRAPHIQUE UTILISATEURS PAR RÔLE (Camembert) ============
const UsersByRoleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c86a3' }}>
        Aucun utilisateur
      </div>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  let currentAngle = 0;
  const segments = data.map((item, idx) => {
    const percentage = (item.count / total) * 360;
    const start = currentAngle;
    currentAngle += percentage;
    return { ...item, percentage, start, color: colors[idx % colors.length] };
  });

  // Fonction pour calculer les coordonnées d'un point sur le cercle
  const getCoordinates = (angle, radius = 45) => {
    const radian = (angle - 90) * Math.PI / 180;
    return {
      x: 50 + radius * Math.cos(radian),
      y: 50 + radius * Math.sin(radian)
    };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {segments.map((segment, idx) => {
              const start = getCoordinates(segment.start);
              const end = getCoordinates(segment.start + segment.percentage);
              const largeArc = segment.percentage > 180 ? 1 : 0;
              
              return (
                <path
                  key={idx}
                  d={`M 50 50 L ${start.x} ${start.y} A 45 45 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a2c3e' }}>{total}</div>
            <div style={{ fontSize: '10px', color: '#6c86a3' }}>total</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
        {segments.map((segment, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: segment.color, borderRadius: '2px' }}></div>
            <span><strong>{segment._id}</strong>: {segment.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ ACTIVITÉS RÉCENTES ============
const ActivityLog = ({ activities }) => {
  const getActionIcon = (action) => {
    if (!action) return '📝';
    if (action.includes('création') || action.includes('ajout')) return '➕';
    if (action.includes('modification')) return '✏️';
    if (action.includes('suppression')) return '🗑️';
    if (action.includes('validation')) return '✅';
    return '📝';
  };

  return (
    <div className="data-card">
      <div className="data-header">
        <h3>🔄 Activités récentes</h3>
      </div>
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">Aucune activité récente</div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">{getActionIcon(activity.action)}</div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.utilisateur?.nom || 'Utilisateur'} {activity.utilisateur?.prenom || ''}</strong>
                  {' '}{activity.action || 'Action inconnue'}
                </div>
                {activity.details && <div className="activity-time">{activity.details}</div>}
                <div className="activity-time">
                  {activity.createdAt ? new Date(activity.createdAt).toLocaleString('fr-FR') : 
                   activity.dateCreation ? new Date(activity.dateCreation).toLocaleString('fr-FR') : 
                   'Date inconnue'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============ COMPOSANT PRINCIPAL DASHBOARD ============
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const fetchAllData = async () => {
    try {
      setError(null);
      const token = getToken();
      
      if (!token) {
        console.error('Token non trouvé');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, alertsRes, chartRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats', { headers }),
        axios.get('http://localhost:5000/api/dashboard/stock-alerts', { headers }),
        axios.get('http://localhost:5000/api/dashboard/chart-data', { headers })
      ]);
      
      console.log('Stats reçues:', statsRes.data);
      console.log('Chart data reçues:', chartRes.data);
      
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (alertsRes.data.success) setStockAlerts(alertsRes.data.data);
      if (chartRes.data.success) setChartData(chartRes.data.data);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Chargement du dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Dashboard Administrateur</h1>
        </div>
        <div className="stock-card" style={{ background: '#fee2e2', color: '#dc2626', textAlign: 'center', padding: '40px' }}>
          <p>❌ Erreur: {error}</p>
          <button onClick={fetchAllData} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Administrateur</h1>
        <p>Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Commandes en attente"
          value={stats?.orders?.pending || 0}
          icon="📦"
          iconClass="icon-yellow"
        />
        <KPICard 
          title="Chiffre d'affaires (mois)"
          value={`${(stats?.revenue?.month || 0).toLocaleString()} TND`}
          icon="💰"
          iconClass="icon-green"
        />
        <KPICard 
          title="Alertes stock"
          value={stats?.stock?.lowStockCount || 0}
          icon="⚠️"
          iconClass="icon-red"
        />
        <KPICard 
          title="Utilisateurs actifs"
          value={stats?.users?.active || 0}
          icon="👥"
          iconClass="icon-blue"
        />
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">📈 Évolution (7 derniers jours)</h3>
          <RevenueChart data={chartData} />
        </div>
        <div className="chart-card">
          <h3 className="chart-title">👥 Utilisateurs par rôle</h3>
          <UsersByRoleChart data={stats?.users?.byRole || []} />
        </div>
      </div>

      {/* Alertes Stock */}
      <div className="stock-section">
        <StockAlertList alerts={stockAlerts} />
      </div>

      {/* Tableaux */}
      <div className="tables-grid">
        <RecentOrdersTable orders={stats?.recentOrders || []} />
        <ActivityLog activities={stats?.recentActivities || []} />
      </div>
    </div>
  );
};

export default AdminDashboard;