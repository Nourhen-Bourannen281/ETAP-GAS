const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getDashboardStats,
  getStockAlerts,
  getChartData,
  getOrdersByStatus,
  getMonthlyRevenue,
  getQuickStats
} = require('../controllers/dashboardController');

// Middleware d'authentification pour toutes les routes
router.use(protect);

// Middleware vérification Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès réservé aux administrateurs' 
    });
  }
  next();
};

// Routes Dashboard (toutes nécessitent d'être Admin)
router.use(isAdmin);

// Routes principales
router.get('/stats', getDashboardStats);
router.get('/stock-alerts', getStockAlerts);
router.get('/chart-data', getChartData);

// Routes supplémentaires
router.get('/orders-by-status', getOrdersByStatus);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/quick-stats', getQuickStats);

module.exports = router;