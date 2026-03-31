// routes/historiqueRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const ctrl = require("../controllers/historiqueController");

// TEST
router.post("/test", protect, async (req, res) => {
  const Historique = require("../models/Historique");

  const h = await Historique.create({
    entityType: "Commande",
    entityId: new mongoose.Types.ObjectId(),
    action: "Création",
    details: "Test OK",
    utilisateur: req.user._id,
    ipAddress: req.ip,
  });

  res.json(h);
});

// ADMIN (rôle "Admin" cohérent avec le reste)
router.get("/", protect, authorizeRoles("Admin"), ctrl.getAllHistorique);
router.get("/stats", protect, authorizeRoles("Admin"), ctrl.getHistoriqueStats);

// USER
router.get("/me", protect, ctrl.getMyHistorique);

module.exports = router;