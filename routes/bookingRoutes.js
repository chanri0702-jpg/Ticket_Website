const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const { requireAuth, requireAdmin } = require('../middleware/auth')

router.get('/admin/analytics/', requireAdmin, bookingController.getAdminAnalytics)
// Users may only fetch their own bookings; admins may fetch any
router.get('/user/:email', requireAuth, (req, res, next) => {
  const userEmail = req.session.user && req.session.user.email
  const isAdmin   = req.session.user && req.session.user.role === 'admin'
  if (!isAdmin && req.params.email !== userEmail) {
    return res.status(403).json({ message: 'Not authorised to view these bookings' })
  }
  next()
}, bookingController.getUserBookings)
router.post('/', requireAuth, bookingController.createBooking)
router.delete('/:id', requireAuth, bookingController.cancelBooking)

module.exports = router