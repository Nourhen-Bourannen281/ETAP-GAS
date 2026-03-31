import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        motDePasse: password 
      });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user));

      showAlert('success', 'Connexion réussie !');
      setTimeout(() => {
        // ✅ Redirection basée sur le rôle
        if (user.role === 'Admin') {
          navigate('/admin-dashboard');
        } 
        else if (user.role === 'Commercial') {
          navigate('/commercial-dashboard');
        }
        else if (user.role === 'Client') {
          navigate('/client-dashboard');
        }
        else if (user.role === 'Transporteur') {
          navigate('/transporteur-dashboard');
        }
        else {
          // Fallback - pour les autres rôles
          navigate('/dashboard');
        }
      }, 800);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Toast Notifications */}
      {alert.message && (
        <div className={`toast-notification toast-${alert.type}`}>
          {alert.type === 'success' && '✓'}
          {alert.type === 'error' && '✗'}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="login-left">
        <div className="login-icon-wrapper">
          <div className="login-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9L12 3L21 9L12 15L3 9Z" />
              <path d="M3 15L12 21L21 15" />
              <path d="M3 12L12 18L21 12" />
            </svg>
          </div>
        </div>
        <h1>ETAP-GAS</h1>
        <p>Gérez vos opérations gaz avec précision</p>
        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Gestion des stocks</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Suivi des commandes</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Tableau de bord analytics</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <div className="login-header">
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-group">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <div className="input-group">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" /> Se souvenir de moi
              </label>
              <a href="#" className="forgot-link">Mot de passe oublié ?</a>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2024 ETAP-GAS. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;