const mongoose = require("mongoose");

const historiqueSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["Livraison", "Facture", "Commande", "Contrat"],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    action: {
      type: String,
      enum: ["Création", "Modification", "Changement statut", "Suppression"],
      required: true,
    },

    ancienStatut: String,
    nouveauStatut: String,
    details: String,

    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Historique", historiqueSchema);