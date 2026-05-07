const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')

router.get('/',      eventController.getAllEvents)  // get all events
router.get('/:id',   eventController.getEventById) // get single event
router.post('/',     eventController.createEvent)  // admin only
router.put('/:id',   eventController.updateEvent)  // admin only
router.delete('/:id',eventController.deleteEvent)  // admin only

module.exports = router