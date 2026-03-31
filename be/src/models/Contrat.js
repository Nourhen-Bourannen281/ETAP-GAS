// models/Contrat.js
const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
  numeroContrat: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Vente', 'Achat'], required: true },
  dateDebut: { type: Date, default: Date.now },
  dateFin: { type: Date },
  tiers: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiers', required: true },
  produits: [{
    sousProduit: { type: mongoose.Schema.Types.ObjectId, ref: 'SousProduit', required: true },
    quantite: { type: Number, required: true, min: 1 },
    prixUnitaire: { type: Number, required: true, min: 0 }
  }],
  devise: { type: String, default: 'TND' },
  statut: { type: String, enum: ['En cours', 'Validé', 'Terminé', 'Renouvelé'], default: 'En cours' },
  montantTotal: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateCreation: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calcul automatique du montantTotal avant sauvegarde
contratSchema.pre('save', function (next) {
  if (this.produits && this.produits.length > 0) {
    this.montantTotal = this.produits.reduce((total, item) => {
      return total + (item.quantite * item.prixUnitaire);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Contrat', contratSchema);