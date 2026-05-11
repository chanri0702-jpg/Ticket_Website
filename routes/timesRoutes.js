const express = require('express')
const router = express.Router()
const timesController = require('../controllers/timesController')

router.get('/event/:eventID', timesController.getTimesByEvent)    // all slots for an event
router.get('/:id',timesController.getTimeSlotById)    // single time slot
router.get('/:id/blocks',timesController.getBlockAvailability) // seat availability by block
router.post('/',timesController.createTimeSlot)     // create time slot
router.delete('/:id',timesController.deleteTimeSlot) 

module.exports = router