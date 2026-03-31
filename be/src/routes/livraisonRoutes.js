const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const livraisonController = require('../controllers/livraisonController');

// Routes de lecture
router.get('/', protect, livraisonController.getLivraisons);

// Routes de création (Commercial et Admin)
router.post(
  '/from-commande/:commandeId', 
  protect, 
  authorizeRoles('Commercial', 'Admin'), 
  livraisonController.createLivraisonFromCommande
);

// Routes de mise à jour d'état (Commercial, Admin, Transporteur)
router.patch(
  '/:id/etat', 
  protect, 
  authorizeRoles('Commercial', 'Admin', 'Transporteur'), 
  livraisonController.updateEtatLivraison
);

// Route d'assignation de transporteur (Admin seulement)
router.patch(
  '/:id/assign-transporteur', 
  protect, 
  authorizeRoles('Admin'), 
  livraisonController.assignTransporteur
);

// Route de génération PDF (tous les utilisateurs avec droits)
router.get(
  '/:id/pdf', 
  protect, 
  livraisonController.generateBonLivraisonPDF
);

module.exports = router;