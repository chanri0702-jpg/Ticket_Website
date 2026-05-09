const Booking = require('../models/booking')
const Times = require('../models/times')

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ email: req.params.email })
      .populate('eventID')
      .populate('timeID')
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get bookings', error: err.message })
  }
}

const createBooking = async (req, res) => {
  try {
    const { email, eventID, timeID, tickets, total } = req.body
    
    const booking = new Booking({
      paydate: new Date(),
      email,
      total,
      eventID,
      timeID,
      tickets
    })

    const timeSlot = await Times.findById(timeID)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })

    tickets.forEach(ticket => {
      const seat = timeSlot.seats.find(s => s.row === ticket.row && s.seatNumber === ticket.seatNumber)
      if (seat) {
        seat.isAvailable = false
      }
    })

    timeSlot.seatsAvailable -= tickets.length
    
    await timeSlot.save()
    await booking.save()
    
    res.status(201).json(booking)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking', error: err.message })
  }
}

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const timeSlot = await Times.findById(booking.timeID)
    if (timeSlot) {
      booking.tickets.forEach(ticket => {
        const seat = timeSlot.seats.find(s => s.row === ticket.row && s.seatNumber === ticket.seatNumber)
        if (seat) {
          seat.isAvailable = true
        }
      })
      timeSlot.seatsAvailable += booking.tickets.length
      await timeSlot.save()
    }

    await Booking.findByIdAndDelete(req.params.id)
    res.json({ message: 'Booking cancelled successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel booking', error: err.message })
  }
}

module.exports = { getUserBookings, createBooking, cancelBooking }
