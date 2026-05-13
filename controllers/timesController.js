const Event = require('../models/event')
const Times = require('../models/times')
const Venue = require('../models/venue')

const getTimesPage = async (req, res) => {
  try {
    const events = await Event.find().populate('venueID')
    const venues = await Venue.find()
    const times  = await Times.find().lean()
    res.render('times-admin', { events, venues, times })
  } catch (err) {
    res.status(500).send('Error loading times page')
  }
}

const getTimesByEvent = async (req, res) => {
  try {
    const times = await Times.find({ eventID: req.params.eventID })
    res.json(times)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get time slots', error: err.message })
  }
}

// get single time slot with seat availability
const getTimeSlotById = async (req, res) => {
  try {
    const timeSlot = await Times.findById(req.params.id).populate({
      path: 'eventID',
      populate: {
        path: 'venueID'
      }
    })
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
    res.json(timeSlot)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get time slot', error: err.message })
  }
}

// get seat availability grouped by block
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

//  create time slot (admin only)
const createTimeSlot = async (req, res) => {
  try {
    const { eventID, eventTime, totalSeats, seatsAvailable } = req.body
 
    const event = await Event.findById(eventID).populate('venueID')
    if (!event) return res.status(404).json({ message: 'Event not found' })
 
    const venue = event.venueID
    const seats = venue && venue.seatTemplate && venue.seatTemplate.length > 0
      ? venue.seatTemplate.map(seat => ({
          row:         seat.row,
          seatNumber:  seat.seatNumber,
          block:       seat.block,
          isAvailable: true,
          heldUntil:   null,
          heldBy:      null
        }))
      : []
 
    const timeSlot = new Times({
      eventID,
      eventTime,
      totalSeats:     totalSeats || (venue ? venue.totalSeats : 0),
      seatsAvailable: seatsAvailable || totalSeats || (venue ? venue.totalSeats : 0),
      seats
    })
 
    await timeSlot.save()
    res.status(201).json(timeSlot)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create time slot', error: err.message })
  }
}

// update time slot
const updateTimeSlot = async (req, res) => {
  try {
    const timeSlot = await Times.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
    res.json(timeSlot)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update time slot', error: err.message })
  }
}

//delete time slot (admin only)
const deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await Times.findByIdAndDelete(req.params.id)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
    res.json({ message: 'Time slot deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete time slot', error: err.message })
  }
}

// reserve seats (admin)
const reserveSeats = async (req, res) => {
  try {
    const { seatIds, count } = req.body
    const timeSlot = await Times.findById(req.params.id)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })
 
    if (seatIds && seatIds.length > 0) {
      // layout mode — mark specific seats as reserved
      timeSlot.seats = timeSlot.seats.map(seat => {
        if (seatIds.includes(seat._id.toString())) {
          return { ...seat.toObject(), isAvailable: false, heldBy: '__reserved__' }
        }
        return seat
      })
      timeSlot.seatsAvailable = Math.max(0, timeSlot.seatsAvailable - seatIds.length)
    } else if (count) {
      // no layout mode — just decrement count
      if (count > timeSlot.seatsAvailable) {
        return res.status(400).json({ message: 'Not enough seats available' })
      }
      timeSlot.seatsAvailable = timeSlot.seatsAvailable - count
    }
 
    await timeSlot.save()
    res.json({ message: 'Seats reserved successfully', timeSlot })
  } catch (err) {
    res.status(500).json({ message: 'Failed to reserve seats', error: err.message })
  }
}
 
module.exports = {
  getTimesPage,
  getTimesByEvent,
  getTimeSlotById,
  getBlockAvailability,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  reserveSeats
}