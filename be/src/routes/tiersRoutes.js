const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const tiersController = require('../controllers/tiersController');

// Routes existantes
router.get('/', protect, tiersController.getTiers);
router.get('/client', protect, authorizeRoles('Client'), tiersController.getClientByUser);
router.get('/:id', protect, tiersController.getTiersById);
router.post('/', protect, authorizeRoles('Admin'), tiersController.createTiers);
router.put('/:id', protect, authorizeRoles('Admin'), tiersController.updateTiers);
router.delete('/:id', protect, authorizeRoles('Admin'), tiersController.deleteTiers);

module.exports = router;