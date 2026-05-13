const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const commandeController = require('../controllers/commandeController');

// Routes de test
router.get('/test', (req, res) => {
  res.json({ message: '✅ Route commandes fonctionne!', timestamp: new Date() });
});

router.get('/check-status', protect, commandeController.checkClientStatus);

// Routes protégées
router.get('/client', protect, authorizeRoles('Client'), commandeController.getClientCommandes);
router.get('/', protect, commandeController.getCommandes);
router.get('/:id', protect, commandeController.getCommandeById);
router.post('/', protect, authorizeRoles('Client'), commandeController.createCommande);
router.patch('/:id', protect, commandeController.updateCommande);
router.patch('/:id/valider', protect, authorizeRoles('Commercial', 'Admin'), commandeController.validerCommande);
router.delete('/:id', protect, authorizeRoles('Admin', 'Commercial'), commandeController.deleteCommande);

module.exports = router;