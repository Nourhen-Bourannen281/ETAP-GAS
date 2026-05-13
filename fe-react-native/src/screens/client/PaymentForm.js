// src/components/PaymentForm.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';

const PaymentForm = ({
  paymentMethod,
  totalAmount,
  user,
  onPaymentDetailsChange,
  onValidate,
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
    recoltePar: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    const newDetails = { ...paymentDetails, [field]: value };
    setPaymentDetails(newDetails);
    if (onPaymentDetailsChange) {
      onPaymentDetailsChange(newDetails);
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateFields = () => {
    const newErrors = {};

    switch (paymentMethod) {
      case 'cheque':
      case 'Chèque':
        if (!paymentDetails.numeroCheque) newErrors.numeroCheque = 'Numéro de chèque requis';
        if (!paymentDetails.banque) newErrors.banque = 'Banque émettrice requise';
        if (!paymentDetails.dateEmission) newErrors.dateEmission = "Date d'émission requise";
        break;

      case 'Carte Banquaire':
      case 'Carte bancaire':
        const cardNumber = paymentDetails.numeroCarte.replace(/\s/g, '');
        if (!cardNumber || cardNumber.length < 16) {
          newErrors.numeroCarte = 'Numéro de carte invalide (16 chiffres requis)';
        }
        if (!paymentDetails.dateExpiration) newErrors.dateExpiration = "Date d'expiration requise";
        if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
          newErrors.cvv = 'Code CVV requis (3 chiffres)';
        }
        if (!paymentDetails.titulaireCarte) newErrors.titulaireCarte = 'Nom du titulaire requis';
        break;

      case 'espece':
      case 'Espèces':
        if (!paymentDetails.montantRecu || parseFloat(paymentDetails.montantRecu) < totalAmount) {
          newErrors.montantRecu = 'Montant reçu insuffisant';
        }
        if (!paymentDetails.recoltePar) newErrors.recoltePar = 'Nom du récepteur requis';
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPaymentDetailsText = () => {
    switch (paymentMethod) {
      case 'cheque':
      case 'Chèque':
        return {
          text: `Chèque n°${paymentDetails.numeroCheque} - Banque: ${paymentDetails.banque} - Émis le: ${paymentDetails.dateEmission} - Titulaire: ${paymentDetails.titulaireCheque || user?.nom || 'Client'}`,
          reference: `CHQ-${paymentDetails.numeroCheque}`,
        };
      case 'Carte Banquaire':
      case 'Carte bancaire':
        const maskedCard = paymentDetails.numeroCarte.replace(/\s/g, '').slice(-4);
        return {
          text: `Carte bancaire **** **** **** ${maskedCard} - Exp: ${paymentDetails.dateExpiration} - Titulaire: ${paymentDetails.titulaireCarte}`,
          reference: `CARD-${maskedCard}`,
        };
      case 'espece':
      case 'Espèces':
        const change = paymentDetails.montantRecu && parseFloat(paymentDetails.montantRecu) > totalAmount
          ? (parseFloat(paymentDetails.montantRecu) - totalAmount).toFixed(3)
          : 0;
        return {
          text: `Espèces - Montant reçu: ${paymentDetails.montantRecu} ${paymentDetails.monnaie} - Reçu par: ${paymentDetails.recoltePar} - Monnaie à rendre: ${change} ${paymentDetails.monnaie}`,
          reference: `CASH-${Date.now()}`,
        };
      default:
        return { text: '', reference: '' };
    }
  };

  const formatCardNumber = (value) => {
    let cleaned = value.replace(/\s/g, '');
    if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const renderChequeFields = () => (
    <View style={styles.fieldsContainer}>
      <Text style={styles.sectionTitle}>Informations du chèque</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Numéro de chèque *</Text>
        <TextInput
          style={[styles.input, errors.numeroCheque && styles.inputError]}
          placeholder="Ex: 12345678"
          value={paymentDetails.numeroCheque}
          onChangeText={(val) => handleChange('numeroCheque', val)}
          keyboardType="numeric"
        />
        {errors.numeroCheque && <Text style={styles.errorText}>{errors.numeroCheque}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Banque émettrice *</Text>
        <TextInput
          style={[styles.input, errors.banque && styles.inputError]}
          placeholder="Nom de la banque"
          value={paymentDetails.banque}
          onChangeText={(val) => handleChange('banque', val)}
        />
        {errors.banque && <Text style={styles.errorText}>{errors.banque}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date d'émission *</Text>
        <TextInput
          style={[styles.input, errors.dateEmission && styles.inputError]}
          placeholder="YYYY-MM-DD"
          value={paymentDetails.dateEmission}
          onChangeText={(val) => handleChange('dateEmission', val)}
        />
        {errors.dateEmission && <Text style={styles.errorText}>{errors.dateEmission}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Titulaire du chèque</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom du titulaire"
          value={paymentDetails.titulaireCheque || user?.nom}
          onChangeText={(val) => handleChange('titulaireCheque', val)}
        />
      </View>

      <View style={styles.infoNote}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Le chèque doit être libellé à l'ordre de Votre Société SARL
        </Text>
      </View>
    </View>
  );

  const renderCardFields = () => (
    <View style={styles.fieldsContainer}>
      <Text style={styles.sectionTitle}>Informations de la carte bancaire</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Numéro de carte *</Text>
        <TextInput
          style={[styles.input, errors.numeroCarte && styles.inputError]}
          placeholder="1234 5678 9012 3456"
          value={paymentDetails.numeroCarte}
          onChangeText={(val) => handleChange('numeroCarte', formatCardNumber(val))}
          keyboardType="numeric"
          maxLength={19}
        />
        {errors.numeroCarte && <Text style={styles.errorText}>{errors.numeroCarte}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.half]}>
          <Text style={styles.label}>Date d'expiration *</Text>
          <TextInput
            style={[styles.input, errors.dateExpiration && styles.inputError]}
            placeholder="MM/YYYY"
            value={paymentDetails.dateExpiration}
            onChangeText={(val) => handleChange('dateExpiration', val)}
          />
          {errors.dateExpiration && <Text style={styles.errorText}>{errors.dateExpiration}</Text>}
        </View>

        <View style={[styles.formGroup, styles.half]}>
          <Text style={styles.label}>CVV *</Text>
          <TextInput
            style={[styles.input, errors.cvv && styles.inputError]}
            placeholder="123"
            value={paymentDetails.cvv}
            onChangeText={(val) => handleChange('cvv', val)}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
          {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Titulaire de la carte *</Text>
        <TextInput
          style={[styles.input, errors.titulaireCarte && styles.inputError]}
          placeholder="Nom comme sur la carte"
          value={paymentDetails.titulaireCarte}
          onChangeText={(val) => handleChange('titulaireCarte', val)}
        />
        {errors.titulaireCarte && <Text style={styles.errorText}>{errors.titulaireCarte}</Text>}
      </View>

      <View style={styles.securityNote}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Paiement sécurisé par cryptage SSL - Vos données sont protégées
        </Text>
      </View>
    </View>
  );

  const renderCashFields = () => {
    const montantRecu = parseFloat(paymentDetails.montantRecu);
    const change = montantRecu && montantRecu > totalAmount
      ? (montantRecu - totalAmount).toLocaleString()
      : 0;

    return (
      <View style={styles.fieldsContainer}>
        <Text style={styles.sectionTitle}>Paiement en espèces</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Montant reçu *</Text>
          <TextInput
            style={[styles.input, errors.montantRecu && styles.inputError]}
            placeholder={`Montant à payer: ${totalAmount.toLocaleString()} TND`}
            value={paymentDetails.montantRecu}
            onChangeText={(val) => handleChange('montantRecu', val)}
            keyboardType="numeric"
          />
          {errors.montantRecu && <Text style={styles.errorText}>{errors.montantRecu}</Text>}
          {change > 0 && (
            <View style={styles.changeInfo}>
              <Text style={styles.changeText}>
                Monnaie à rendre: {change} {paymentDetails.monnaie}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Monnaie</Text>
          <View style={styles.pickerContainer}>
            {['TND', 'EUR', 'USD'].map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyOption,
                  paymentDetails.monnaie === currency && styles.currencyOptionActive,
                ]}
                onPress={() => handleChange('monnaie', currency)}
              >
                <Text style={[
                  styles.currencyText,
                  paymentDetails.monnaie === currency && styles.currencyTextActive,
                ]}>
                  {currency === 'TND' ? '💰 Dinar Tunisien' : currency === 'EUR' ? '💶 Euro' : '💵 Dollar US'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reçu par *</Text>
          <TextInput
            style={[styles.input, errors.recoltePar && styles.inputError]}
            placeholder="Nom du caissier / récepteur"
            value={paymentDetails.recoltePar}
            onChangeText={(val) => handleChange('recoltePar', val)}
          />
          {errors.recoltePar && <Text style={styles.errorText}>{errors.recoltePar}</Text>}
        </View>

        <View style={styles.cashNote}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.cashNoteText}>Veuillez préparer le montant exact si possible</Text>
        </View>
      </View>
    );
  };

  const renderFields = () => {
    switch (paymentMethod) {
      case 'cheque':
      case 'Chèque':
        return renderChequeFields();
      case 'Carte Banquaire':
      case 'Carte bancaire':
        return renderCardFields();
      case 'espece':
      case 'Espèces':
        return renderCashFields();
      default:
        return (
          <View style={styles.fieldsContainer}>
            <View style={styles.infoNote}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Veuillez sélectionner un mode de paiement pour continuer
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderFields()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  lockIcon: {
    fontSize: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
  },
  cashNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  warningIcon: {
    fontSize: 16,
  },
  cashNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
  },
  changeInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  currencyOptionActive: {
    backgroundColor: '#1e3a8a',
  },
  currencyText: {
    fontSize: 12,
    color: '#64748b',
  },
  currencyTextActive: {
    color: '#fff',
  },
});

export default PaymentForm;