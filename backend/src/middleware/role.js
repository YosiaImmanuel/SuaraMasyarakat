const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Autentikasi diperlukan.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk fitur ini.' });
    }

    next();
  };
};

module.exports = { checkRole };
