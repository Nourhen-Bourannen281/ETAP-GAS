import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/Landing.css';

function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">
      {/* Navigation de Luxe */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">Gas<span>Pro</span></Link>
          <ul className="landing-nav-links">
            <li><a href="#features">Expertise</a></li>
            <li><a href="#stats">Performance</a></li>
            <li><a href="#cta">Contact</a></li>
          </ul>
          <Link to="/login" className="landing-cta-nav">Portail Client</Link>
        </div>
      </nav>

      {/* Hero Section - Luxury Engineering Style */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Plateforme Officielle ETAP</div>
          <h1>Gérez votre stock avec <span>précision et élégance</span></h1>
          <p>
            ETAP-GAS simplifie la gestion de vos hydrocarbures, contrats et opérations logistiques 
            en une seule plateforme intuitive de haute ingénierie.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-hero-primary">
              Accéder au Dashboard
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <a href="#features" className="btn-hero-secondary">Explorer les flux</a>
          </div>
        </div>
      </section>

      {/* Features - Grid Technique */}
      <section className="features" id="features">
        <div className="section-header">
          <div className="section-label">Solutions Avancées</div>
          <h2>Maîtrise Totale de la Chaîne Gazière</h2>
          <p>Une architecture logicielle robuste pour des opérations sans compromis.</p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3>Gestion des Contrats</h3>
            <p>Suivi automatisé des contrats d'achat et de vente avec calcul précis des volumes de Gaz, Butane et Propane.</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <h3>Inventaire Stratégique</h3>
            <p>Visualisation en temps réel des stocks critiques par site et alertes prédictives sur les seuils de sécurité.</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3>Pilotage Commercial</h3>
            <p>Cycle de commande complet : de la validation commerciale à l'affectation des transporteurs logistiques.</p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Suivi Douanier</h3>
            <p>Traçabilité totale des cargaisons avec contrôle automatique de la conformité des documents de transport.</p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h3>Facturation Multidevise</h3>
            <p>Génération de factures proforma et définitives en TND et USD avec gestion des taxes et pénalités.</p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L22 22"/>
              </svg>
            </div>
            <h3>Analyse Décisionnelle</h3>
            <p>Tableaux de bord dynamiques offrant une vision panoramique sur les performances financières et logistiques.</p>
          </div>
        </div>
      </section>

      {/* Stats - Engineering Performance */}
      <section className="stats" id="stats">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>100%</h3>
            <p>Digitalisation des Flux</p>
          </div>
          <div className="stat-item">
            <h3>&lt; 2h</h3>
            <p>Traitement des Commandes</p>
          </div>
          <div className="stat-item">
            <h3>Multi</h3>
            <p>Devises (TND / USD)</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Monitoring Stocks</p>
          </div>
        </div>
      </section>

      {/* CTA Section - Final Luxury Touch */}
      <section className="cta-section" id="cta">
        <div className="cta-card">
          <h2>Prêt à optimiser vos ressources ?</h2>
          <p>Rejoignez l'écosystème ETAP-GAS et transformez vos opérations commerciales en un avantage stratégique.</p>
          <Link to="/login" className="btn-hero-primary">
            Commencer l'expérience
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer - Professional Minimalist */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>© 2026 ETAP-GAS — Système de Gestion Intégré. Tous droits réservés.</p>
          <p className="footer-credit">Propulsé par l'Ingénierie MERN</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;