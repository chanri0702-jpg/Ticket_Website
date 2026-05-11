const mongoose = require('mongoose')

const seatSchema = new mongoose.Schema({
  row:         { type: String, required: true },
  seatNumber:  { type: Number, required: true },
  block:       { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  heldUntil:   { type: Date, default: null },
  heldBy:      { type: String, default: null } 
})

const timesSchema = new mongoose.Schema({
  eventID:        { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventTime:      { type: Date, required: true },
  seatsAvailable: { type: Number, required: true },
  totalSeats:     { type: Number, required: true },
  price:          { type: Number, default: 0 },
  priceType:      { type: String, enum: ['uniform', 'custom'], default: 'uniform' },
  blockPrices:    { type: Map, of: Number, default: null },
  seats:          [seatSchema]
})

module.exports = mongoose.model('Times', timesSchema)