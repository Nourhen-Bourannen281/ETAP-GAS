// controllers/historiqueController.js
const mongoose = require("mongoose");
const Historique = require("../models/Historique");

// ➜ Ajouter historique
exports.addHistorique = async (data) => {
  try {
    console.log("📜 Création historique:", {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      utilisateur: data.utilisateur
    });

    if (!data.entityType || !data.entityId || !data.action || !data.utilisateur) {
      console.error("❌ Données historiques manquantes:", {
        hasEntityType: !!data.entityType,
        hasEntityId: !!data.entityId,
        hasAction: !!data.action,
        hasUtilisateur: !!data.utilisateur
      });
      return null;
    }

    const historique = await Historique.create(data);
    console.log("✅ Historique créé avec succès:", historique._id);
    return historique;
  } catch (err) {
    console.error("❌ ERREUR CREATION HISTORIQUE:", err.message);
    console.error("Stack:", err.stack);
    return null;
  }
};

// ➜ Admin : tous historiques
exports.getAllHistorique = async (req, res) => {
  try {
    const { limit = 10, page = 1, entityType } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;

    const data = await Historique.find(query)
      .populate("utilisateur", "nom email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const total = await Historique.countDocuments(query);

    res.json({
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➜ Stats
exports.getHistoriqueStats = async (req, res) => {
  try {
    const actionsParType = await Historique.aggregate([
      { $group: { _id: "$entityType", count: { $sum: 1 } } },
    ]);

    res.json({ actionsParType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➜ User connecté
exports.getMyHistorique = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const data = await Historique.find({
      utilisateur: req.user._id,
    })
      .populate("utilisateur", "nom email")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};