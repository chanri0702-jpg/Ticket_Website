const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  host:        { type: String },
  image:       { type: String },
  price:       { type: Number, required: true },
  venueID:     { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true }
})

module.exports = mongoose.model('Event', eventSchema)