const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ utilisateur: req.user.id })
      .sort({ dateEnvoi: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.marquerCommeLu = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { lu: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};