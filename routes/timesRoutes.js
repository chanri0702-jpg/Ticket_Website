const express = require('express')
const router = express.Router()
const timesController = require('../controllers/timesController')

router.get('/event/:eventID', timesController.getTimesByEvent) // get all time slots for an event
router.post('/',              timesController.createTimeSlot)  // admin only
router.delete('/:id',         timesController.deleteTimeSlot)  // admin only

module.exports = router