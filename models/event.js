const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  host:        { type: String },
  category:    { type: String, required: true, enum: ['Concert', 'Sports', 'Theater', 'Conference', 'Other'] },
  image:       { type: String },
  price:       { type: Number, required: true },
  priceType:   { type: String, enum: ['uniform', 'custom'], default: 'uniform' },
  blockPrices: { type: Map, of: Number, default: null }, 
  venueID:     { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true }
})

module.exports = mongoose.model('Event', eventSchema)