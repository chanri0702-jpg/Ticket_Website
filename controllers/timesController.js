const Event = require('../models/event')
const Times = require('../models/times')

// GET /api/times/event/:eventID - get all time slots for an event
const getTimesByEvent = async (req, res) => {
  try {
    const times = await Times.find({ eventID: req.params.eventID })
    if (!times) return res.status(404).json({ message: 'No time slots found' })
    res.json(times)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get time slots', error: err.message })
  }
}

// GET /api/times/:id - get single time slot with seat availability
const getTimeSlotById = async (req, res) => {
  try {
    const timeSlot = await Times.findById(req.params.id).populate('eventID')
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
    res.json(timeSlot)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get time slot', error: err.message })
  }
}

// GET /api/times/:id/blocks - get seat availability grouped by block
const getBlockAvailability = async (req, res) => {
  try {
    const timeSlot = await Times.findById(req.params.id)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })

    // group seats by block and count available seats
    const blocks = timeSlot.seats.reduce((groups, seat) => {
      if (!groups[seat.block]) {
        groups[seat.block] = { total: 0, available: 0 }
      }
      groups[seat.block].total++
      if (seat.isAvailable) groups[seat.block].available++
      return groups
    }, {})

    res.json(blocks)
    // returns something like:
    // { VIP: { total: 6, available: 4 }, Floor: { total: 6, available: 6 } }
  } catch (err) {
    res.status(500).json({ message: 'Failed to get block availability', error: err.message })
  }
}

// POST /api/times - create time slot (admin only)
const createTimeSlot = async (req, res) => {
  try {
    const { eventID, eventTime } = req.body

    const event = await Event.findById(eventID).populate('venueID')
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const venue = event.venueID

    const seats = venue.seatTemplate.map(seat => ({
      row:         seat.row,
      seatNumber:  seat.seatNumber,
      block:       seat.block,
      isAvailable: true,
      heldUntil:   null,
      heldBy:      null
    }))

    const timeSlot = new Times({
      eventID,
      eventTime,
      totalSeats:     venue.totalSeats,
      seatsAvailable: venue.totalSeats,
      seats
    })

    await timeSlot.save()
    res.status(201).json(timeSlot)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create time slot', error: err.message })
  }
}

// DELETE /api/times/:id - delete time slot (admin only)
const deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await Times.findByIdAndDelete(req.params.id)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
    res.json({ message: 'Time slot deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete time slot', error: err.message })
  }
}

module.exports = { getTimesByEvent, getTimeSlotById, getBlockAvailability, createTimeSlot, deleteTimeSlot }