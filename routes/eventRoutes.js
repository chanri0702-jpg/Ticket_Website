const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')
const { requireAdmin } = require('../middleware/auth')

router.get('/',      eventController.getAllEvents)  // get all events
router.get('/:id',   eventController.getEventById) // get single event
router.post('/',     requireAdmin, eventController.createEvent)
router.put('/:id',   requireAdmin, eventController.updateEvent)
router.delete('/:id',requireAdmin, eventController.deleteEvent)


module.exports = router