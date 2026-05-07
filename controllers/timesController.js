const Event = require('../models/event')
const Times = require('../models/times')

const createTimeSlot = async (req, res) => {
  const { eventID, eventTime } = req.body

  const event = await Event.findById(eventID).populate('venueID')
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
  res.json(timeSlot)
}

module.exports = { createTimeSlot }