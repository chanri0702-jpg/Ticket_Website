const express = require('express')
const router = express.Router()
const timesController = require('../controllers/timesController')

router.get('/event/:eventID',timesController.getTimesByEvent)
router.get('/:id/blocks',timesController.getBlockAvailability)
router.get('/:id',timesController.getTimeSlotById)
router.post('/:id/reserve',timesController.reserveSeats)
router.post('/',timesController.createTimeSlot)
router.put('/:id',timesController.updateTimeSlot)
router.delete('/:id',timesController.deleteTimeSlot)

module.exports = router