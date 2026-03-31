import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api', 
    headers: { Authorization: `Bearer ${token}` } 
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/lu`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Notifications</h2>
        {notifications.some(n => !n.lu) && (
          <button className="btn-primary" onClick={markAllAsRead}>
            Tout marquer comme lu
          </button>
        )}
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-data">Aucune notification</div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className={`notification-item ${notif.lu ? 'read' : 'unread'}`}>
              <div className="notif-content">
                <strong>{notif.type}</strong>
                <p>{notif.message}</p>
                <small>{new Date(notif.dateEnvoi).toLocaleString()}</small>
              </div>
              <div className="notif-actions">
                {!notif.lu && (
                  <button className="btn-small btn-read" onClick={() => markAsRead(notif._id)}>
                    Marquer comme lu
                  </button>
                )}
                <button className="btn-small btn-delete" onClick={() => deleteNotification(notif._id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;