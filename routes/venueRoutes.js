const express = require('express')
const router = express.Router()
const venueController = require('../controllers/venueController')

router.get('/', venueController.getAllVenues) // get all venues
router.get('/:id', venueController.getVenueById) // get single venue
router.post('/', venueController.createVenue)  // admin only
router.put('/:id', venueController.updateVenue)  // admin only
router.delete('/:id', venueController.deleteVenue)  // admin only

module.exports = router