const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const rapportController = require('../controllers/rapportController');

router.get('/stats', protect, rapportController.getDashboardStats);

module.exports = router;