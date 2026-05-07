const mongoose = require('mongoose')

const querySchema = new mongoose.Schema({
  email:    { type: String, ref: 'User', required: true },
  subject:  { type: String, required: true },
  message:  { type: String, required: true },
  status:   { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  response: { type: String, default: null }, // admin response
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
})

module.exports = mongoose.model('Enquery', querySchema)