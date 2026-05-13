// routes/factureRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const factureController = require('../controllers/factureController');

// Routes accessibles à tous les utilisateurs authentifiés
// (les données sont filtrées selon le rôle dans le contrôleur)
router.get('/', protect, factureController.getFactures);
router.get('/stats', protect, factureController.getFacturesStats);
router.get('/:id', protect, factureController.getFactureById);
router.get('/:id/pdf', protect, factureController.exportFacturePDF);

// Routes réservées à Admin et Commercial
router.post('/', protect, authorizeRoles('Admin', 'Commercial'), factureController.createFacture);
router.patch('/:id/statut', protect, authorizeRoles('Admin', 'Commercial'), factureController.updateStatut);

// Routes réservées à Admin seulement
router.delete('/:id', protect, authorizeRoles('Admin'), factureController.deleteFacture);

module.exports = router;