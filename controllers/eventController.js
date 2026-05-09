const Event = require('../models/event')

// GET /api/events - get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('venueID')
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get events', error: err.message })
  }
}

// GET /api/events/:id - get single event
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('venueID')
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get event', error: err.message })
  }
}

// POST /api/events - create event (admin only)
const createEvent = async (req, res) => {
  try {
    const { name, description, host, image, price, venueID } = req.body
    const event = new Event({ name, description, host, image, price, venueID })
    await event.save()
    res.status(201).json(event)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message })
  }
}

// PUT /api/events/:id - update event (admin only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // returns updated document instead of old one
    )
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message })
  }
}

// DELETE /api/events/:id - delete event (admin only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json({ message: 'Event deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message })
  }
}

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent }