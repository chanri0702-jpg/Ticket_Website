const Event = require('../models/event')
const Venue = require('../models/venue')

const getEventsPage = async (req, res) => {
  try {
    const events = await Event.find().populate('venueID')
    const venues = await Venue.find()
    res.render('events', { events, venues })
  } catch (err) {
    res.status(500).send('Error loading events page')
  }
}

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
    const { name, description, host, category, venueID, image, price, blockPrices, priceType } = req.body
    const event = new Event({ name, description, host, category, venueID, image, price, blockPrices, priceType })
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

// Upload image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' })
    }
    const cloudinary = require('cloudinary').v2
    const b64 = Buffer.from(req.file.buffer).toString('base64') // convert buffer to base64 string
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64 // create data URI format for Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'ticketstream/events',
      resource_type: 'auto',
      quality: 'auto'
    })

    res.json({ 
      url: result.secure_url,
      message: 'Image uploaded successfully'
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload image', error: err.message })
  }
}

module.exports = { getEventsPage, getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, uploadImage }