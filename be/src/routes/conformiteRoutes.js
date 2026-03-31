const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const conformiteController = require('../controllers/conformiteController');

router.get('/', protect, authorizeRoles('Admin', 'Commercial'), conformiteController.getConformites);
router.get('/stats', protect, authorizeRoles('Admin', 'Commercial'), conformiteController.getStats);
router.get('/:id', protect, authorizeRoles('Admin', 'Commercial'), conformiteController.getConformiteById);
router.post('/', protect, authorizeRoles('Admin', 'Commercial'), conformiteController.createConformite);

module.exports = router;