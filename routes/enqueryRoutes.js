const express = require('express')
const router = express.Router()
const enqueryController = require('../controllers/enqueryController')
const { requireAuth, requireAdmin } = require('../middleware/auth')

router.post('/', requireAuth, enqueryController.createQuery)
router.get('/user/:email', requireAuth, enqueryController.getUserQueries)
router.get('/', requireAdmin, enqueryController.getAllQueries)
router.put('/:id', requireAdmin, enqueryController.respondToQuery)

module.exports = router