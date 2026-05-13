const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const paiementController = require('../controllers/paiementController');

// Routes publiques (protégées par auth)
router.get('/', protect, paiementController.getPaiements);
router.get('/mes-paiements', protect, paiementController.getMesPaiements);
router.post('/', protect, paiementController.createPaiement);

// Routes Admin seulement
router.patch('/:id/valider', protect, authorizeRoles('Admin'), paiementController.validerPaiement);
router.patch('/:id/rejeter', protect, authorizeRoles('Admin'), paiementController.rejeterPaiement);

module.exports = router;