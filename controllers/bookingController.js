const Booking = require('../models/booking')
const Times   = require('../models/times')
const Event   = require('../models/event')

// make pages -server
const getBookingPage = async (req, res) => {
  try {
    res.render('booking', { user: req.session.user || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load booking page', error: err.message });
  }
};

const getAdminBookingPage = async (req, res) => {
  try {
    res.render('booking-admin');
  } catch (err) {
    res.status(500).json({ message: 'Failed to load admin booking page', error: err.message });
  }
};

// ─── GET /api/bookings/user/:email ──────────────────────────────────────────
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ email: req.params.email })
      .populate('eventID', 'name description host image price')
      .populate('timeID',  'eventTime')
      .sort({ paydate: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get bookings', error: err.message })
  }
}

// ─── POST /api/bookings ──────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  const { email, eventID, timeID, seats, isGeneralAdmission } = req.body

  if (!email || !eventID || !timeID || !seats || !seats.length) {
    return res.status(400).json({ message: 'Missing required fields: email, eventID, timeID, seats' })
  }

  try {
    const timeSlot = await Times.findById(timeID)
    if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' })

    const event = await Event.findById(eventID)
    if (!event)   return res.status(404).json({ message: 'Event not found' })

    // Capacity check (applies to both assigned and GA venues)
    if (timeSlot.seatsAvailable < seats.length) {
      return res.status(409).json({
        message: `Not enough seats available. Requested: ${seats.length}, Available: ${timeSlot.seatsAvailable}`
      })
    }

    const now         = new Date()
    let   lockedSeats = []

    if (isGeneralAdmission || !timeSlot.seats || timeSlot.seats.length === 0) {
      // ── General admission: no seat map to validate — just decrement count ──
      lockedSeats = seats.map((_, i) => ({
        row:        'GA',
        seatNumber: i + 1,
        block:      'General'
      }))
    } else {
      // ── Assigned seating: validate and lock each requested seat ──
      for (const requested of seats) {
        const seat = timeSlot.seats.find(
          s => s.row        === requested.row       &&
               s.seatNumber === requested.seatNumber &&
               s.block      === requested.block
        )

        if (!seat) {
          return res.status(404).json({
            message: `Seat ${requested.block} ${requested.row}${requested.seatNumber} not found`
          })
        }

        const isHeldByOther =
          seat.heldUntil && seat.heldUntil > now && seat.heldBy !== email

        if (!seat.isAvailable || isHeldByOther) {
          return res.status(409).json({
            message: `Seat ${requested.block} ${requested.row}${requested.seatNumber} is not available`
          })
        }

        seat.isAvailable = false
        seat.heldUntil   = null
        seat.heldBy      = null
        lockedSeats.push({ row: seat.row, seatNumber: seat.seatNumber, block: seat.block })
      }
    }

    // Update available count and save time slot
    timeSlot.seatsAvailable -= seats.length
    await timeSlot.save()

    // Calculate total (supports per-block pricing)
    let total
    if (event.priceType === 'custom' && event.blockPrices && event.blockPrices.size > 0) {
      total = lockedSeats.reduce((sum, s) => {
        const blockPrice = event.blockPrices.get(s.block) ?? event.price
        return sum + blockPrice
      }, 0)
    } else {
      total = event.price * seats.length
    }
    total = parseFloat(total.toFixed(2))

    const booking = new Booking({
      paydate: now,
      email,
      total,
      eventID,
      timeID,
      tickets: lockedSeats
    })

    await booking.save()

    const populated = await booking.populate([
      { path: 'eventID', select: 'name description host image price' },
      { path: 'timeID',  select: 'eventTime' }
    ])

    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking', error: err.message })
  }
}

// ─── DELETE /api/bookings/:id ─────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const userEmail = req.session.user && req.session.user.email
    const isAdmin   = req.session.user && req.session.user.role === 'admin'
    if (!isAdmin && booking.email !== userEmail) {
      return res.status(403).json({ message: 'Not authorised to cancel this booking' })
    }

    // Release seats back to the time slot
    const timeSlot = await Times.findById(booking.timeID)
    if (timeSlot) {
      const isGA = booking.tickets.length > 0 &&
                   booking.tickets[0].block === 'General' &&
                   booking.tickets[0].row   === 'GA'

      if (!isGA && timeSlot.seats && timeSlot.seats.length > 0) {
        // Assigned seating — restore individual seat availability
        for (const ticket of booking.tickets) {
          const seat = timeSlot.seats.find(
            s => s.row        === ticket.row       &&
                 s.seatNumber === ticket.seatNumber &&
                 s.block      === ticket.block
          )
          if (seat) {
            seat.isAvailable = true
            seat.heldUntil   = null
            seat.heldBy      = null
          }
        }
      }
      // For GA venues, just restore the count (no individual seats to unlock)
      timeSlot.seatsAvailable += booking.tickets.length
      await timeSlot.save()
    }

    await Booking.findByIdAndDelete(req.params.id)
    res.json({ message: 'Booking cancelled successfully', refund: booking.total })
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel booking', error: err.message })
  }
}

// ─── GET /api/bookings/admin/analytics ───────────────────────────────────────
const getAdminAnalytics = async (req, res) => {
  try {
    const totals = await Booking.aggregate([
      {
        $group: {
          _id:          null,
          totalBookings: { $sum: 1 },
          totalRevenue:  { $sum: '$total' },
          totalTickets:  { $sum: { $size: '$tickets' } }
        }
      }
    ])

    const popularEvents = await Booking.aggregate([
      {
        $group: {
          _id:          '$eventID',
          bookingCount: { $sum: 1 },
          ticketCount:  { $sum: { $size: '$tickets' } },
          revenue:      { $sum: '$total' }
        }
      },
      { $sort: { ticketCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'events', localField: '_id', foreignField: '_id', as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $project: {
          eventName:    '$event.name',
          host:         '$event.host',
          bookingCount: 1,
          ticketCount:  1,
          revenue:      1
        }
      }
    ])

    const capacityUsage = await Times.aggregate([
      {
        $project: {
          eventID:        1,
          eventTime:      1,
          totalSeats:     1,
          seatsAvailable: 1,
          seatsUsed:      { $subtract: ['$totalSeats', '$seatsAvailable'] },
          usagePercent: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalSeats', '$seatsAvailable'] }, '$totalSeats'] },
              100
            ]
          }
        }
      },
      { $sort: { usagePercent: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'events', localField: 'eventID', foreignField: '_id', as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $project: {
          eventName:      '$event.name',
          eventTime:      1,
          totalSeats:     1,
          seatsAvailable: 1,
          seatsUsed:      1,
          usagePercent:   1
        }
      }
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const bookingsOverTime = await Booking.aggregate([
      { $match: { paydate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$paydate' } },
          count:   { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      summary:         totals[0] || { totalBookings: 0, totalRevenue: 0, totalTickets: 0 },
      popularEvents,
      capacityUsage,
      bookingsOverTime
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to get analytics', error: err.message })
  }
}

module.exports = {
  getUserBookings,
  createBooking,
  cancelBooking,
  getAdminAnalytics,
  getBookingPage,
  getAdminBookingPage
}