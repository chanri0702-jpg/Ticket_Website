const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const { requireAuth, requireAdmin } = require('../middleware/auth')

router.get('/admin/analytics/', requireAdmin, bookingController.getAdminAnalytics)
router.get('/user/:email', requireAuth, bookingController.getUserBookings)
router.post('/', requireAuth, bookingController.createBooking)
router.delete('/:id', requireAuth, bookingController.cancelBooking)

module.exports = router