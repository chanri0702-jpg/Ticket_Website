const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')

router.get('/user/:email', bookingController.getUserBookings) // get all bookings for a user
router.post('/',           bookingController.createBooking)   // create a booking
router.delete('/:id',      bookingController.cancelBooking)   // cancel a booking

module.exports = router