const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
  getModesPaiement,
  getModePaiementById,
  createModePaiement,
  updateModePaiement,
  deleteModePaiement,
  toggleModePaiement
} = require('../controllers/modePaiementController');

// Routes publiques (accessible à tous les utilisateurs authentifiés)
router.get('/', protect, getModesPaiement);
router.get('/:id', protect, getModePaiementById);

// Routes Admin seulement
router.post('/', protect, authorizeRoles('Admin'), createModePaiement);
router.put('/:id', protect, authorizeRoles('Admin'), updateModePaiement);
router.patch('/:id/toggle', protect, authorizeRoles('Admin'), toggleModePaiement);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteModePaiement);

module.exports = router;