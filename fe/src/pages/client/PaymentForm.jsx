import React, { useState } from 'react';

const PaymentForm = ({ 
  paymentMethod, 
  totalAmount, 
  user, 
  onPaymentDetailsChange,
  onValidate 
}) => {
  const [paymentDetails, setPaymentDetails] = useState({
    // Chèque
    numeroCheque: '',
    banque: '',
    dateEmission: '',
    titulaireCheque: '',
    
    // Carte bancaire
    numeroCarte: '',
    dateExpiration: '',
    cvv: '',
    titulaireCarte: '',
    
    // Espèces
    montantRecu: '',
    monnaie: 'TND',
    recoltePar: ''
  });

  const handleChange = (field, value) => {
    const newDetails = { ...paymentDetails, [field]: value };
    setPaymentDetails(newDetails);
    if (onPaymentDetailsChange) {
      onPaymentDetailsChange(newDetails);
    }
  };

  const validateFields = () => {
    switch(paymentMethod) {
      case 'cheque':
      case 'Chèque':
        if (!paymentDetails.numeroCheque) return 'Numéro de chèque requis';
        if (!paymentDetails.banque) return 'Banque émettrice requise';
        if (!paymentDetails.dateEmission) return 'Date d\'émission requise';
        break;
        
      case 'Carte Banquaire':
      case 'Carte bancaire':
        const cardNumber = paymentDetails.numeroCarte.replace(/\s/g, '');
        if (!cardNumber || cardNumber.length < 16) {
          return 'Numéro de carte invalide (16 chiffres requis)';
        }
        if (!paymentDetails.dateExpiration) return 'Date d\'expiration requise';
        if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
          return 'Code CVV requis (3 chiffres)';
        }
        if (!paymentDetails.titulaireCarte) return 'Nom du titulaire requis';
        break;
        
      case 'espece':
      case 'Espèces':
        if (!paymentDetails.montantRecu || parseFloat(paymentDetails.montantRecu) < totalAmount) {
          return 'Montant reçu insuffisant';
        }
        if (!paymentDetails.recoltePar) return 'Nom du récepteur requis';
        break;
        
      default:
        return null;
    }
    return null;
  };

  const getPaymentDetailsText = () => {
    switch(paymentMethod) {
      case 'cheque':
      case 'Chèque':
        return {
          text: `Chèque n°${paymentDetails.numeroCheque} - Banque: ${paymentDetails.banque} - Émis le: ${paymentDetails.dateEmission} - Titulaire: ${paymentDetails.titulaireCheque || user.nom}`,
          reference: `CHQ-${paymentDetails.numeroCheque}`
        };
      case 'Carte Banquaire':
      case 'Carte bancaire':
        const maskedCard = paymentDetails.numeroCarte.replace(/\s/g, '').slice(-4);
        return {
          text: `Carte bancaire **** **** **** ${maskedCard} - Exp: ${paymentDetails.dateExpiration} - Titulaire: ${paymentDetails.titulaireCarte}`,
          reference: `CARD-${maskedCard}`
        };
      case 'espece':
      case 'Espèces':
        return {
          text: `Espèces - Montant reçu: ${paymentDetails.montantRecu} ${paymentDetails.monnaie} - Reçu par: ${paymentDetails.recoltePar} - Monnaie à rendre: ${(parseFloat(paymentDetails.montantRecu) - totalAmount).toFixed(3)} ${paymentDetails.monnaie}`,
          reference: `CASH-${Date.now()}`
        };
      default:
        return { text: '', reference: '' };
    }
  };

  const renderFields = () => {
    switch(paymentMethod) {
      case 'cheque':
      case 'Chèque':
        return (
          <div className="payment-fields">
            <h4>Informations du chèque</h4>
            <div className="form-group">
              <label>Numéro de chèque *</label>
              <input 
                type="text" 
                value={paymentDetails.numeroCheque}
                onChange={(e) => handleChange('numeroCheque', e.target.value)}
                placeholder="Ex: 12345678"
                className="payment-input"
              />
            </div>
            <div className="form-group">
              <label>Banque émettrice *</label>
              <input 
                type="text" 
                value={paymentDetails.banque}
                onChange={(e) => handleChange('banque', e.target.value)}
                placeholder="Nom de la banque"
                className="payment-input"
              />
            </div>
            <div className="form-group">
              <label>Date d'émission *</label>
              <input 
                type="date" 
                value={paymentDetails.dateEmission}
                onChange={(e) => handleChange('dateEmission', e.target.value)}
                className="payment-input"
              />
            </div>
            <div className="form-group">
              <label>Titulaire du chèque</label>
              <input 
                type="text" 
                value={paymentDetails.titulaireCheque || user.nom}
                onChange={(e) => handleChange('titulaireCheque', e.target.value)}
                placeholder="Nom du titulaire"
                className="payment-input"
              />
            </div>
            <div className="info-note">
              <span className="info-icon">ℹ️</span>
              <small>Le chèque doit être libellé à l'ordre de Votre Société SARL</small>
            </div>
          </div>
        );
        
      case 'Carte Banquaire':
      case 'Carte bancaire':
        return (
          <div className="payment-fields">
            <h4>Informations de la carte bancaire</h4>
            <div className="form-group">
              <label>Numéro de carte *</label>
              <input 
                type="text" 
                value={paymentDetails.numeroCarte}
                onChange={(e) => {
                  let value = e.target.value.replace(/\s/g, '');
                  if (value.length > 16) value = value.slice(0, 16);
                  const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  handleChange('numeroCarte', formatted);
                }}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="payment-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Date d'expiration *</label>
                <input 
                  type="month" 
                  value={paymentDetails.dateExpiration}
                  onChange={(e) => handleChange('dateExpiration', e.target.value)}
                  className="payment-input"
                />
              </div>
              <div className="form-group half">
                <label>CVV *</label>
                <input 
                  type="password" 
                  value={paymentDetails.cvv}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 4) value = value.slice(0, 4);
                    handleChange('cvv', value);
                  }}
                  placeholder="123"
                  maxLength="4"
                  className="payment-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Titulaire de la carte *</label>
              <input 
                type="text" 
                value={paymentDetails.titulaireCarte}
                onChange={(e) => handleChange('titulaireCarte', e.target.value)}
                placeholder="Nom comme sur la carte"
                className="payment-input"
              />
            </div>
            <div className="security-note">
              <span className="lock-icon">🔒</span>
              <small>Paiement sécurisé par cryptage SSL - Vos données sont protégées</small>
            </div>
          </div>
        );
        
      case 'espece':
      case 'Espèces':
        const change = paymentDetails.montantRecu && parseFloat(paymentDetails.montantRecu) > totalAmount 
          ? (parseFloat(paymentDetails.montantRecu) - totalAmount).toLocaleString() 
          : 0;
        
        return (
          <div className="payment-fields">
            <h4>Paiement en espèces</h4>
            <div className="form-group">
              <label>Montant reçu *</label>
              <input 
                type="number" 
                value={paymentDetails.montantRecu}
                onChange={(e) => handleChange('montantRecu', e.target.value)}
                placeholder={`Montant à payer: ${totalAmount.toLocaleString()} TND`}
                min={totalAmount}
                step="0.001"
                className="payment-input"
              />
              {change > 0 && (
                <div className="change-info">
                  Monnaie à rendre: {change} {paymentDetails.monnaie}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Monnaie</label>
              <select 
                value={paymentDetails.monnaie}
                onChange={(e) => handleChange('monnaie', e.target.value)}
                className="payment-input"
              >
                <option value="TND">Dinar Tunisien (TND)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar US (USD)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reçu par *</label>
              <input 
                type="text" 
                value={paymentDetails.recoltePar}
                onChange={(e) => handleChange('recoltePar', e.target.value)}
                placeholder="Nom du caissier / récepteur"
                className="payment-input"
              />
            </div>
            <div className="cash-note">
              <span className="warning-icon">⚠️</span>
              <small>Veuillez préparer le montant exact si possible</small>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="payment-fields">
            <div className="info-note">
              <span className="info-icon">ℹ️</span>
              <small>Veuillez sélectionner un mode de paiement pour continuer</small>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="payment-form-container">
      {renderFields()}
    </div>
  );
};

export default PaymentForm;