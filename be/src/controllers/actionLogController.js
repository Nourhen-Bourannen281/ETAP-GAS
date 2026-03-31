const ActionLog = require('../models/ActionLog');

exports.getActionLogs = async (req, res) => {
  try {
    const logs = await ActionLog.find()
      .populate('utilisateur', 'nom prenom role')
      .sort({ dateAction: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};