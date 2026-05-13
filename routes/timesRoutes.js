const express = require('express')
const router = express.Router()
const timesController = require('../controllers/timesController')
const { requireAdmin } = require('../middleware/auth')

router.get('/event/:eventID',timesController.getTimesByEvent)
router.get('/:id/blocks',timesController.getBlockAvailability)
router.get('/:id',timesController.getTimeSlotById)
router.post('/:id/reserve',requireAdmin, timesController.reserveSeats)
router.post('/',requireAdmin, timesController.createTimeSlot)
router.put('/:id',requireAdmin, timesController.updateTimeSlot)
router.delete('/:id',requireAdmin, timesController.deleteTimeSlot)

module.exports = router