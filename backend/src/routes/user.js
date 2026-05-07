const express          = require('express');
const router           = express.Router();
const userController   = require('../controllers/userController');
const { verifyToken }  = require('../middleware/auth');
const { checkRole }    = require('../middleware/role');

const superAdminOnly = [verifyToken, checkRole('super_admin')];

router.get('/',      ...superAdminOnly, userController.getAll);
router.get('/:id',   ...superAdminOnly, userController.getById);
router.post('/',     ...superAdminOnly, userController.create);
router.put('/:id',   ...superAdminOnly, userController.update);
router.delete('/:id',...superAdminOnly, userController.remove);

module.exports = router;