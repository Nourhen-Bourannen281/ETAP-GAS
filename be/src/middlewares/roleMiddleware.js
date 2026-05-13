// middlewares/roleMiddleware.js
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    // Vérifier si le rôle de l'utilisateur est dans les rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Accès refusé. Rôle requis: ${roles.join(', ')}`,
        votreRôle: req.user.role
      });
    }
    
    next();
  };
};

module.exports = { authorizeRoles };