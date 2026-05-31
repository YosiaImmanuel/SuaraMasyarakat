const express           = require('express');
const router            = express.Router();
const laporanController = require('../controllers/laporanController');
const { verifyToken }   = require('../middleware/auth');
const { checkRole }     = require('../middleware/role');
const upload            = require('../middleware/upload');

router.get('/',           verifyToken, laporanController.getAll);
router.get('/:id',        verifyToken, laporanController.getById);
router.post('/',          verifyToken, upload.array('gambar[]', 10), laporanController.create);
router.put('/:id',        verifyToken, upload.array('gambar[]', 10), laporanController.update);
router.patch('/:id/status', verifyToken, checkRole('admin', 'super_admin'), laporanController.updateStatus);
router.delete('/:id',     verifyToken, laporanController.remove);

module.exports = router;