const express = require('express')
const router = express.Router()
const enqueryController = require('../controllers/enqueryController')
const { requireAuth, requireAdmin } = require('../middleware/auth')

router.post('/', requireAuth, enqueryController.createQuery)
// Users may only fetch their own enquiries; admins may fetch any
router.get('/user/:email', requireAuth, (req, res, next) => {
  const userEmail = req.session.user && req.session.user.email
  const isAdmin   = req.session.user && req.session.user.role === 'admin'
  if (!isAdmin && req.params.email !== userEmail) {
    return res.status(403).json({ message: 'Not authorised to view these enquiries' })
  }
  next()
}, enqueryController.getUserQueries)
router.get('/', requireAdmin, enqueryController.getAllQueries)
router.put('/:id', requireAdmin, enqueryController.respondToQuery)

module.exports = router