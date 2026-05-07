const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
  row:        { type: String, required: true },
  seatNumber: { type: Number, required: true },
  block:      { type: String, required: true }
})

const bookingSchema = new mongoose.Schema({
  paydate: { type: Date,   required: true },
  email:   { type: String, ref: 'User',  required: true },
  total:   { type: Number, required: true },
  eventID: { type: mongoose.Schema.Types.ObjectId, ref: 'Event',  required: true },
  timeID:  { type: mongoose.Schema.Types.ObjectId, ref: 'Times',  required: true },
  tickets: [ticketSchema]
})

module.exports = mongoose.model('Booking', bookingSchema)