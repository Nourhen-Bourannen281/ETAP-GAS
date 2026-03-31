const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/', protect, notificationController.getNotifications);
router.patch('/:id/lu', protect, notificationController.marquerCommeLu);

module.exports = router;