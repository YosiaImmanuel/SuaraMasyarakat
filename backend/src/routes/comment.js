const express            = require('express');
const router             = express.Router();
const commentController  = require('../controllers/commentController');
const { verifyToken }    = require('../middleware/auth');

router.get('/laporan/:laporanId', verifyToken, commentController.getByLaporan);
router.post('/',                  verifyToken, commentController.create);
router.delete('/:id',             verifyToken, commentController.remove);

module.exports = router;