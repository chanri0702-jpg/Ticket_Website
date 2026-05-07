const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:     { type: String, required: true },
  surname:  { type: String, required: true },
  password: { type: String, required: true },
  phone:    { type: String, required: true },
  role:     { type: String, enum: ['admin', 'user'], default: 'user' },
  address1: { type: String },
  address2: { type: String },
  city:     { type: String },
  zip:      { type: String },
  province: { type: String }
})

//---------------------------------------------------------
userSchema.pre('save', async function (next) {//mongodb hook before saving
  if (!this.isModified('password')) return next() //checks if password was changed
  this.password = await bcrypt.hash(this.password, 10) ///hash password via bycript
  next() //save user after hashing
})

module.exports = mongoose.model('User', userSchema)