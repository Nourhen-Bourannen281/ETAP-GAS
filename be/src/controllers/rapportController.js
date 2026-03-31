const Facture = require('../models/Facture');
const Commande = require('../models/Commande');
const Livraison = require('../models/Livraison');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalFactures = await Facture.countDocuments();
    const totalCommandes = await Commande.countDocuments();
    const totalLivraisons = await Livraison.countDocuments();
    const caMois = await Facture.aggregate([
      { $match: { statut: 'Payée' } },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } }
    ]);

    res.json({
      totalFactures,
      totalCommandes,
      totalLivraisons,
      caMois: caMois[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};