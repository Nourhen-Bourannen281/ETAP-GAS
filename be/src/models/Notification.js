const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['RetardLivraison', 'PaiementRecu', 'StockBas', 'NouvelleCommande', 'FactureCreee'], 
    required: true 
  },
  message: { type: String, required: true },
  lu: { type: Boolean, default: false },
  dateEnvoi: { type: Date, default: Date.now },
  lien: String                     // Lien vers la page concernée (optionnel)
});

module.exports = mongoose.model('Notification', notificationSchema);