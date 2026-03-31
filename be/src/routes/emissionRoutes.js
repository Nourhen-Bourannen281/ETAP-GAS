const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const emissionController = require('../controllers/emissionController');

router.get('/', protect, authorizeRoles('Admin', 'Commercial'), emissionController.getEmissions);
router.get('/export/csv', protect, authorizeRoles('Admin', 'Commercial'), emissionController.exportToCSV);
router.get('/:id', protect, authorizeRoles('Admin', 'Commercial'), emissionController.getEmissionById);
router.post('/', protect, authorizeRoles('Admin', 'Commercial'), emissionController.createEmission);
router.put('/:id', protect, authorizeRoles('Admin', 'Commercial'), emissionController.updateEmission);
router.delete('/:id', protect, authorizeRoles('Admin'), emissionController.deleteEmission);
router.patch('/:id/statut', protect, authorizeRoles('Admin', 'Commercial'), emissionController.updateStatut);

module.exports = router;