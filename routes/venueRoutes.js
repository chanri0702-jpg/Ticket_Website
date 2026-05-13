const express = require('express')
const router = express.Router()
const venueController = require('../controllers/venueController')
const { requireAdmin } = require('../middleware/auth')

router.get('/', venueController.getAllVenues) // get all venues
router.get('/:id', venueController.getVenueById) // get single venue
router.post('/', requireAdmin, venueController.createVenue)
router.put('/:id', requireAdmin, venueController.updateVenue)
router.delete('/:id', requireAdmin, venueController.deleteVenue)

module.exports = router