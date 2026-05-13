const User = require('../models/User');
const Stock = require('../models/Stock');
const Commande = require('../models/Commande');
const Notification = require('../models/Notification');
const ActionLog = require('../models/ActionLog');
const Tiers = require('../models/Tiers');

// ==================== STATS PRINCIPALES DU DASHBOARD ====================
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Récupération des stats dashboard...');

    // 1. STATISTIQUES UTILISATEURS
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ actif: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 2. STATISTIQUES STOCK
    const stocks = await Stock.find().populate('product');
    const lowStockProducts = stocks.filter(s => s.quantity <= s.seuilMin && s.seuilMin > 0);
    const totalStockValue = stocks.reduce((sum, s) => sum + (s.quantity * (s.product?.prixUnitaire || 0)), 0);

    // 3. STATISTIQUES COMMANDES
    // Commandes en attente (tous les statuts "Attente")
    const pendingOrders = await Commande.countDocuments({ 
      statut: { $in: ['Attente', 'En attente de paiement', 'En attente de validation'] } 
    });
    
    // Commandes livrées
    const deliveredOrders = await Commande.countDocuments({ statut: 'Livrée' });
    
    // Commandes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Commande.countDocuments({ dateCreation: { $gte: today } });

    // 4. STATISTIQUES REVENUS (CA)
    // CA du jour (commandes Payées ou Validées)
    const todayRevenue = await Commande.aggregate([
      { 
        $match: { 
          statut: { $in: ['Payée', 'Validée'] },
          dateCreation: { $gte: today } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$montantTotal' } } }
    ]);

    // CA du mois (commandes Payées ou Validées)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthRevenue = await Commande.aggregate([
      { 
        $match: { 
          statut: { $in: ['Payée', 'Validée'] },
          dateCreation: { $gte: monthStart } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$montantTotal' } } }
    ]);

    // CA total (toutes commandes Payées ou Validées)
    const totalRevenue = await Commande.aggregate([
      { 
        $match: { 
          statut: { $in: ['Payée', 'Validée'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$montantTotal' } } }
    ]);

    // 5. COMMANDES RÉCENTES
    const recentOrders = await Commande.find()
      .sort({ dateCreation: -1 })
      .limit(10)
      .populate('client', 'nom prenom email')
      .populate('produits.sousProduit', 'nom');

    // 6. ACTIVITÉS RÉCENTES
    let recentActivities = [];
    try {
      recentActivities = await ActionLog.find()
        .sort({ dateCreation: -1 })
        .limit(20)
        .populate('utilisateur', 'nom prenom email');
    } catch (err) {
      console.log('⚠️ ActionLog model non trouvé ou vide');
    }

    // 7. NOTIFICATIONS RÉCENTES
    let recentNotifications = [];
    try {
      recentNotifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'nom prenom email');
    } catch (err) {
      console.log('⚠️ Notification model non trouvé ou vide');
    }

    // RÉPONSE FINALE
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: usersByRole
        },
        stock: {
          totalProducts: stocks.length,
          lowStockCount: lowStockProducts.length,
          lowStockProducts: lowStockProducts.map(s => ({
            id: s._id,
            productName: s.product?.nom || 'Produit',
            quantity: s.quantity,
            seuilMin: s.seuilMin,
            percentage: Math.round((s.quantity / s.seuilMin) * 100)
          })),
          totalValue: totalStockValue
        },
        orders: {
          pending: pendingOrders,
          delivered: deliveredOrders,
          today: todayOrders,
          total: await Commande.countDocuments()
        },
        revenue: {
          today: todayRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0,
          total: totalRevenue[0]?.total || 0
        },
        recentOrders,
        recentActivities,
        recentNotifications
      }
    });
  } catch (error) {
    console.error('❌ Erreur dans getDashboardStats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== ALERTES STOCK ====================
// Get real-time stock alerts
exports.getStockAlerts = async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('product');  // Enlevez le populate fournisseur qui n'existe pas
    
    const lowStock = stocks.filter(s => s.quantity <= s.seuilMin && s.seuilMin > 0);
    
    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('Erreur getStockAlerts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DONNÉES POUR GRAPHIQUES (7 derniers jours) ====================
exports.getChartData = async (req, res) => {
  try {
    console.log('📈 Récupération des données graphiques...');
    
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // Nombre de commandes par jour
      const orders = await Commande.countDocuments({
        dateCreation: { $gte: date, $lt: nextDate }
      });
      
      // Chiffre d'affaires par jour (commandes Payées ou Validées)
      const revenue = await Commande.aggregate([
        { 
          $match: { 
            statut: { $in: ['Payée', 'Validée'] },
            dateCreation: { $gte: date, $lt: nextDate } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$montantTotal' } } }
      ]);
      
      // Nombre de commandes en attente par jour
      const pendingOrders = await Commande.countDocuments({
        statut: { $in: ['Attente', 'En attente de paiement', 'En attente de validation'] },
        dateCreation: { $gte: date, $lt: nextDate }
      });
      
      last7Days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        orders,
        revenue: revenue[0]?.total || 0,
        pending: pendingOrders
      });
    }
    
    console.log('✅ Données graphiques prêtes:', last7Days);
    
    res.json({ 
      success: true, 
      data: last7Days,
      summary: {
        totalOrders: last7Days.reduce((sum, d) => sum + d.orders, 0),
        totalRevenue: last7Days.reduce((sum, d) => sum + d.revenue, 0),
        averageOrders: Math.round(last7Days.reduce((sum, d) => sum + d.orders, 0) / 7)
      }
    });
  } catch (error) {
    console.error('❌ Erreur dans getChartData:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ==================== STATS COMMANDES PAR STATUT ====================
exports.getOrdersByStatus = async (req, res) => {
  try {
    const statusStats = await Commande.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ success: true, data: statusStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== STATS REVENUS PAR MOIS (DERNIERS 12 MOIS) ====================
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const revenue = await Commande.aggregate([
        { 
          $match: { 
            statut: { $in: ['Payée', 'Validée'] },
            dateCreation: { $gte: monthStart, $lte: monthEnd } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$montantTotal' } } }
      ]);
      
      months.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: revenue[0]?.total || 0
      });
    }
    
    res.json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DASHBOARD RAPIDE (POUR API APPEL FREQUENT) ====================
exports.getQuickStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingOrders,
      lowStockCount,
      monthRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Commande.countDocuments({ statut: { $in: ['Attente', 'En attente de paiement', 'En attente de validation'] } }),
      Stock.countDocuments({ $expr: { $lte: ['$quantity', '$seuilMin'] } }),
      Commande.aggregate([
        { 
          $match: { 
            statut: { $in: ['Payée', 'Validée'] },
            dateCreation: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$montantTotal' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        users: totalUsers,
        pendingOrders,
        lowStock: lowStockCount,
        revenue: monthRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};