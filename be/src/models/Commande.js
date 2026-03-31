const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  numeroCommande: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiers', required: true },
  produits: [{
    sousProduit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantite: { type: Number, required: true },
    prixUnitaire: { type: Number, required: true },
    uniteMesure: { type: String, default: 'Litre' }
  }],
  montantTotal: { type: Number, default: 0 },
  statut: { 
    type: String, 
    enum: ['Attente', 'En attente de paiement', 'En attente de validation', 'Validée', 'Refusée', 'Livrée', 'Payée'], 
    default: 'Attente' 
  },
  paiementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' },
  commercial: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateValidation: Date,
  dateCreation: { type: Date, default: Date.now },
  dateModification: Date
});

commandeSchema.pre('save', function (next) {
  if (this.produits && this.produits.length > 0) {
    this.montantTotal = this.produits.reduce((total, item) => {
      return total + (item.quantite * item.prixUnitaire);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Commande', commandeSchema);