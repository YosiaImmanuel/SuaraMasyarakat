const express             = require('express');
const router              = express.Router();
const categoryController  = require('../controllers/categoryController');
const { verifyToken }     = require('../middleware/auth');
const { checkRole }       = require('../middleware/role');

const adminOnly = [verifyToken, checkRole('admin', 'super_admin')];

router.get('/',      verifyToken,  categoryController.getAll);
router.post('/',     ...adminOnly, categoryController.create);
router.put('/:id',   ...adminOnly, categoryController.update);
router.delete('/:id',...adminOnly, categoryController.remove);

module.exports = router;