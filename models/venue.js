const mongoose = require('mongoose')

const seatTemplateSchema = new mongoose.Schema({
  row:        { type: String, required: true },
  seatNumber: { type: Number, required: true },
  block:      { type: String, required: true }
})

const venueSchema = new mongoose.Schema({
  address1:     { type: String, required: true },
  address2:     { type: String },
  zip:          { type: String, required: true },
  totalSeats:   { type: Number, required: true },
  layoutImage:  { type: String },
  seatTemplate: [seatTemplateSchema]
})

module.exports = mongoose.model('Venue', venueSchema)