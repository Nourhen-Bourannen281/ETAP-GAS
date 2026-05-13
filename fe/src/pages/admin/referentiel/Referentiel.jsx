import React, { useState } from 'react';
import TypeProduits from './TypeProduits';
import SousProduits from './SousProduits';
import Pays from './Pays';
import Banques from './Banques';
import Navires from './Navires';
import ModesPaiement from './ModesPaiement';
import TypesFacture from './TypesFacture';
import Products from './Products';
import '../../../css/Referentiels.css';

function Referentiel() {
  const [activeTab, setActiveTab] = useState('type-produits');

  const tabs = [
    { id: 'type-produits', label: 'Types de Produits' },
    { id: 'sous-produits', label: 'Sous-Produits' },
    { id: 'pays', label: 'Pays' },
    { id: 'banques', label: 'Banques' },
    { id: 'navires', label: 'Navires' },
    { id: 'modes-paiement', label: 'Modes de Paiement' },
    { id: 'types-facture', label: 'Types de Facture' },
    { id: 'products', label: 'Produits' }
  ];

  const tabComponents = {
    'type-produits': <TypeProduits />,
    'sous-produits': <SousProduits />,
    'pays': <Pays />,
    'banques': <Banques />,
    'navires': <Navires />,
    'modes-paiement': <ModesPaiement />,
    'types-facture': <TypesFacture />,
    'products': <Products />
  };

  const currentComponent = tabComponents[activeTab];

  return (
    <main className="page-referentiels">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-title">
            <h1>Gestion du Référentiel</h1>
            <p className="page-subtitle">Paramétrage général de l'application</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs-container">
        <div className="tabs-wrapper">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu actif */}
      <div className="tab-content">
        {currentComponent}
      </div>
    </main>
  );
}

export default Referentiel;