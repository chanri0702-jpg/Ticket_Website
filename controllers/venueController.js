const Venue = require('../models/venue')

const getVenuesPage = async (req, res) => {
  try {
    const venues = await Venue.find()
    res.render('venues', { venues })
  } catch (err) {
    res.status(500).send('Error loading venues page')
  }
}

const getAllVenues = async (req, res) => {
  try {
    const venues = await Venue.find()
    res.json(venues)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get venues', error: err.message })
  }
}

const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
    if (!venue) return res.status(404).json({ message: 'Venue not found' })
    res.json(venue)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get venue', error: err.message })
  }
}

const createVenue = async (req, res) => {
  try {
    const { name, address1, address2, zip, totalSeats, seatTemplate, layoutImage } = req.body
    if (seatTemplate && seatTemplate.length > 0) {
      const rows = {};
      seatTemplate.forEach(seat => { rows[`${seat.block}_${seat.row}`] = (rows[`${seat.block}_${seat.row}`] || 0) + 1; });
      if (Object.values(rows).some(count => count > 40)) {
        return res.status(400).json({ message: 'Seats per row cannot exceed 40.' });
      }
    }
    const venue = new Venue({ name, address1, address2, zip, totalSeats, seatTemplate, layoutImage })
    await venue.save()
    res.status(201).json(venue)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create venue', error: err.message })
  }
}

const updateVenue = async (req, res) => {
  try {
    const { name, address1, address2, zip, totalSeats, seatTemplate, layoutImage } = req.body
    if (seatTemplate && seatTemplate.length > 0) {
      const rows = {};
      seatTemplate.forEach(seat => { rows[`${seat.block}_${seat.row}`] = (rows[`${seat.block}_${seat.row}`] || 0) + 1; });
      if (Object.values(rows).some(count => count > 40)) {
        return res.status(400).json({ message: 'Seats per row cannot exceed 40.' });
      }
    }
    const updateData = { name, address1, address2, zip, totalSeats, seatTemplate }
    if (layoutImage !== undefined) updateData.layoutImage = layoutImage
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    if (!venue) return res.status(404).json({ message: 'Venue not found' })
    res.json(venue)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update venue', error: err.message })
  }
}

const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id)
    if (!venue) return res.status(404).json({ message: 'Venue not found' })
    res.json({ message: 'Venue deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete venue', error: err.message })
  }
}

module.exports = { getVenuesPage, getAllVenues, getVenueById, createVenue, updateVenue, deleteVenue }